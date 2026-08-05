import Link from "next/link";
import { AlertTriangle, CalendarClock, Clock } from "lucide-react";
import { Panel, PanelEmpty } from "./panel";
import type { Reminder } from "../api/queries";

const URGENCY = {
  overdue: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    text: "text-destructive",
  },
  soon: {
    icon: <Clock className="h-3.5 w-3.5" />,
    text: "text-amber-600 dark:text-amber-400",
  },
  later: {
    icon: <CalendarClock className="h-3.5 w-3.5" />,
    text: "text-muted-foreground",
  },
} as const;

/**
 * Row 3, right column.
 *
 * The deck draws this as a checklist with an "+ Add New Task" button. There
 * is no task table behind it, so a checkbox would tick and forget and the
 * add button would lead nowhere — both are omitted. What is left is real:
 * every deadline already recorded against an invoice, work order or project,
 * each one linking to the record it came from.
 */
export function RemindersPanel({ reminders }: { reminders: Reminder[] }) {
  return (
    <Panel
      title="Tasks & Reminders"
      action={{ label: "View All Work Orders", href: "/work-orders" }}
      data-testid="dashboard-reminders"
    >
      {reminders.length === 0 ? (
        <PanelEmpty>Nothing due — no overdue invoices or work orders.</PanelEmpty>
      ) : (
        <ul className="flex flex-col">
          {reminders.map((reminder) => {
            const urgency = URGENCY[reminder.urgency];
            return (
              <li
                key={reminder.id}
                className="border-b border-border last:border-0"
              >
                <Link
                  href={reminder.href}
                  className="flex items-center gap-2 py-2.5"
                >
                  <span className={`shrink-0 ${urgency.text}`} aria-hidden>
                    {urgency.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs">
                    {reminder.label}
                  </span>
                  <span
                    className={`shrink-0 text-[0.7rem] font-medium ${urgency.text}`}
                  >
                    {reminder.due}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-[0.65rem] leading-snug text-muted-foreground">
        Built from live due dates on invoices, work orders and projects. There
        is no standalone task list in the data model yet, so nothing here can
        be ticked off or added by hand.
      </p>
    </Panel>
  );
}
