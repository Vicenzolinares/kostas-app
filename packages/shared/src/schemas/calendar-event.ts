import { z } from "zod";

export const calendarEventTypeValues = [
  "measurement_appointment",
  "fabric_delivery",
  "production",
  "quality_check",
  "delivery_installation",
  "other",
] as const;
export const calendarEventTypeSchema = z.enum(calendarEventTypeValues);
export type CalendarEventType = z.infer<typeof calendarEventTypeSchema>;

export const createCalendarEventSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    type: calendarEventTypeSchema.default("other"),
    start: z.coerce.date(),
    end: z.coerce.date(),
    allDay: z.coerce.boolean().default(false),
    // Standard iCalendar RRULE string (e.g. "FREQ=WEEKLY;BYDAY=MO,WE,FR"),
    // expanded server-side with the `rrule` package — keeps us on
    // FullCalendar's free daygrid/timegrid/list/interaction plugins
    // instead of the paid Scheduler/Resource-Timeline plugin.
    rrule: z.string().trim().max(500).optional().or(z.literal("")),
    location: z.string().trim().max(300).optional().or(z.literal("")),
    notes: z.string().trim().max(4000).optional().or(z.literal("")),
    projectId: z.string().uuid().optional().nullable(),
    workOrderId: z.string().uuid().optional().nullable(),
    assignedToId: z.string().uuid().optional().nullable(),
  })
  .refine((data) => data.end >= data.start, {
    message: "End must be after start",
    path: ["end"],
  });
export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;

export const updateCalendarEventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  type: calendarEventTypeSchema.optional(),
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
  allDay: z.coerce.boolean().optional(),
  rrule: z.string().trim().max(500).optional().or(z.literal("")),
  location: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  projectId: z.string().uuid().optional().nullable(),
  workOrderId: z.string().uuid().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
});
export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>;

// Used by the FullCalendar drag/resize handlers to persist a moved event.
export const moveCalendarEventSchema = z.object({
  id: z.string().uuid(),
  start: z.coerce.date(),
  end: z.coerce.date(),
  allDay: z.coerce.boolean().optional(),
});
export type MoveCalendarEventInput = z.infer<typeof moveCalendarEventSchema>;

export const calendarRangeSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
});
export type CalendarRange = z.infer<typeof calendarRangeSchema>;
