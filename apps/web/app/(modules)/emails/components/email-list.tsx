"use client";

import Link from "next/link";
import { Badge } from "@kostas/ui";
import type { Email } from "../types";

export function EmailList({ emails }: { emails: Email[] }) {
  if (emails.length === 0) {
    return <p className="text-sm text-muted-foreground">No emails yet.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-border rounded-md border border-border">
      {emails.map((email) => (
        <Link
          key={email.id}
          href={`/emails/${email.id}`}
          className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-accent"
          data-testid="email-row"
        >
          <div className="flex min-w-0 flex-1 flex-col">
            <span className={email.isRead ? "font-normal" : "font-semibold"}>
              {email.subject || "(no subject)"}
            </span>
            <span className="truncate text-muted-foreground">
              {email.direction === "inbound" ? email.fromAddress : email.toAddresses.join(", ")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!email.isRead ? <Badge variant="default">New</Badge> : null}
            <Badge variant="outline" className="capitalize">
              {email.direction}
            </Badge>
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              {new Date(email.receivedAt).toLocaleDateString()}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
