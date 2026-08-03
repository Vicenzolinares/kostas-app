import { EmployeePortalShell } from "@/app/(modules)/employee-portal/components/employee-portal-shell";

export default function EmployeePortalPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Employee Portal</h1>
        <p className="text-sm text-muted-foreground">
          Clock in/out and log task updates — works offline.
        </p>
      </div>
      <EmployeePortalShell />
    </div>
  );
}
