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
import type { ReportResult } from "../types";

export function ReportChart({ report }: { report: ReportResult }) {
  return (
    <div className="h-72 w-full" data-testid="report-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={report.rows} margin={{ top: 8, right: 16, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="label"
            fontSize={11}
            tickLine={false}
            angle={-20}
            textAnchor="end"
            height={50}
          />
          <YAxis fontSize={12} tickLine={false} />
          <Tooltip />
          <Bar dataKey="value" fill="var(--color-primary, #2563eb)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
