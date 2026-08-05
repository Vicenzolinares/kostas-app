"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DepartmentSnapshot } from "../types";

export function UtilizationChart({
  departments,
}: {
  departments: DepartmentSnapshot[];
}) {
  const data = departments.map((d) => ({
    name: d.department.name,
    utilization: d.utilizationPct,
    queued: d.counts.queued,
    inProgress: d.counts.in_progress,
    blocked: d.counts.blocked,
  }));

  return (
    <div className="h-72 w-full" data-testid="utilization-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" fontSize={12} tickLine={false} />
          <YAxis fontSize={12} tickLine={false} domain={[0, 100]} unit="%" />
          <Tooltip
            formatter={(value: number, key: string) =>
              key === "utilization"
                ? [`${value}%`, "Utilization"]
                : [value, key]
            }
          />
          <Bar
            dataKey="utilization"
            fill="var(--color-primary, #4a3cae)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
