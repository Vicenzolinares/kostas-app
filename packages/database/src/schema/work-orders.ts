import { pgTable, pgEnum, uuid, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projects } from "./projects";
import { fabricInventory } from "./fabric-inventory";
import { users } from "./users";
import type { WorkOrderSpecifications } from "@kostas/shared/schemas";

export const workOrderTypeEnum = pgEnum("work_order_type", [
  "reupholstery",
  "custom_build",
  "repair",
  "cushion_only",
  "frame_only",
]);

export const workOrderStatusEnum = pgEnum("work_order_status", [
  "draft",
  "pending_approval",
  "approved",
  "in_production",
  "completed",
  "cancelled",
]);

// One row per generated work order. `specifications` holds the wizard's
// free-form step data (measurements references, construction notes, etc.)
// as JSON so the wizard schema can evolve without a migration per field.
export const workOrders = pgTable("work_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: text("order_number").notNull().unique(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: workOrderTypeEnum("type").notNull(),
  status: workOrderStatusEnum("status").notNull().default("draft"),
  specifications: jsonb("specifications")
    .$type<WorkOrderSpecifications>()
    .notNull()
    .default({ furniturePieces: [], measurementReferenceIds: [] }),
  assignedToId: uuid("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
  dueDate: timestamp("due_date", { withTimezone: true, mode: "date" }),
  pdfStorageKey: text("pdf_storage_key"),
  createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type WorkOrder = typeof workOrders.$inferSelect;
export type NewWorkOrder = typeof workOrders.$inferInsert;

// Fabrics selected for a work order in the wizard's "Fabric" step. Kept as
// its own join table (rather than reusing project_fabrics) because a work
// order may specify yardage/cut instructions independent of the project's
// overall fabric allocation.
export const workOrderFabrics = pgTable("work_order_fabrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  workOrderId: uuid("work_order_id")
    .notNull()
    .references(() => workOrders.id, { onDelete: "cascade" }),
  fabricId: uuid("fabric_id")
    .notNull()
    .references(() => fabricInventory.id, { onDelete: "restrict" }),
  yardsAllocated: text("yards_allocated").notNull(),
  cutNotes: text("cut_notes"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type WorkOrderFabric = typeof workOrderFabrics.$inferSelect;
export type NewWorkOrderFabric = typeof workOrderFabrics.$inferInsert;

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  project: one(projects, { fields: [workOrders.projectId], references: [projects.id] }),
  assignedTo: one(users, { fields: [workOrders.assignedToId], references: [users.id] }),
  createdBy: one(users, { fields: [workOrders.createdById], references: [users.id] }),
  fabrics: many(workOrderFabrics),
}));

export const workOrderFabricsRelations = relations(workOrderFabrics, ({ one }) => ({
  workOrder: one(workOrders, { fields: [workOrderFabrics.workOrderId], references: [workOrders.id] }),
  fabric: one(fabricInventory, { fields: [workOrderFabrics.fabricId], references: [fabricInventory.id] }),
}));
