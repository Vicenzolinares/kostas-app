"use client";

import { useTransition } from "react";
import { Button } from "@kostas/ui";
import type { ReportResult } from "../types";

export function ExportButtons({ report }: { report: ReportResult }) {
  const [pending, startTransition] = useTransition();

  function handleCsvExport() {
    startTransition(async () => {
      const { exportReportToXlsx } = await import("../lib/export-csv");
      exportReportToXlsx(report);
    });
  }

  function handlePdfExport() {
    startTransition(async () => {
      const [{ pdf }, { ReportPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../lib/report-pdf-document"),
      ]);
      const blob = await pdf(<ReportPdfDocument report={report} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.type}-${new Date(report.generatedAt).toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" disabled={pending} onClick={handleCsvExport}>
        Export CSV/XLSX
      </Button>
      <Button variant="outline" size="sm" disabled={pending} onClick={handlePdfExport}>
        Export PDF
      </Button>
    </div>
  );
}
