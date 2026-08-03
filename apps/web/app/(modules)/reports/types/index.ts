import type { ReportType } from "@kostas/shared/schemas";

export type { ReportType };

export interface ReportRow {
  label: string;
  value: number;
  secondary?: string;
}

export interface ReportResult {
  type: ReportType;
  title: string;
  /** Whether the underlying data is real (queried) or mocked (module not built yet). */
  isMocked: boolean;
  generatedAt: string;
  rows: ReportRow[];
  totalLabel: string;
  total: number;
}
