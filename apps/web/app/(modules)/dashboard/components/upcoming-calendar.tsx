import Link from "next/link";
import {
  CalendarCheck,
  Hammer,
  PackageCheck,
  Ruler,
  Truck,
  ClipboardCheck,
} from "lucide-react";
import type { CalendarEventType } from "@kostas/shared/schemas";
import { Panel, PanelEmpty } from "./panel";
import type { UpcomingEvent } from "../api/queries";

const EVENT_STYLE: Record<
  CalendarEventType,
  { icon: React.ReactNode; tint: string }
> = {
  measurement_appointment: {
    icon: <Ruler className="h-3.5 w-3.5" />,
    tint: "bg-accent text-primary",
  },
  fabric_delivery: {
    icon: <PackageCheck className="h-3.5 w-3.5" />,
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  production: {
    icon: <Hammer className="h-3.5 w-3.5" />,
    tint: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
  },
  quality_check: {
    icon: <ClipboardCheck className="h-3.5 w-3.5" />,
    tint: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300",
  },
  delivery_installation: {
    icon: <Truck className="h-3.5 w-3.5" />,
    tint: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300",
  },
  other: {
    icon: <CalendarCheck className="h-3.5 w-3.5" />,
    tint: "bg-muted text-muted-foreground",
  },
};

/** Row 2, middle column: the deck's date-chip agenda list. */
export function UpcomingCalendar({ events }: { events: UpcomingEvent[] }) {
  return (
    <Panel
      title="Upcoming Calendar"
      action={{ label: "View Calendar", href: "/calendar" }}
      data-testid="dashboard-upcoming-calendar"
    >
      {events.length === 0 ? (
        <PanelEmpty>Nothing scheduled ahead.</PanelEmpty>
      ) : (
        <ul className="flex flex-col">
          {events.map((event) => {
            const style = EVENT_STYLE[event.type];
            return (
              <li
                key={event.id}
                className="flex items-center gap-3 border-b border-border py-2.5 last:border-0"
              >
                <span className="w-9 shrink-0 text-center">
                  <span className="block text-[0.6rem] font-semibold uppercase tracking-wide text-primary">
                    {event.start.toLocaleDateString(undefined, {
                      month: "short",
                    })}
                  </span>
                  <span className="block text-base font-semibold leading-tight">
                    {event.start.getDate()}
                  </span>
                </span>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style.tint}`}
                  aria-hidden
                >
                  {style.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">
                    {event.title}
                  </span>
                  <span className="block truncate text-[0.7rem] text-muted-foreground">
                    {event.projectName ?? "Unassigned"}
                  </span>
                </span>
                {event.location ? (
                  <span className="shrink-0 text-[0.7rem] text-muted-foreground">
                    {event.location}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <Link
        href="/calendar"
        className="mt-2 block text-center text-xs font-medium text-primary hover:underline"
      >
        Open full calendar
      </Link>
    </Panel>
  );
}
