import { pgTable, pgEnum, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projects } from "./projects";

// The shop-floor stations a project physically passes through. Fixed list
// for now (no admin UI to add/remove departments yet) — see docs/PROGRESS.md.
export const departmentKeyEnum = pgEnum("department_key", [
  "cutting",
  "sewing",
  "upholstery",
  "frame_shop",
  "quality_check",
  "delivery",
]);

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: departmentKeyEnum("key").notNull().unique(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  capacityPerDay: integer("capacity_per_day").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export const productionStageStatusEnum = pgEnum("production_stage_status", [
  "queued",
  "in_progress",
  "blocked",
  "done",
]);

// One row per (project, department): the live production-status board reads
// this table. `PollingRealtimeProvider` (packages/realtime) is what keeps
// module 13's dashboard and module 16's kiosk board fresh against it.
export const productionStages = pgTable("production_stages", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "restrict" }),
  status: productionStageStatusEnum("status").notNull().default("queued"),
  assignedTo: text("assigned_to"),
  notes: text("notes"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ProductionStage = typeof productionStages.$inferSelect;
export type NewProductionStage = typeof productionStages.$inferInsert;

export const departmentsRelations = relations(departments, ({ many }) => ({
  stages: many(productionStages),
}));

export const productionStagesRelations = relations(productionStages, ({ one }) => ({
  project: one(projects, {
    fields: [productionStages.projectId],
    references: [projects.id],
  }),
  department: one(departments, {
    fields: [productionStages.departmentId],
    references: [departments.id],
  }),
}));
