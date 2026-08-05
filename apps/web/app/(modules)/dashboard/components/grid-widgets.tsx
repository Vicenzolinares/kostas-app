import Link from "next/link";
import { FinanceSparkline } from "./finance-sparkline";
import type {
  DepartmentLoadRow,
  FinanceSnapshot,
  LowStockRow,
  Reminder,
} from "../api/queries";

/**
 * Bodies for the customizable grid view's widgets.
 *
 * These are deliberately chrome-free — `DashboardGrid` supplies the card and
 * title around whatever it is handed — and they read the same queries the
 * fixed layout does, so the two views can never disagree about a number.
 */

export function RevenueWidget({
  data,
}: {
  data: Pick<FinanceSnapshot, "revenueThisMonth" | "series">;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-2xl font-semibold tabular-nums">
        {data.revenueThisMonth.toLocaleString(undefined, {
          style: "currency",
          currency: "USD",
        })}
      </p>
      <p className="text-xs text-muted-foreground">
        Payments received this month · weekly trend below
      </p>
      <FinanceSparkline series={data.series} />
    </div>
  );
}

export function UpcomingDeadlinesWidget({
  reminders,
}: {
  reminders: Reminder[];
}) {
  if (reminders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing due in the next week.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {reminders.map((reminder) => (
        <li key={reminder.id} className="flex items-center justify-between gap-3">
          <Link
            href={reminder.href}
            className="min-w-0 truncate text-sm hover:underline"
          >
            {reminder.label}
          </Link>
          <span
            className={`shrink-0 text-xs font-medium ${
              reminder.urgency === "overdue"
                ? "text-destructive"
                : reminder.urgency === "soon"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
            }`}
          >
            {reminder.due}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function LowStockWidget({ rows }: { rows: LowStockRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Everything is above its reorder point.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center justify-between gap-3">
          <Link
            href="/items-inventory"
            className="min-w-0 truncate text-sm hover:underline"
          >
            {row.name}{" "}
            <span className="text-muted-foreground">({row.sku})</span>
          </Link>
          <span className="shrink-0 text-xs font-medium tabular-nums text-destructive">
            {row.quantity} {row.unit} / reorder at {row.reorderThreshold}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function DepartmentLoadWidget({ rows }: { rows: DepartmentLoadRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No departments set up.</p>;
  }

  const max = Math.max(
    1,
    ...rows.map((row) => row.queued + row.inProgress + row.blocked),
  );

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => {
        const total = row.queued + row.inProgress + row.blocked;
        return (
          <li key={row.name} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-sm">{row.name}</span>
            <span className="flex h-2.5 flex-1 gap-px overflow-hidden rounded-full bg-muted">
              <span
                className="bg-primary"
                style={{ width: `${(row.inProgress / max) * 100}%` }}
              />
              <span
                className="bg-amber-400"
                style={{ width: `${(row.queued / max) * 100}%` }}
              />
              <span
                className="bg-destructive"
                style={{ width: `${(row.blocked / max) * 100}%` }}
              />
            </span>
            <span className="w-28 shrink-0 text-right text-xs text-muted-foreground">
              {row.inProgress} active · {row.queued} queued
              {row.blocked > 0 ? ` · ${row.blocked} blocked` : ""}
            </span>
            <span className="sr-only">{total} stages</span>
          </li>
        );
      })}
    </ul>
  );
}
