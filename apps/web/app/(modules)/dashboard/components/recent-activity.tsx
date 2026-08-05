import {
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  FileText,
  Mail,
} from "lucide-react";
import { Panel, PanelEmpty } from "./panel";
import type { ActivityEntry } from "../api/queries";

const KIND: Record<
  ActivityEntry["kind"],
  { icon: React.ReactNode; tint: string }
> = {
  work_order: {
    icon: <ClipboardList className="h-4 w-4" />,
    tint: "bg-accent text-primary",
  },
  work_order_done: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  payment: {
    icon: <DollarSign className="h-4 w-4" />,
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  email: {
    icon: <Mail className="h-4 w-4" />,
    tint: "bg-accent text-primary",
  },
  install: {
    icon: <CalendarPlus className="h-4 w-4" />,
    tint: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300",
  },
  invoice: {
    icon: <FileText className="h-4 w-4" />,
    tint: "bg-muted text-foreground",
  },
};

function ago(at: Date, now: Date) {
  const minutes = Math.round((now.getTime() - at.getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return at.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Row 4, left: the deck's horizontal activity strip. */
export function RecentActivity({
  entries,
  now,
}: {
  entries: ActivityEntry[];
  now: Date;
}) {
  return (
    <Panel title="Recent Activity" data-testid="dashboard-recent-activity">
      {entries.length === 0 ? (
        <PanelEmpty>Nothing has happened yet.</PanelEmpty>
      ) : (
        <ul className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-3 xl:grid-cols-6">
          {entries.map((entry) => {
            const kind = KIND[entry.kind];
            return (
              <li key={entry.id} className="flex gap-2">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${kind.tint}`}
                  aria-hidden
                >
                  {kind.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold">
                    {entry.title}
                  </span>
                  <span className="block break-words text-[0.7rem] leading-snug text-muted-foreground">
                    {entry.detail}
                  </span>
                  <span className="mt-1 block text-[0.65rem] text-muted-foreground">
                    {ago(entry.at, now)}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
