import { Badge } from "@kostas/ui";

interface MailboxStatusProps {
  isConfigured: boolean;
  lastSyncedAt: Date | null;
}

/**
 * Mailbox connection state for the Emails header.
 *
 * Deliberately explicit that this is a local demo rather than a live Yahoo
 * session — a demo that quietly looks connected is worse than one that says
 * what it is. The connected branch renders the same shape so the layout
 * doesn't shift when real credentials are added.
 */
export function MailboxStatus({
  isConfigured,
  lastSyncedAt,
}: MailboxStatusProps) {
  const syncedLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "never";

  if (!isConfigured) {
    return (
      <div
        className="flex flex-wrap items-center gap-2"
        data-testid="mailbox-status"
      >
        <Badge
          variant="outline"
          className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
        >
          Demo Mode — Yahoo not connected
        </Badge>
        <span className="text-xs text-muted-foreground">
          Showing seeded demo mail · last sync {syncedLabel} · messages you send
          are saved locally and never delivered
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="mailbox-status"
    >
      <Badge
        variant="outline"
        className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      >
        Yahoo! Connected
      </Badge>
      <span className="text-xs text-muted-foreground">
        Last sync {syncedLabel}
      </span>
    </div>
  );
}
