import "server-only";
import { db, employeeActions } from "@kostas/database";
import { sql } from "drizzle-orm";
import type { SyncEmployeeActionsInput } from "@kostas/shared/schemas";
import { storageProvider } from "@/lib/storage";

/**
 * Persists a batch of queued offline actions. Uses INSERT ... ON CONFLICT
 * DO NOTHING on the unique `clientId` so replaying the same batch twice
 * (e.g. the client retried a request whose response was lost) is safe.
 * Photo captures arrive as base64 data URLs and are written through the
 * StorageProvider abstraction (@kostas/shared/storage) here rather than
 * on the client, so the storage backend can change without touching the
 * offline queue/store code in the browser.
 */
export async function syncEmployeeActions(
  userId: string,
  input: SyncEmployeeActionsInput,
): Promise<{ syncedClientIds: string[] }> {
  const syncedClientIds: string[] = [];

  for (const action of input.actions) {
    let photoKey: string | null = null;
    if (action.photoDataUrl) {
      const match = /^data:(.+);base64,(.+)$/.exec(action.photoDataUrl);
      const contentType = match?.[1];
      const base64 = match?.[2];
      if (base64) {
        const buffer = Buffer.from(base64, "base64");
        const ext = contentType?.split("/")[1] ?? "jpg";
        const result = await storageProvider.upload(buffer, {
          folder: `employee-actions/${userId}`,
          fileName: `capture.${ext}`,
          contentType,
        });
        photoKey = result.key;
      }
    }

    const inserted = await db
      .insert(employeeActions)
      .values({
        clientId: action.clientId,
        userId,
        projectId: action.projectId ?? null,
        type: action.type,
        payload: action.payload,
        photoKey,
        occurredAt: action.occurredAt,
      })
      .onConflictDoNothing({ target: employeeActions.clientId })
      .returning({ clientId: employeeActions.clientId });

    // Even if onConflictDoNothing suppressed the insert (already synced by
    // a previous attempt), it's still safe to report as synced so the
    // client dequeues it.
    if (inserted.length > 0 || (await alreadySynced(action.clientId))) {
      syncedClientIds.push(action.clientId);
    }
  }

  return { syncedClientIds };
}

async function alreadySynced(clientId: string): Promise<boolean> {
  const existing = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(employeeActions)
    .where(sql`${employeeActions.clientId} = ${clientId}`);
  return (existing[0]?.count ?? 0) > 0;
}
