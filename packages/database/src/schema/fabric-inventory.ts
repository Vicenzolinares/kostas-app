import { pgTable, uuid, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projectFabrics } from "./project-fabrics";

export const fabricInventory = pgTable("fabric_inventory", {
  id: uuid("id").primaryKey().defaultRandom(),
  fabricCode: text("fabric_code").notNull().unique(),
  name: text("name").notNull(),
  mill: text("mill"),
  color: text("color"),
  pattern: text("pattern"),
  composition: text("composition"),
  widthInches: numeric("width_inches", { precision: 6, scale: 2 }),
  costPerYard: numeric("cost_per_yard", { precision: 10, scale: 2 }),
  yardsInStock: numeric("yards_in_stock", { precision: 10, scale: 2 }).notNull().default("0"),
  yardsReserved: numeric("yards_reserved", { precision: 10, scale: 2 }).notNull().default("0"),
  warehouseLocation: text("warehouse_location"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FabricInventory = typeof fabricInventory.$inferSelect;
export type NewFabricInventory = typeof fabricInventory.$inferInsert;

export const fabricInventoryRelations = relations(fabricInventory, ({ many }) => ({
  projectFabrics: many(projectFabrics),
}));
