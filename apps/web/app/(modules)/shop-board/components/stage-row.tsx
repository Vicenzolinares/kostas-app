import type { CSSProperties } from "react";
import { StageStatusBadge } from "@/app/(modules)/department-status/components/stage-status-badge";
import type { DepartmentSnapshot } from "@/app/(modules)/department-status/types";

export interface FlatStageRow {
  departmentName: string;
  projectName: string;
  clientName: string;
  status: DepartmentSnapshot["stages"][number]["status"];
}

/** Flattens the department-status board into one row per (department, project stage) for react-window. */
export function flattenStageRows(
  departments: DepartmentSnapshot[],
): FlatStageRow[] {
  return departments.flatMap((snapshot) =>
    snapshot.stages.map((stage) => ({
      departmentName: snapshot.department.name,
      projectName: stage.projectName,
      clientName: stage.clientName,
      status: stage.status,
    })),
  );
}

export function StageRow({
  index,
  style,
  data,
}: {
  index: number;
  style: CSSProperties;
  data: FlatStageRow[];
}) {
  const row = data[index];
  if (!row) return null;

  return (
    <div
      style={style}
      className="flex items-center justify-between gap-4 border-b border-border px-6"
    >
      <div className="flex min-w-0 items-center gap-4">
        <span className="w-40 shrink-0 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {row.departmentName}
        </span>
        <span className="truncate text-lg font-medium">{row.projectName}</span>
        <span className="truncate text-sm text-muted-foreground">
          {row.clientName}
        </span>
      </div>
      <StageStatusBadge status={row.status} />
    </div>
  );
}
