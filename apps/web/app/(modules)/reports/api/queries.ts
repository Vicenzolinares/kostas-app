import "server-only";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import {
  db,
  projects,
  productionStages,
  departments,
  fabricInventory,
  itemsInventory,
  projectFabrics,
} from "@kostas/database";
import { projectStatusValues } from "@kostas/shared/schemas";
import type { ReportFilters } from "@kostas/shared/schemas";
import type { ReportResult } from "../types";

/**
 * Every function here backs one entry in `reportTypeValues`
 * (packages/shared/src/schemas/report.ts). "project-pipeline",
 * "production-throughput", "fabric-usage", and "inventory-levels" run real
 * aggregation queries against the Drizzle schema (packages/database).
 * "revenue" and "labor-cost" are mocked — there is no Finance or Payroll
 * module/table yet, so those two return realistically-shaped fake data
 * with `isMocked: true` and are clearly labeled as such in the UI
 * (see components/report-viewer.tsx).
 */
export async function runReport(filters: ReportFilters): Promise<ReportResult> {
  switch (filters.type) {
    case "project-pipeline":
      return projectPipelineReport();
    case "production-throughput":
      return productionThroughputReport(filters);
    case "fabric-usage":
      return fabricUsageReport();
    case "inventory-levels":
      return inventoryLevelsReport();
    case "revenue":
      return mockRevenueReport(filters);
    case "labor-cost":
      return mockLaborCostReport(filters);
  }
}

async function projectPipelineReport(): Promise<ReportResult> {
  const rows = await db
    .select({ status: projects.status, count: sql<number>`count(*)::int` })
    .from(projects)
    .groupBy(projects.status);

  const byStatus = new Map(rows.map((r) => [r.status, r.count]));
  const reportRows = projectStatusValues.map((status) => ({
    label: status,
    value: byStatus.get(status) ?? 0,
  }));

  return {
    type: "project-pipeline",
    title: "Project Pipeline",
    isMocked: false,
    generatedAt: new Date().toISOString(),
    rows: reportRows,
    totalLabel: "Total projects",
    total: reportRows.reduce((sum, r) => sum + r.value, 0),
  };
}

async function productionThroughputReport(filters: ReportFilters): Promise<ReportResult> {
  const conditions = [eq(productionStages.status, "done")];
  if (filters.from) conditions.push(gte(productionStages.completedAt, filters.from));
  if (filters.to) conditions.push(lte(productionStages.completedAt, filters.to));

  const rows = await db
    .select({ name: departments.name, count: sql<number>`count(*)::int` })
    .from(productionStages)
    .innerJoin(departments, eq(productionStages.departmentId, departments.id))
    .where(and(...conditions))
    .groupBy(departments.name);

  return {
    type: "production-throughput",
    title: "Production Throughput (completed stages)",
    isMocked: false,
    generatedAt: new Date().toISOString(),
    rows: rows.map((r) => ({ label: r.name, value: r.count })),
    totalLabel: "Stages completed",
    total: rows.reduce((sum, r) => sum + r.count, 0),
  };
}

async function fabricUsageReport(): Promise<ReportResult> {
  const rows = await db
    .select({
      name: fabricInventory.name,
      yards: sql<number>`coalesce(sum(${projectFabrics.yardsRequired}), 0)::float`,
    })
    .from(fabricInventory)
    .leftJoin(projectFabrics, eq(projectFabrics.fabricId, fabricInventory.id))
    .groupBy(fabricInventory.id, fabricInventory.name)
    .orderBy(sql`sum(${projectFabrics.yardsRequired}) desc nulls last`);

  return {
    type: "fabric-usage",
    title: "Fabric Usage (yards allocated to projects)",
    isMocked: false,
    generatedAt: new Date().toISOString(),
    rows: rows.map((r) => ({ label: r.name, value: Math.round(r.yards * 100) / 100 })),
    totalLabel: "Total yards",
    total: Math.round(rows.reduce((sum, r) => sum + r.yards, 0) * 100) / 100,
  };
}

async function inventoryLevelsReport(): Promise<ReportResult> {
  const rows = await db
    .select({
      name: itemsInventory.name,
      quantity: itemsInventory.quantity,
      reorderThreshold: itemsInventory.reorderThreshold,
    })
    .from(itemsInventory)
    .orderBy(itemsInventory.name);

  return {
    type: "inventory-levels",
    title: "Inventory Levels",
    isMocked: false,
    generatedAt: new Date().toISOString(),
    rows: rows.map((r) => ({
      label: r.name,
      value: r.quantity,
      secondary: r.quantity <= r.reorderThreshold ? "Below reorder threshold" : undefined,
    })),
    totalLabel: "Total units on hand",
    total: rows.reduce((sum, r) => sum + r.quantity, 0),
  };
}

// --- Mocked reports (no Finance/Payroll module exists yet) ---

async function mockRevenueReport(filters: ReportFilters): Promise<ReportResult> {
  // Estimated from project budgets (the only dollar figure that exists
  // today) as a stand-in for real invoiced revenue.
  const conditions = [];
  if (filters.from) conditions.push(gte(projects.createdAt, filters.from));
  if (filters.to) conditions.push(lte(projects.createdAt, filters.to));

  const rows = await db
    .select({ status: projects.status, budget: projects.budget })
    .from(projects)
    .where(conditions.length ? and(...conditions) : undefined);

  const byStatus = new Map<string, number>();
  for (const row of rows) {
    const amount = row.budget ? Number(row.budget) : 0;
    byStatus.set(row.status, (byStatus.get(row.status) ?? 0) + amount);
  }

  const reportRows = Array.from(byStatus.entries()).map(([label, value]) => ({
    label,
    value: Math.round(value * 100) / 100,
  }));

  return {
    type: "revenue",
    title: "Revenue (estimated from project budgets — mocked, no Finance module yet)",
    isMocked: true,
    generatedAt: new Date().toISOString(),
    rows: reportRows,
    totalLabel: "Estimated revenue ($)",
    total: Math.round(reportRows.reduce((sum, r) => sum + r.value, 0) * 100) / 100,
  };
}

async function mockLaborCostReport(_filters: ReportFilters): Promise<ReportResult> {
  // Fully synthetic: no timekeeping/payroll table exists. Shaped like a
  // real per-department labor report so the UI/export pipeline can be
  // built and swapped for a real query later without touching call sites.
  const mockRows = [
    { label: "Cutting", value: 4200 },
    { label: "Sewing", value: 6800 },
    { label: "Upholstery", value: 9100 },
    { label: "Frame Shop", value: 3400 },
    { label: "Quality Check", value: 1800 },
    { label: "Delivery", value: 2200 },
  ];

  return {
    type: "labor-cost",
    title: "Labor Cost by Department (mocked — no Payroll module yet)",
    isMocked: true,
    generatedAt: new Date().toISOString(),
    rows: mockRows,
    totalLabel: "Estimated labor cost ($)",
    total: mockRows.reduce((sum, r) => sum + r.value, 0),
  };
}
