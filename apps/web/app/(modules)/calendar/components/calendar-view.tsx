"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventDropArg, DatesSetArg } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@kostas/ui";
import { deleteCalendarEventAction, moveCalendarEventAction } from "../api/actions";
import { CALENDAR_CATEGORIES, categoryFor } from "../lib/categories";
import { EventFormDialog, type EventFormDialogState } from "./event-form-dialog";
import { EventDetailsPanel } from "./event-details-panel";
import { CalendarHeading } from "./calendar-heading";
import type { FullCalendarEventInput } from "../types";
import "./calendar-theme.css";

const VIEWS = [
  { id: "dayGridMonth", label: "Month" },
  { id: "timeGridWeek", label: "Week" },
  { id: "timeGridDay", label: "Day" },
  { id: "listWeek", label: "List" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

const CHECK_MARK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3.5 8.5l3 3 6-6'/%3E%3C/svg%3E\")";

/**
 * FullCalendar wrapper using only the free community plugins (daygrid,
 * timegrid, list, interaction) — the paid Scheduler/Resource-Timeline
 * plugin is intentionally not used, matching the AG Grid free-tier-only
 * policy already applied elsewhere in this app.
 *
 * The deck (p10) puts navigation in the page header and wraps the grid in
 * two rails — calendar filters left, event details right — so
 * FullCalendar's own toolbar is hidden in calendar-theme.css and driven
 * through the imperative API instead.
 */
export function CalendarView({
  events: initialEvents,
  canWrite,
}: {
  events: FullCalendarEventInput[];
  canWrite: boolean;
}) {
  const calendarRef = useRef<FullCalendar>(null);
  const [dialogState, setDialogState] = useState<EventFormDialogState | null>(null);
  const [events, setEvents] = useState(initialEvents);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<ViewId>("dayGridMonth");
  const [title, setTitle] = useState("");
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());

  const refetchRange = useCallback(async (start: Date, end: Date) => {
    try {
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      const res = await fetch(`/api/calendar/events?${params}`);
      if (res.ok) {
        setEvents(await res.json());
      }
    } catch {
      // Non-fatal — keep showing the last-known event set.
    }
  }, []);

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      setTitle(arg.view.title);
      void refetchRange(arg.start, arg.end);
    },
    [refetchRange],
  );

  const visibleEvents = useMemo(
    () => events.filter((event) => !hidden.has(event.extendedProps.type)),
    [events, hidden],
  );

  const fcEvents = useMemo(
    () =>
      visibleEvents.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        color: categoryFor(event.extendedProps.type).color,
        editable: canWrite && !event.extendedProps.isRecurrenceInstance,
        classNames: event.id === selectedId ? ["is-selected"] : [],
        extendedProps: event.extendedProps,
      })),
    [visibleEvents, selectedId, canWrite],
  );

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedId) ?? null,
    [events, selectedId],
  );

  const api = useCallback(() => calendarRef.current?.getApi(), []);

  const handleViewChange = useCallback(
    (next: ViewId) => {
      setView(next);
      api()?.changeView(next);
    },
    [api],
  );

  // Clicking an event opens the read-only side panel (deck p10) — editing
  // is a deliberate second step behind "Edit Event", so a stray click on a
  // busy month grid can't drop the user into a form.
  const handleEventClick = useCallback((arg: EventClickArg) => {
    setSelectedId(arg.event.id);
  }, []);

  const openEditor = useCallback(() => {
    if (!selectedEvent) return;
    setDialogState({
      mode: "edit",
      id: selectedEvent.id,
      defaults: {
        title: selectedEvent.title,
        start: new Date(selectedEvent.start),
        end: new Date(selectedEvent.end),
        allDay: selectedEvent.allDay,
        type: selectedEvent.extendedProps.type,
        location: selectedEvent.extendedProps.location ?? "",
        notes: selectedEvent.extendedProps.notes ?? "",
      },
    });
  }, [selectedEvent]);

  const handleDelete = useCallback(async () => {
    if (!selectedEvent) return;
    if (!confirm("Delete this event?")) return;
    const result = await deleteCalendarEventAction(selectedEvent.id);
    if (result.success) {
      setEvents((current) => current.filter((event) => event.id !== selectedEvent.id));
      setSelectedId(null);
    }
  }, [selectedEvent]);

  const handleDateSelect = useCallback(
    (selectInfo: { start: Date; end: Date; allDay: boolean }) => {
      if (!canWrite) return;
      setDialogState({
        mode: "create",
        defaults: { start: selectInfo.start, end: selectInfo.end, allDay: selectInfo.allDay },
      });
    },
    [canWrite],
  );

  const persistMove = useCallback(async (id: string, start: Date, end: Date | null, allDay: boolean) => {
    await moveCalendarEventAction({ id, start, end: end ?? start, allDay });
  }, []);

  const handleEventDrop = useCallback(
    (arg: EventDropArg) => {
      void persistMove(arg.event.id, arg.event.start!, arg.event.end, arg.event.allDay);
    },
    [persistMove],
  );

  const handleEventResize = useCallback(
    (arg: EventResizeDoneArg) => {
      void persistMove(arg.event.id, arg.event.start!, arg.event.end, arg.event.allDay);
    },
    [persistMove],
  );

  const toggleCategory = useCallback((type: string) => {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState(null);
    const current = api();
    if (current) void refetchRange(current.view.activeStart, current.view.activeEnd);
  }, [api, refetchRange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <CalendarHeading />
        <div className="flex flex-wrap items-center gap-2">
          {canWrite ? (
            <Button onClick={() => setDialogState({ mode: "create" })}>
              <Plus aria-hidden />
              New Event
            </Button>
          ) : null}
          <Button variant="outline" className="h-9" onClick={() => api()?.today()}>
            Today
          </Button>
          <div className="flex items-center rounded-md border border-input">
            <button
              type="button"
              aria-label="Previous period"
              onClick={() => api()?.prev()}
              className="rounded-l-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next period"
              onClick={() => api()?.next()}
              className="rounded-r-md border-l border-input p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
          <span
            data-testid="calendar-period"
            className="min-w-40 rounded-md border border-input px-3 py-1.5 text-center text-sm font-medium"
          >
            {title || " "}
          </span>
          <div className="flex items-center rounded-md border border-input p-0.5">
            {VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={view === item.id}
                onClick={() => handleViewChange(item.id)}
                className={
                  view === item.id
                    ? "rounded-[0.3rem] bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
                    : "rounded-[0.3rem] px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_17rem]">
        <aside className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">My Calendars</h2>
          <ul className="flex flex-col gap-0.5">
            {CALENDAR_CATEGORIES.map((category) => {
              const checked = !hidden.has(category.type);
              return (
                <li key={category.type}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 text-sm transition-colors hover:bg-accent">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(category.type)}
                      className="size-4 shrink-0 cursor-pointer appearance-none rounded-[0.25rem] border-2 bg-center bg-no-repeat"
                      style={{
                        borderColor: category.color,
                        backgroundColor: checked ? category.color : "transparent",
                        backgroundImage: checked ? CHECK_MARK : undefined,
                      }}
                    />
                    <span className="truncate">{category.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="kostas-calendar overflow-hidden rounded-lg border border-border bg-card">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            headerToolbar={false}
            initialView="dayGridMonth"
            editable={canWrite}
            selectable={canWrite}
            selectMirror
            dayMaxEvents={3}
            eventDisplay="list-item"
            displayEventEnd={false}
            eventTimeFormat={{
              hour: "numeric",
              minute: "2-digit",
              omitZeroMinute: true,
              meridiem: "short",
            }}
            dayHeaderFormat={{ weekday: "short" }}
            events={fcEvents}
            eventClick={handleEventClick}
            select={handleDateSelect}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            datesSet={handleDatesSet}
            height="auto"
          />
        </div>

        <aside className="rounded-lg border border-border bg-card xl:min-h-[32rem]">
          <EventDetailsPanel
            event={selectedEvent}
            canWrite={canWrite}
            onClose={() => setSelectedId(null)}
            onEdit={openEditor}
            onDelete={handleDelete}
          />
        </aside>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-lg border border-border bg-card px-4 py-3">
        {CALENDAR_CATEGORIES.map((category) => (
          <span key={category.type} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: category.color }} aria-hidden />
            {category.label}
          </span>
        ))}
      </div>

      <EventFormDialog state={dialogState} onClose={closeDialog} />
    </div>
  );
}
