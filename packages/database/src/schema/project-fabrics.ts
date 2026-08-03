import { pgTable, pgEnum, uuid, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projects } from "./projects";
import { fabricInventory } from "./fabric-inventory";

export const projectFabricStatusEnum = pgEnum("project_fabric_status", [
  "draft",
  "ordered",
  "received",
  "cut",
  "installed",
]);

export const projectFabrics = pgTable("project_fabrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  fabricId: uuid("fabric_id")
    .notNull()
    .references(() => fabricInventory.id, { onDelete: "restrict" }),
  yardsRequired: numeric("yards_required", { precision: 10, scale: 2 }).notNull(),
  status: projectFabricStatusEnum("status").notNull().default("draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ProjectFabric = typeof projectFabrics.$inferSelect;
export type NewProjectFabric = typeof projectFabrics.$inferInsert;

export const projectFabricsRelations = relations(projectFabrics, ({ one }) => ({
  project: one(projects, {
    fields: [projectFabrics.projectId],
    references: [projects.id],
  }),
  fabric: one(fabricInventory, {
    fields: [projectFabrics.fabricId],
    references: [fabricInventory.id],
  }),
}));
