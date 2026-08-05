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
  transactions,
} from "@kostas/database";
import { projectStatusValues } from "@kostas/shared/schemas";
import type { ReportFilters } from "@kostas/shared/schemas";
import { DEMO_PAYMENT_DESCRIPTION_PREFIX } from "@/lib/demo-mode";
import type { ReportResult } from "../types";

/**
 * Every function here backs one entry in `reportTypeValues`
 * (packages/shared/src/schemas/report.ts). All but one run real aggregation
 * queries against the Drizzle schema (packages/database).
 *
 * "labor-cost" is the last mocked report: it needs timekeeping/payroll data
 * that no table holds yet, so it returns realistically-shaped fake data with
 * `isMocked: true` and is labeled as such in the UI (components/report-
 * viewer.tsx) and in the PDF export.
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
      return revenueReport(filters);
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

async function productionThroughputReport(
  filters: ReportFilters,
): Promise<ReportResult> {
  const conditions = [eq(productionStages.status, "done")];
  if (filters.from)
    conditions.push(gte(productionStages.completedAt, filters.from));
  if (filters.to)
    conditions.push(lte(productionStages.completedAt, filters.to));

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
    rows: rows.map((r) => ({
      label: r.name,
      value: Math.round(r.yards * 100) / 100,
    })),
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
      secondary:
        r.quantity <= r.reorderThreshold
          ? "Below reorder threshold"
          : undefined,
    })),
    totalLabel: "Total units on hand",
    total: rows.reduce((sum, r) => sum + r.quantity, 0),
  };
}

/**
 * Revenue actually collected, by month.
 *
 * Deliberately the same definition as the Finance module's revenue chart
 * (getMonthlyRevenue in ../../finance/api/queries.ts): succeeded payments
 * minus refunds, off the transactions table. Two "revenue" figures in one
 * app that disagree would be worse than the estimate this replaced.
 *
 * Demo payments are real rows written by recordDemoPaymentAction, so they
 * count here — but they carry the "[Demo payment]" description prefix, and
 * each month reports how much of its total came from them. While Stripe is
 * unconfigured that is every dollar, and the report says so rather than
 * presenting simulated collections as trading history.
 */
async function revenueReport(filters: ReportFilters): Promise<ReportResult> {
  const conditions = [eq(transactions.status, "succeeded")];
  if (filters.from) conditions.push(gte(transactions.occurredAt, filters.from));
  if (filters.to) conditions.push(lte(transactions.occurredAt, filters.to));

  const signedAmount = sql<string>`sum(case when ${transactions.type} = 'refund' then -${transactions.amount} else ${transactions.amount} end)`;
  const demoAmount = sql<string>`sum(case
    when ${transactions.description} like ${`${DEMO_PAYMENT_DESCRIPTION_PREFIX}%`}
      then case when ${transactions.type} = 'refund' then -${transactions.amount} else ${transactions.amount} end
    else 0 end)`;

  const rows = await db
    .select({
      month: sql<string>`to_char(${transactions.occurredAt}, 'YYYY-MM')`,
      revenue: signedAmount,
      demo: demoAmount,
    })
    .from(transactions)
    .where(and(...conditions))
    .groupBy(sql`to_char(${transactions.occurredAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${transactions.occurredAt}, 'YYYY-MM')`);

  const reportRows = rows.map((row) => {
    const value = Math.round(Number(row.revenue) * 100) / 100;
    const demo = Math.round(Number(row.demo) * 100) / 100;
    return {
      label: row.month,
      value,
      secondary:
        demo !== 0
          ? `includes $${demo.toFixed(2)} in demo payments`
          : undefined,
    };
  });

  return {
    type: "revenue",
    title: "Revenue (payments collected, net of refunds)",
    isMocked: false,
    generatedAt: new Date().toISOString(),
    rows: reportRows,
    totalLabel: "Collected ($)",
    total:
      Math.round(reportRows.reduce((sum, r) => sum + r.value, 0) * 100) / 100,
  };
}

// --- Mocked report (no Payroll module exists yet) ---

async function mockLaborCostReport(
  filters: ReportFilters,
): Promise<ReportResult> {
  // Fully synthetic: no timekeeping/payroll table exists. Shaped like a
  // real per-department labor report so the UI/export pipeline can be
  // built and swapped for a real query later without touching call sites.
  //
  // Department names match the room-based departments the shop board uses
  // (packages/shared/src/schemas/department-status.ts) — the old list still
  // named the retired process stages (Cutting, Sewing, Frame Shop).
  const mockRows = [
    { label: "Seamstress Room", value: 6800 },
    { label: "Upholstery Room", value: 9100 },
    { label: "Carpentry", value: 4200 },
    { label: "Paint", value: 3400 },
    { label: "Warehouse", value: 2200 },
    { label: "Office", value: 1800 },
  ];

  // The filters can't narrow synthetic rows, but they can be reported
  // honestly: a date range the user picked should never look like it was
  // silently applied.
  const range =
    filters.from || filters.to
      ? ` — date filter not applied (${filters.from?.toISOString().slice(0, 10) ?? "…"} to ${filters.to?.toISOString().slice(0, 10) ?? "…"})`
      : "";

  return {
    type: "labor-cost",
    title: `Labor Cost by Department (mocked — no Payroll module yet)${range}`,
    isMocked: true,
    generatedAt: new Date().toISOString(),
    rows: mockRows,
    totalLabel: "Estimated labor cost ($)",
    total: mockRows.reduce((sum, r) => sum + r.value, 0),
  };
}
