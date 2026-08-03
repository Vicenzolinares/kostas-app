import { pgTable, uuid, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

export interface DashboardWidgetLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  widget: string;
}

// One row per user: persists their GridStack widget layout.
export const dashboardLayouts = pgTable("dashboard_layouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  layout: jsonb("layout").$type<DashboardWidgetLayout[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DashboardLayout = typeof dashboardLayouts.$inferSelect;
export type NewDashboardLayout = typeof dashboardLayouts.$inferInsert;
