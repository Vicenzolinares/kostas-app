import type { CalendarEvent } from "@kostas/database/schema";

export type { CalendarEvent };

/** Shape FullCalendar's <FullCalendar events={...} /> prop expects. */
export interface FullCalendarEventInput {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  extendedProps: {
    type: CalendarEvent["type"];
    location: string | null;
    notes: string | null;
    projectId: string | null;
    workOrderId: string | null;
    assignedToId: string | null;
    /* Resolved joins so the details panel can name what an event links to
       instead of rendering raw UUIDs. Null when the row has no relation —
       the panel omits the section rather than inventing a placeholder. */
    assignedToName: string | null;
    workOrderNumber: string | null;
    projectName: string | null;
    isRecurrenceInstance?: boolean;
  };
}
