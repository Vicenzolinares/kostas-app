"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { TaskHours } from "../types";

// Brand indigo stepped down in lightness — one hue rather than a rainbow,
// since these slices are parts of one person's week, not unrelated series.
const SLICE_COLORS = [
  "#4a3cae",
  "#6355c4",
  "#7d70d6",
  "#9a8fe3",
  "#b7aeee",
  "#d3cdf6",
];

export function HoursDonut({
  data,
  totalLabel,
  total,
}: {
  data: TaskHours[];
  totalLabel: string;
  total: number;
}) {
  if (data.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="hours"
              nameKey="name"
              innerRadius={48}
              outerRadius={70}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={SLICE_COLORS[index % SLICE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value} hrs`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold">{total}</span>
          <span className="text-[0.6rem] text-muted-foreground">
            {totalLabel}
          </span>
        </div>
      </div>
      <ul className="flex w-full flex-col gap-1.5 text-xs">
        {data.map((entry, index) => (
          <li key={entry.name} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: SLICE_COLORS[index % SLICE_COLORS.length] }}
            />
            <span className="flex-1 truncate">{entry.name}</span>
            <span className="tabular-nums text-muted-foreground">
              {entry.hours} hrs ({entry.share}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
