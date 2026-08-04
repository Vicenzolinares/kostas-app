import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projects } from "./projects";
import type { ProductionTask, BlockedReason } from "@kostas/shared/schemas";

// The shop-floor rooms a project physically passes through — one per
// department TV in the mockup deck. Mirrors `departmentKeyValues` in
// @kostas/shared/schemas; Postgres enums can't import a TS union, so the
// two lists are kept in sync by hand. Fixed list for now (no admin UI to
// add/remove departments yet) — see docs/PROGRESS.md.
export const departmentKeyEnum = pgEnum("department_key", [
  "seamstress",
  "upholstery",
  "carpentry",
  "paint",
  "warehouse",
  "office",
]);

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: departmentKeyEnum("key").notNull().unique(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  capacityPerDay: integer("capacity_per_day").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
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
  // --- shop-board display fields (module 16) ---------------------------
  // The department TV shows a per-job checklist, a due date, a RUSH flag
  // and, when blocked, the reason. Tasks are JSONB rather than their own
  // table: they're display-only checklist items owned entirely by their
  // stage, always read as a whole, and never queried across stages —
  // the same reasoning as work_orders.specifications.
  tasks: jsonb("tasks").$type<ProductionTask[]>().notNull().default([]),
  blockedReason: text("blocked_reason").$type<BlockedReason | null>(),
  isRush: boolean("is_rush").notNull().default(false),
  dueDate: timestamp("due_date", { withTimezone: true, mode: "date" }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ProductionStage = typeof productionStages.$inferSelect;
export type NewProductionStage = typeof productionStages.$inferInsert;

export const departmentsRelations = relations(departments, ({ many }) => ({
  stages: many(productionStages),
}));

export const productionStagesRelations = relations(
  productionStages,
  ({ one }) => ({
    project: one(projects, {
      fields: [productionStages.projectId],
      references: [projects.id],
    }),
    department: one(departments, {
      fields: [productionStages.departmentId],
      references: [departments.id],
    }),
  }),
);
