import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projects } from "./projects";
import type { MeasurementCanvas } from "@kostas/shared/schemas";

export const clientMeasurements = pgTable("client_measurements", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  furniturePiece: text("furniture_piece").notNull(),
  notes: text("notes"),
  canvasData: jsonb("canvas_data").$type<MeasurementCanvas>().notNull(),
  referencePhotoKey: text("reference_photo_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ClientMeasurement = typeof clientMeasurements.$inferSelect;
export type NewClientMeasurement = typeof clientMeasurements.$inferInsert;

export const clientMeasurementsRelations = relations(clientMeasurements, ({ one }) => ({
  project: one(projects, {
    fields: [clientMeasurements.projectId],
    references: [projects.id],
  }),
}));
