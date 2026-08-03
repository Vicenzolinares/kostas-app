"use client";

import { useSyncOfflineQueue } from "../hooks/use-sync-offline-queue";

export function SyncStatusBanner() {
  const { online, queueLength, isSyncing } = useSyncOfflineQueue();

  if (online && queueLength === 0) {
    return (
      <p className="rounded-md bg-secondary px-3 py-2 text-xs text-secondary-foreground">
        Online · all actions synced
      </p>
    );
  }

  return (
    <p
      className={
        online
          ? "rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800"
          : "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
      }
    >
      {online
        ? isSyncing
          ? `Syncing ${queueLength} queued action${queueLength === 1 ? "" : "s"}…`
          : `${queueLength} action${queueLength === 1 ? "" : "s"} pending sync`
        : `Offline — ${queueLength} action${queueLength === 1 ? "" : "s"} queued, will sync when back online`}
    </p>
  );
}
