"use client";

import { useCallback, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventDropArg, DatesSetArg } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { moveCalendarEventAction } from "../api/actions";
import { EventFormDialog, type EventFormDialogState } from "./event-form-dialog";
import type { FullCalendarEventInput } from "../types";

const EVENT_COLOR: Record<string, string> = {
  measurement_appointment: "#2563eb",
  fabric_delivery: "#d97706",
  production: "#16a34a",
  quality_check: "#9333ea",
  delivery_installation: "#0891b2",
  other: "#64748b",
};

/**
 * FullCalendar wrapper using only the free community plugins (daygrid,
 * timegrid, list, interaction) — the paid Scheduler/Resource-Timeline
 * plugin is intentionally not used, matching the AG Grid free-tier-only
 * policy already applied elsewhere in this app.
 */
export function CalendarView({ events: initialEvents }: { events: FullCalendarEventInput[] }) {
  const [dialogState, setDialogState] = useState<EventFormDialogState | null>(null);
  const [events, setEvents] = useState(initialEvents);

  const handleDatesSet = useCallback(async (arg: DatesSetArg) => {
    try {
      const params = new URLSearchParams({
        start: arg.start.toISOString(),
        end: arg.end.toISOString(),
      });
      const res = await fetch(`/api/calendar/events?${params}`);
      if (res.ok) {
        setEvents(await res.json());
      }
    } catch {
      // Non-fatal — keep showing the last-known event set.
    }
  }, []);

  const fcEvents = useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        color: EVENT_COLOR[event.extendedProps.type],
        editable: !event.extendedProps.isRecurrenceInstance,
        extendedProps: event.extendedProps,
      })),
    [events],
  );

  const handleEventClick = useCallback((arg: EventClickArg) => {
    setDialogState({
      mode: "edit",
      id: arg.event.id,
      defaults: {
        title: arg.event.title,
        start: arg.event.start ?? undefined,
        end: arg.event.end ?? undefined,
        allDay: arg.event.allDay,
        type: arg.event.extendedProps.type,
        location: arg.event.extendedProps.location ?? "",
        notes: arg.event.extendedProps.notes ?? "",
      },
    });
  }, []);

  const handleDateSelect = useCallback((selectInfo: { start: Date; end: Date; allDay: boolean }) => {
    setDialogState({
      mode: "create",
      defaults: { start: selectInfo.start, end: selectInfo.end, allDay: selectInfo.allDay },
    });
  }, []);

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

  return (
    <div className="rounded-md border border-border bg-card p-2">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        initialView="dayGridMonth"
        editable
        selectable
        selectMirror
        dayMaxEvents
        events={fcEvents}
        eventClick={handleEventClick}
        select={handleDateSelect}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        datesSet={handleDatesSet}
        height="auto"
      />
      <EventFormDialog state={dialogState} onClose={() => setDialogState(null)} />
    </div>
  );
}
