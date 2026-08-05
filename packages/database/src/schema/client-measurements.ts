import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projects } from "./projects";
import type {
  MeasurementCanvas,
  MeasurementSheet,
} from "@kostas/shared/schemas";

export const clientMeasurements = pgTable("client_measurements", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  furniturePiece: text("furniture_piece").notNull(),
  notes: text("notes"),
  canvasData: jsonb("canvas_data").$type<MeasurementCanvas>().notNull(),
  // The illustrated sheets from deck p4 (sofa / window callouts). Its own
  // column rather than a field inside canvas_data: the two are independent
  // records of the same visit — the freeform sketch is what someone drew,
  // this is the standard dimension set — and neither should have to be
  // read or rewritten to update the other.
  sheets: jsonb("sheets").$type<MeasurementSheet[]>().notNull().default([]),
  referencePhotoKey: text("reference_photo_key"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ClientMeasurement = typeof clientMeasurements.$inferSelect;
export type NewClientMeasurement = typeof clientMeasurements.$inferInsert;

export const clientMeasurementsRelations = relations(
  clientMeasurements,
  ({ one }) => ({
    project: one(projects, {
      fields: [clientMeasurements.projectId],
      references: [projects.id],
    }),
  }),
);
