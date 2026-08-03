import "server-only";
import { count, eq, sql } from "drizzle-orm";
import {
  db,
  projects,
  itemsInventory,
  fabricInventory,
  dashboardLayouts,
} from "@kostas/database";

export async function getDashboardKpis() {
  const [[projectCount], [lowStockCount], [fabricYards]] = await Promise.all([
    db.select({ value: count() }).from(projects),
    db
      .select({ value: count() })
      .from(itemsInventory)
      .where(
        sql`${itemsInventory.quantity} <= ${itemsInventory.reorderThreshold}`,
      ),
    db
      .select({
        value: sql<string>`coalesce(sum(${fabricInventory.yardsInStock}), 0)`,
      })
      .from(fabricInventory),
  ]);

  return {
    totalProjects: projectCount?.value ?? 0,
    lowStockItems: lowStockCount?.value ?? 0,
    totalFabricYards: Number(fabricYards?.value ?? 0),
  };
}

export async function getProjectsByStatus() {
  const rows = await db
    .select({ status: projects.status, value: count() })
    .from(projects)
    .groupBy(projects.status);

  return rows.map((row) => ({ status: row.status, count: row.value }));
}

export async function getDashboardLayout(userId: string) {
  const row = await db.query.dashboardLayouts.findFirst({
    where: eq(dashboardLayouts.userId, userId),
  });
  return row?.layout ?? null;
}
