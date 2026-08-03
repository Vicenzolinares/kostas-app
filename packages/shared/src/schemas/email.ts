import { z } from "zod";

export const emailDirectionSchema = z.enum(["inbound", "outbound"]);
export type EmailDirection = z.infer<typeof emailDirectionSchema>;

export const emailSyncStatusSchema = z.enum(["queued", "syncing", "synced", "failed"]);
export type EmailSyncStatus = z.infer<typeof emailSyncStatusSchema>;

// Composed with React Email + sent via Nodemailer/SMTP. Rejected with a
// clear "email sending not configured" error at the action layer when
// EMAIL_* env vars are unset.
export const composeEmailSchema = z.object({
  to: z.array(z.string().trim().email()).min(1, "Add at least one recipient"),
  cc: z.array(z.string().trim().email()).default([]),
  subject: z.string().trim().min(1, "Subject is required").max(300),
  bodyHtml: z.string().trim().min(1, "Message body is required"),
  projectId: z.string().uuid().optional().nullable(),
  inReplyToMessageId: z.string().trim().optional().nullable(),
});
export type ComposeEmailInput = z.infer<typeof composeEmailSchema>;

export const emailFiltersSchema = z.object({
  direction: emailDirectionSchema.optional(),
  projectId: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
  unreadOnly: z.coerce.boolean().optional(),
});
export type EmailFilters = z.infer<typeof emailFiltersSchema>;

export const linkEmailToProjectSchema = z.object({
  emailId: z.string().uuid(),
  projectId: z.string().uuid().nullable(),
});
export type LinkEmailToProjectInput = z.infer<typeof linkEmailToProjectSchema>;
