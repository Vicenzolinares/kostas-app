import * as XLSX from "xlsx";
import type { ReportResult } from "../types";

/** Builds a .xlsx workbook from a report and triggers a browser download. */
export function exportReportToXlsx(report: ReportResult) {
  const worksheetData = report.rows.map((row) => ({
    Label: row.label,
    Value: row.value,
    Note: row.secondary ?? "",
  }));
  worksheetData.push({ Label: report.totalLabel, Value: report.total, Note: "" });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

  const fileName = `${report.type}-${new Date(report.generatedAt).toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
