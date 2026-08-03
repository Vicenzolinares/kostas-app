import { z } from "zod";

// Each report type maps to one aggregation query in
// apps/web/app/(modules)/reports/api/queries.ts. "revenue" and "labor-cost"
// are stubbed with mock/estimated aggregation (no Finance/Payroll module
// exists yet) — see that file's comments for exactly what's real vs mocked.
export const reportTypeValues = [
  "project-pipeline",
  "production-throughput",
  "fabric-usage",
  "inventory-levels",
  "revenue",
  "labor-cost",
] as const;
export const reportTypeSchema = z.enum(reportTypeValues);
export type ReportType = z.infer<typeof reportTypeSchema>;

export const dateRangeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});
export type DateRange = z.infer<typeof dateRangeSchema>;

export const reportFiltersSchema = z.object({
  type: reportTypeSchema,
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type ReportFilters = z.infer<typeof reportFiltersSchema>;

export const reportExportFormatSchema = z.enum(["csv", "pdf"]);
export type ReportExportFormat = z.infer<typeof reportExportFormatSchema>;
