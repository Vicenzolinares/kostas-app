import { Panel } from "./panel";
import { FinanceSparkline } from "./finance-sparkline";
import type { FinanceSnapshot as FinanceSnapshotData } from "../api/queries";

const currency = (value: number) =>
  value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

function pluralInvoices(count: number) {
  return `${count} ${count === 1 ? "invoice" : "invoices"}`;
}

/** Row 2, right column: four figures over the weekly payments chart. */
export function FinanceSnapshot({ data }: { data: FinanceSnapshotData }) {
  const delta =
    data.revenueLastMonth > 0
      ? Math.round(
          ((data.revenueThisMonth - data.revenueLastMonth) /
            data.revenueLastMonth) *
            100,
        )
      : null;

  return (
    <Panel
      title="Finance Snapshot"
      action={{ label: "View Finance Dashboard", href: "/finance" }}
      data-testid="dashboard-finance-snapshot"
    >
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border sm:grid-cols-4">
        <Figure
          label="Revenue This Month"
          value={currency(data.revenueThisMonth)}
          note={
            delta === null ? (
              <span className="text-muted-foreground">
                No payments last month
              </span>
            ) : (
              <span
                className={
                  delta >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive"
                }
              >
                {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%{" "}
                <span className="text-muted-foreground">from last month</span>
              </span>
            )
          }
        />
        <Figure
          label="Outstanding"
          value={currency(data.outstanding)}
          note={
            <span className="text-muted-foreground">
              {pluralInvoices(data.openInvoiceCount)}
            </span>
          }
        />
        <Figure
          label="Deposits Received"
          value={currency(data.depositsReceived)}
          note={
            <span className="text-muted-foreground">
              part-paid across {pluralInvoices(data.depositInvoiceCount)}
            </span>
          }
        />
        <Figure
          label="Past Due"
          value={currency(data.pastDue)}
          valueClassName="text-destructive"
          note={
            <span className="text-muted-foreground">
              {pluralInvoices(data.pastDueCount)}
            </span>
          }
        />
      </div>
      <p className="mt-3 text-[0.7rem] font-medium text-muted-foreground">
        Payments received, weekly
      </p>
      <FinanceSparkline series={data.series} />
    </Panel>
  );
}

function Figure({
  label,
  value,
  note,
  valueClassName,
}: {
  label: string;
  value: string;
  note: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="bg-card px-3 py-2.5">
      <p className="text-[0.65rem] font-medium text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-0.5 text-base font-semibold tabular-nums ${valueClassName ?? ""}`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[0.65rem]">{note}</p>
    </div>
  );
}
