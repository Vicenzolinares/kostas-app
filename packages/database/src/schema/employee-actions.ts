import { pgTable, pgEnum, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { projects } from "./projects";

export const employeeActionTypeEnum = pgEnum("employee_action_type", [
  "clock_in",
  "clock_out",
  "task_note",
  "photo_upload",
]);

// Server-side landing table for actions queued offline by the PWA
// (packages/... Zustand offline queue -> apps/web (modules)/employee-portal
// /lib/offline-queue.ts) and flushed once connectivity returns. `clientId`
// is a client-generated UUID used to de-dupe a queued action replayed twice.
export const employeeActions = pgTable("employee_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: text("client_id").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  type: employeeActionTypeEnum("type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  photoKey: text("photo_key"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
});

export type EmployeeAction = typeof employeeActions.$inferSelect;
export type NewEmployeeAction = typeof employeeActions.$inferInsert;

export const employeeActionsRelations = relations(employeeActions, ({ one }) => ({
  user: one(users, {
    fields: [employeeActions.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [employeeActions.projectId],
    references: [projects.id],
  }),
}));
