import { DepartmentBoard } from "@/app/(modules)/department-status/components/department-board";

export default function DepartmentStatusPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Department Status</h1>
        <p className="text-sm text-muted-foreground">
          Live production status across the shop floor.
        </p>
      </div>
      <DepartmentBoard />
    </div>
  );
}
