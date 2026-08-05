import Link from "next/link";
import { Panel, PanelEmpty } from "./panel";
import type { DashboardEmail } from "../api/queries";

function timeLabel(date: Date, now: Date) {
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay)
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Row 3, middle column: the deck's Recent Emails list. */
export function RecentEmails({
  emails,
  now,
  demoMode,
}: {
  emails: DashboardEmail[];
  now: Date;
  demoMode: boolean;
}) {
  return (
    <Panel
      title="Recent Emails"
      action={{ label: "View All Emails", href: "/emails" }}
      data-testid="dashboard-recent-emails"
    >
      {demoMode ? (
        <p className="mb-2 rounded-md bg-amber-50 px-2 py-1 text-[0.65rem] font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
          Demo Mode — Yahoo not connected
        </p>
      ) : null}
      {emails.length === 0 ? (
        <PanelEmpty>No mail in the local mailbox.</PanelEmpty>
      ) : (
        <ul className="flex flex-col">
          {emails.map((email) => (
            <li
              key={email.id}
              className="border-b border-border py-2 last:border-0"
            >
              <Link href={`/emails/${email.id}`} className="flex gap-2">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${email.isRead ? "bg-transparent" : "bg-primary"}`}
                  aria-label={email.isRead ? undefined : "Unread"}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[0.7rem] text-muted-foreground">
                      {email.fromAddress}
                    </span>
                    <span className="shrink-0 text-[0.65rem] text-muted-foreground">
                      {timeLabel(email.receivedAt, now)}
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold">
                      {email.subject || "(no subject)"}
                    </span>
                    {email.projectName ? (
                      <span className="shrink-0 truncate rounded bg-accent px-1.5 py-0.5 text-[0.6rem] font-medium text-accent-foreground">
                        {email.projectName}
                      </span>
                    ) : null}
                  </span>
                  {email.preview ? (
                    <span className="mt-0.5 block truncate text-[0.7rem] text-muted-foreground">
                      {email.preview}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
