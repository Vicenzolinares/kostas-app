import { pgTable, pgEnum, uuid, text, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { clientMeasurements } from "./client-measurements";
import { projectFabrics } from "./project-fabrics";

export const projectStatusEnum = pgEnum("project_status", [
  "lead",
  "quoted",
  "approved",
  "in_progress",
  "quality_check",
  "ready_for_delivery",
  "completed",
  "cancelled",
]);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  status: projectStatusEnum("status").notNull().default("lead"),
  description: text("description"),
  dueDate: date("due_date", { mode: "date" }),
  budget: numeric("budget", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export const projectsRelations = relations(projects, ({ many }) => ({
  clientMeasurements: many(clientMeasurements),
  projectFabrics: many(projectFabrics),
}));
