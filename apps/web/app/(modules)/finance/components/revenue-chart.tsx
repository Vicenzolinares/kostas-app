"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RevenuePoint } from "../types";

function formatMonth(month: string) {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const chartData = data.map((point) => ({ ...point, label: formatMonth(point.month) }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" fontSize={12} />
          <YAxis fontSize={12} tickFormatter={(value) => `$${value}`} />
          <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]} />
          <Bar dataKey="revenue" fill="var(--color-primary, #2563eb)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
