import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";

export const itemsInventory = pgTable("items_inventory", {
  id: uuid("id").primaryKey().defaultRandom(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  category: text("category"),
  quantity: integer("quantity").notNull().default(0),
  unit: text("unit").notNull().default("ea"),
  binLocation: text("bin_location"),
  reorderThreshold: integer("reorder_threshold").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ItemInventory = typeof itemsInventory.$inferSelect;
export type NewItemInventory = typeof itemsInventory.$inferInsert;
