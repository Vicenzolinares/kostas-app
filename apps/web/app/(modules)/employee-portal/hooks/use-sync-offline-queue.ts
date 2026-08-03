"use client";

import { useCallback, useEffect } from "react";
import { syncEmployeeActionsSchema } from "@kostas/shared/schemas";
import { useOfflineQueueStore } from "../store/offline-queue";
import { useOnlineStatus } from "./use-online-status";
import type { SyncResult } from "../types";

/**
 * Flushes the Zustand/IndexedDB offline queue to
 * `POST /api/employee-actions` whenever the browser transitions to online,
 * and once on mount if already online with a non-empty queue. Successfully
 * synced actions are removed by clientId; failures stay queued for the
 * next attempt (network blip, server error, etc).
 */
export function useSyncOfflineQueue() {
  const online = useOnlineStatus();
  const queue = useOfflineQueueStore((s) => s.queue);
  const isSyncing = useOfflineQueueStore((s) => s.isSyncing);
  const setSyncing = useOfflineQueueStore((s) => s.setSyncing);
  const setLastSyncedAt = useOfflineQueueStore((s) => s.setLastSyncedAt);
  const dequeue = useOfflineQueueStore((s) => s.dequeue);

  const sync = useCallback(async (): Promise<SyncResult | null> => {
    if (queue.length === 0 || isSyncing) return null;

    const parsed = syncEmployeeActionsSchema.safeParse({ actions: queue });
    if (!parsed.success) return null;

    setSyncing(true);
    try {
      const res = await fetch("/api/employee-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) return { synced: 0, failed: queue.length };

      const result: { syncedClientIds: string[] } = await res.json();
      dequeue(result.syncedClientIds);
      setLastSyncedAt(new Date().toISOString());
      return {
        synced: result.syncedClientIds.length,
        failed: queue.length - result.syncedClientIds.length,
      };
    } catch {
      return { synced: 0, failed: queue.length };
    } finally {
      setSyncing(false);
    }
  }, [queue, isSyncing, setSyncing, setLastSyncedAt, dequeue]);

  useEffect(() => {
    if (online) void sync();
    // Only re-run when connectivity flips, not on every queue mutation
    // (that would fire mid-typing); `sync` itself reads the latest queue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  return { sync, queueLength: queue.length, isSyncing, online };
}
