import "server-only";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { eq } from "drizzle-orm";
import { db, emails, emailSyncState } from "@kostas/database";
import { emailProvider } from "@/lib/email";
import { EMAIL_SYNC_QUEUE_NAME, type EmailSyncJobData } from "./queue";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

/**
 * BullMQ worker that performs incremental IMAP sync. Run as a standalone
 * process (`pnpm --filter @kostas/web exec tsx lib/jobs/email-sync-worker.ts`
 * or wired into a `worker` script), separate from the Next.js server —
 * BullMQ workers are long-running consumers, which doesn't fit the
 * request/response lifecycle of Next.js route handlers or server actions.
 *
 * No-ops (logs and returns) when EmailProvider isn't configured, rather
 * than crashing the worker process — see packages/shared/src/email.
 */
export function startEmailSyncWorker() {
  return new Worker<EmailSyncJobData>(
    EMAIL_SYNC_QUEUE_NAME,
    async (job) => {
      if (!emailProvider.isConfigured) {
        console.log("[email-sync] EmailProvider not configured — skipping sync.");
        return;
      }

      const { folder } = job.data;
      const state = await db.query.emailSyncState.findFirst({ where: eq(emailSyncState.folder, folder) });

      await db
        .insert(emailSyncState)
        .values({ folder, status: "syncing" })
        .onConflictDoUpdate({ target: emailSyncState.folder, set: { status: "syncing" } });

      try {
        const fetched = await emailProvider.fetchNew(folder, state?.lastUid ?? undefined);

        for (const message of fetched) {
          await db
            .insert(emails)
            .values({
              messageId: message.messageId,
              direction: "inbound",
              fromAddress: message.from,
              toAddresses: message.to,
              ccAddresses: message.cc,
              subject: message.subject,
              bodyText: message.textBody,
              bodyHtml: message.htmlBody,
              imapUid: message.uid,
              imapFolder: message.folder,
              receivedAt: message.receivedAt,
            })
            .onConflictDoNothing({ target: emails.messageId });
        }

        const lastUid = fetched.length > 0 ? fetched[fetched.length - 1]!.uid : state?.lastUid;

        await db
          .update(emailSyncState)
          .set({ status: "synced", lastUid, lastSyncedAt: new Date(), lastError: null })
          .where(eq(emailSyncState.folder, folder));
      } catch (err) {
        await db
          .update(emailSyncState)
          .set({ status: "failed", lastError: err instanceof Error ? err.message : String(err) })
          .where(eq(emailSyncState.folder, folder));
        throw err;
      }
    },
    { connection },
  );
}

if (require.main === module) {
  const worker = startEmailSyncWorker();
  console.log("[email-sync] worker started");
  process.on("SIGTERM", () => worker.close());
}
