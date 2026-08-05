import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  FileWarning,
  FolderOpen,
  ReceiptText,
} from "lucide-react";
import type { DashboardStats } from "../api/queries";

const currency = (value: number) =>
  value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

/**
 * Row 1 of the deck's dashboard: five stat cards, each an icon tile, a
 * label, the count, and one line of context underneath.
 *
 * The deck's Active Projects card reads "↑ 3 from last month". No table in
 * this app records a historical active-project count, so instead of
 * back-filling a plausible-looking delta the card reports the trailing-30-day
 * intake, which is a number the data can actually answer. Cards whose
 * context line is a figure (open/overdue balances) show that figure; the
 * install card links to the calendar, as in the deck.
 */
export function StatCards({ stats }: { stats: DashboardStats }) {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5"
      data-testid="dashboard-stat-cards"
    >
      <StatCard
        icon={<FolderOpen className="h-4 w-4" />}
        tint="violet"
        label="Active Projects"
        value={stats.activeProjects}
        href="/projects"
      >
        {stats.projectsStartedLast30 > 0 ? (
          <span className="text-emerald-600 dark:text-emerald-400">
            ↑ {stats.projectsStartedLast30}{" "}
            <span className="text-muted-foreground">
              started in the last 30 days
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">
            None started in the last 30 days
          </span>
        )}
      </StatCard>

      <StatCard
        icon={<ClipboardList className="h-4 w-4" />}
        tint="slate"
        label="Work Orders"
        value={stats.workOrders}
        href="/work-orders"
      >
        <span className="font-medium text-primary">
          In Progress: {stats.workOrdersInProgress}
        </span>
      </StatCard>

      <StatCard
        icon={<ReceiptText className="h-4 w-4" />}
        tint="emerald"
        label="Open Invoices"
        value={stats.openInvoices}
        href="/finance/invoices"
      >
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          {currency(stats.openInvoiceTotal)}
        </span>
      </StatCard>

      <StatCard
        icon={<FileWarning className="h-4 w-4" />}
        tint="rose"
        label="Overdue Invoices"
        value={stats.overdueInvoices}
        href="/finance/invoices"
      >
        <span className="font-semibold text-destructive">
          {currency(stats.overdueTotal)}
        </span>
      </StatCard>

      <StatCard
        icon={<CalendarDays className="h-4 w-4" />}
        tint="violet"
        label="Installations This Week"
        value={stats.installationsThisWeek}
        href="/calendar"
      >
        <span className="font-medium text-primary">View Calendar</span>
      </StatCard>
    </div>
  );
}

const TINTS = {
  violet: "bg-accent text-primary",
  slate: "bg-muted text-foreground",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/50",
} as const;

function StatCard({
  icon,
  tint,
  label,
  value,
  href,
  children,
}: {
  icon: React.ReactNode;
  tint: keyof typeof TINTS;
  label: string;
  value: number;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-colors hover:border-primary/40"
    >
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TINTS[tint]}`}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className="block text-2xl font-semibold leading-tight">
          {value.toLocaleString()}
        </span>
        <span className="mt-0.5 block truncate text-[0.7rem]">{children}</span>
      </span>
    </Link>
  );
}
