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
import { Card, CardContent, CardHeader, CardTitle } from "@kostas/ui";
import { PROJECT_STATUS_LABEL } from "@/app/(modules)/projects/components/status-badge";
import type { ProjectStatus } from "@kostas/shared/schemas";

interface ProjectsByStatusChartProps {
  data: { status: ProjectStatus; count: number }[];
}

export function ProjectsByStatusChart({ data }: ProjectsByStatusChartProps) {
  const chartData = data.map((row) => ({
    status: PROJECT_STATUS_LABEL[row.status],
    count: row.count,
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Projects by status</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="status"
              tick={{ fontSize: 11 }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            {/* The other three charts already read the brand token; this
                one was still hardcoded to the old zinc primary. */}
            <Bar
              dataKey="count"
              fill="var(--color-primary, #4a3cae)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
