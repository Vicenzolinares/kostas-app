import { ReportViewer } from "@/app/(modules)/reports/components/report-viewer";

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Aggregated analytics across projects, production, and inventory.
        </p>
      </div>
      <ReportViewer />
    </div>
  );
}
