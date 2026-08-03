import { pgTable, pgEnum, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projects } from "./projects";
import { workOrders } from "./work-orders";
import { users } from "./users";

export const calendarEventTypeEnum = pgEnum("calendar_event_type", [
  "measurement_appointment",
  "fabric_delivery",
  "production",
  "quality_check",
  "delivery_installation",
  "other",
]);

// FullCalendar-friendly event model: start/end + an rrule string for
// recurrence (FullCalendar's `rrule` plugin-free approach — we expand
// recurrence server-side in the query layer using `rrule` npm package
// rather than pulling in the paid Scheduler plugin).
export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  type: calendarEventTypeEnum("type").notNull().default("other"),
  start: timestamp("start", { withTimezone: true }).notNull(),
  end: timestamp("end", { withTimezone: true }).notNull(),
  allDay: boolean("all_day").notNull().default(false),
  rrule: text("rrule"),
  location: text("location"),
  notes: text("notes"),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  workOrderId: uuid("work_order_id").references(() => workOrders.id, { onDelete: "cascade" }),
  assignedToId: uuid("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  project: one(projects, { fields: [calendarEvents.projectId], references: [projects.id] }),
  workOrder: one(workOrders, { fields: [calendarEvents.workOrderId], references: [workOrders.id] }),
  assignedTo: one(users, { fields: [calendarEvents.assignedToId], references: [users.id] }),
}));
