import "server-only";
import { Queue } from "bullmq";
import IORedis from "ioredis";

/**
 * BullMQ connection + queue for background email sync, using the Redis
 * instance already provisioned by docker/docker-compose.yml. Chosen over
 * Trigger.dev per this project's local-first, no-external-account-needed
 * policy (same reasoning as the local Postgres auth provider and local
 * filesystem StorageProvider).
 */
const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const EMAIL_SYNC_QUEUE_NAME = "email-sync";

export interface EmailSyncJobData {
  folder: string;
}

export const emailSyncQueue = new Queue<EmailSyncJobData>(EMAIL_SYNC_QUEUE_NAME, { connection });

/** Enqueues a one-off sync of `folder`. Called from a server action or the repeatable schedule below. */
export async function enqueueEmailSync(folder = "INBOX") {
  await emailSyncQueue.add("sync", { folder }, { removeOnComplete: 50, removeOnFail: 50 });
}

/** Registers a repeating sync job (every 5 minutes) — call once from the worker process's entrypoint. */
export async function scheduleEmailSync(folder = "INBOX") {
  await emailSyncQueue.add(
    "sync",
    { folder },
    { repeat: { every: 5 * 60_000 }, jobId: `sync-${folder}`, removeOnComplete: 10, removeOnFail: 10 },
  );
}
