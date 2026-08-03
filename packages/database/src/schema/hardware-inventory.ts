import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";

// Hardware items (legs, nails, staples, springs, zippers, etc.) tracked by
// barcode/QR code so shop floor staff can scan in/out instead of typing SKUs.
export const hardwareInventory = pgTable("hardware_inventory", {
  id: uuid("id").primaryKey().defaultRandom(),
  sku: text("sku").notNull().unique(),
  barcode: text("barcode").unique(),
  name: text("name").notNull(),
  category: text("category"),
  quantity: integer("quantity").notNull().default(0),
  unit: text("unit").notNull().default("ea"),
  binLocation: text("bin_location"),
  reorderThreshold: integer("reorder_threshold").notNull().default(0),
  supplier: text("supplier"),
  costPerUnit: text("cost_per_unit"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type HardwareInventory = typeof hardwareInventory.$inferSelect;
export type NewHardwareInventory = typeof hardwareInventory.$inferInsert;

// Append-only log of scan events (barcode/QR) so stock changes are
// auditable — every scan-in/scan-out/adjustment creates a row here.
export const hardwareScanEventTypeEnum = ["scan_in", "scan_out", "adjustment"] as const;

export const hardwareScanEvents = pgTable("hardware_scan_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  hardwareId: uuid("hardware_id")
    .notNull()
    .references(() => hardwareInventory.id, { onDelete: "cascade" }),
  type: text("type", { enum: hardwareScanEventTypeEnum }).notNull(),
  quantityDelta: integer("quantity_delta").notNull(),
  scannedCode: text("scanned_code"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type HardwareScanEvent = typeof hardwareScanEvents.$inferSelect;
export type NewHardwareScanEvent = typeof hardwareScanEvents.$inferInsert;
