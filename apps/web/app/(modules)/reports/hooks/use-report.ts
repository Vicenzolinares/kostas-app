"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReportType } from "@kostas/shared/schemas";
import type { ReportResult } from "../types";

export interface UseReportParams {
  type: ReportType;
  from?: Date;
  to?: Date;
}

async function fetchReport(params: UseReportParams): Promise<ReportResult> {
  const search = new URLSearchParams({ type: params.type });
  if (params.from) search.set("from", params.from.toISOString());
  if (params.to) search.set("to", params.to.toISOString());

  const res = await fetch(`/api/reports?${search.toString()}`);
  if (!res.ok) throw new Error("Failed to load report.");
  return res.json();
}

export function useReport(params: UseReportParams) {
  return useQuery({
    queryKey: ["reports", params.type, params.from?.toISOString(), params.to?.toISOString()],
    queryFn: () => fetchReport(params),
  });
}
