import { pgTable, pgEnum, uuid, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projects } from "./projects";

export const emailDirectionEnum = pgEnum("email_direction", ["inbound", "outbound"]);

export const emailSyncStatusEnum = pgEnum("email_sync_status", [
  "queued",
  "syncing",
  "synced",
  "failed",
]);

export interface EmailAttachmentMeta {
  filename: string;
  contentType: string;
  sizeBytes: number;
  storageKey: string;
}

// A local mirror of IMAP messages (synced via IMAPFlow + parsed with
// PostalMime) plus outbound messages composed/sent via Nodemailer. Inert
// until EMAIL_IMAP_HOST / EMAIL_OAUTH_CLIENT_ID env vars are set — see the
// emails module's provider for the graceful-no-op behavior.
export const emails = pgTable("emails", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: text("message_id").notNull().unique(),
  direction: emailDirectionEnum("direction").notNull(),
  fromAddress: text("from_address").notNull(),
  toAddresses: jsonb("to_addresses").$type<string[]>().notNull().default([]),
  ccAddresses: jsonb("cc_addresses").$type<string[]>().notNull().default([]),
  subject: text("subject").notNull().default(""),
  bodyText: text("body_text"),
  bodyHtml: text("body_html"),
  attachments: jsonb("attachments").$type<EmailAttachmentMeta[]>().notNull().default([]),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  isRead: boolean("is_read").notNull().default(false),
  imapUid: text("imap_uid"),
  imapFolder: text("imap_folder"),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;

// Tracks the last synced UID per folder so the BullMQ sync worker can do
// incremental IMAP syncs instead of refetching the whole mailbox each run.
export const emailSyncState = pgTable("email_sync_state", {
  id: uuid("id").primaryKey().defaultRandom(),
  folder: text("folder").notNull().unique(),
  lastUid: text("last_uid"),
  status: emailSyncStatusEnum("status").notNull().default("queued"),
  lastError: text("last_error"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
});

export type EmailSyncState = typeof emailSyncState.$inferSelect;
export type NewEmailSyncState = typeof emailSyncState.$inferInsert;

export const emailsRelations = relations(emails, ({ one }) => ({
  project: one(projects, { fields: [emails.projectId], references: [projects.id] }),
}));
