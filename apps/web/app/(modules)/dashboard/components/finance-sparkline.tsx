"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FinanceSnapshot } from "../api/queries";

const compact = (value: number) =>
  value >= 1000
    ? `$${Math.round(value / 1000)}K`
    : `$${value.toLocaleString()}`;

/**
 * The Finance Snapshot's mini chart: weekly payments received over the last
 * eight weeks.
 *
 * One series, so there is no legend — the panel title names it. The deck
 * draws a second "Expenses" line; this app has no expense record of any
 * kind, so plotting one would mean plotting a number nobody entered.
 */
export function FinanceSparkline({
  series,
}: {
  series: FinanceSnapshot["series"];
}) {
  return (
    <div className="h-32 w-full" data-testid="finance-sparkline">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={series}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            className="stroke-border"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            fontSize={10}
            className="fill-muted-foreground"
          />
          <YAxis
            width={44}
            tickLine={false}
            axisLine={false}
            fontSize={10}
            className="fill-muted-foreground"
            tickFormatter={compact}
          />
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--card-foreground)",
            }}
            formatter={(value: number) => [
              value.toLocaleString(undefined, {
                style: "currency",
                currency: "USD",
              }),
              "Payments received",
            ]}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 0, fill: "var(--primary)" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
