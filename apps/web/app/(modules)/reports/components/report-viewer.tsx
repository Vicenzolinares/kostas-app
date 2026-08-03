"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kostas/ui";
import { reportTypeValues, type ReportType } from "@kostas/shared/schemas";
import { useReport } from "../hooks/use-report";
import { ReportChart } from "./report-chart";
import { ReportTable } from "./report-table";
import { ExportButtons } from "./export-buttons";

const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  "project-pipeline": "Project Pipeline",
  "production-throughput": "Production Throughput",
  "fabric-usage": "Fabric Usage",
  "inventory-levels": "Inventory Levels",
  revenue: "Revenue",
  "labor-cost": "Labor Cost",
};

export function ReportViewer() {
  const [type, setType] = useState<ReportType>("project-pipeline");
  const { data: report, isLoading, isError } = useReport({ type });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={type} onValueChange={(value) => setType(value as ReportType)}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {reportTypeValues.map((value) => (
              <SelectItem key={value} value={value}>
                {REPORT_TYPE_LABEL[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {report ? (
          <div className="ml-auto">
            <ExportButtons report={report} />
          </div>
        ) : null}
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading report…</p> : null}
      {isError ? <p className="text-sm text-destructive">Failed to load report.</p> : null}

      {report ? (
        <>
          {report.isMocked ? (
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              This report uses estimated/mocked data — the underlying module isn&apos;t built
              yet.
            </p>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>{report.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <ReportChart report={report} />
              <ReportTable report={report} />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
