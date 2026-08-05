"use client";

import Link from "next/link";
import { Clock, MapPin, Pencil, Trash2, X, FileText, CalendarDays } from "lucide-react";
import { Button } from "@kostas/ui";
import { categoryFor } from "../lib/categories";
import type { FullCalendarEventInput } from "../types";

interface EventDetailsPanelProps {
  event: FullCalendarEventInput | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canWrite: boolean;
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatRange(event: FullCalendarEventInput) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const day = start.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (event.allDay) return { day, time: "All day" };

  const time = `${start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} – ${end.toLocaleTimeString(
    undefined,
    { hour: "numeric", minute: "2-digit" },
  )}`;
  const minutes = Math.round((end.getTime() - start.getTime()) / 60_000);
  const duration =
    minutes >= 60
      ? `${Number((minutes / 60).toFixed(1))} hr`
      : `${minutes} min`;
  return { day, time: `${time} (${duration})` };
}

export function EventDetailsPanel({
  event,
  onClose,
  onEdit,
  onDelete,
  canWrite,
}: EventDetailsPanelProps) {
  if (!event) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <CalendarDays className="size-8 text-muted-foreground/50" aria-hidden />
        <p className="text-sm font-medium">No event selected</p>
        <p className="text-xs text-muted-foreground">
          Pick an event in the grid to see its details here.
        </p>
      </div>
    );
  }

  const category = categoryFor(event.extendedProps.type);
  const { day, time } = formatRange(event);
  const { location, notes, assignedToName, workOrderNumber, projectName, projectId, workOrderId } =
    event.extendedProps;
  const hasRelated = Boolean(workOrderId ?? projectId);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Event Details</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close event details"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
        <div>
          <div className="flex items-start gap-2">
            <span
              className="mt-1.5 size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: category.color }}
              aria-hidden
            />
            <h3 className="text-base font-semibold leading-snug">{event.title}</h3>
          </div>
          {workOrderNumber ? (
            <p className="ml-4.5 text-xs text-muted-foreground">Work Order {workOrderNumber}</p>
          ) : projectName ? (
            <p className="ml-4.5 text-xs text-muted-foreground">{projectName}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <div className="flex gap-2.5">
            <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <p className="font-medium">{day}</p>
              <p className="text-muted-foreground">{time}</p>
            </div>
          </div>
          {location ? (
            <div className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <p className="font-medium">{location}</p>
            </div>
          ) : null}
        </div>

        <div>
          <h4 className="mb-1.5 text-xs font-semibold">Calendar</h4>
          <div className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: category.color }}
              aria-hidden
            />
            <span className="text-muted-foreground">{category.label}</span>
          </div>
        </div>

        {assignedToName ? (
          <div>
            <h4 className="mb-1.5 text-xs font-semibold">Assigned To</h4>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-[0.625rem] font-semibold text-secondary-foreground">
                {initialsOf(assignedToName)}
              </span>
              <span className="text-sm">{assignedToName}</span>
            </div>
          </div>
        ) : null}

        {notes ? (
          <div className="border-t border-border pt-4">
            <h4 className="mb-1.5 text-xs font-semibold">Notes</h4>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{notes}</p>
          </div>
        ) : null}

        {hasRelated ? (
          <div className="border-t border-border pt-4">
            <h4 className="mb-2 text-xs font-semibold">Related</h4>
            <div className="flex flex-col gap-2">
              {workOrderId ? (
                <Link
                  href={`/work-orders/${workOrderId}`}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText className="size-4 shrink-0" aria-hidden />
                  <span>
                    {workOrderNumber ?? "Work order"}
                    {projectName ? ` – ${projectName}` : ""}
                  </span>
                </Link>
              ) : null}
              {projectId ? (
                <Link
                  href={`/project-view/${projectId}`}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText className="size-4 shrink-0" aria-hidden />
                  <span>{projectName ?? "Project"}</span>
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {canWrite ? (
        <div className="flex flex-col gap-2 border-t border-border p-4">
          <Button variant="outline" onClick={onEdit} className="text-primary">
            <Pencil aria-hidden />
            Edit Event
          </Button>
          <Button
            variant="ghost"
            onClick={onDelete}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 aria-hidden />
            Delete Event
          </Button>
        </div>
      ) : null}
    </div>
  );
}
