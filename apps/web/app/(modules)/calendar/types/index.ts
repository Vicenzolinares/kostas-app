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
    isRecurrenceInstance?: boolean;
  };
}
