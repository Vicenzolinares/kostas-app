import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import PostalMime from "postal-mime";
import {
  EmailConfigurationError,
  type EmailProvider,
  type FetchedEmail,
  type SendEmailParams,
  type SendEmailResult,
} from "./types";

function toBuffer(content: string | ArrayBuffer | Uint8Array): Buffer {
  if (typeof content === "string") return Buffer.from(content, "base64");
  if (content instanceof Uint8Array) return Buffer.from(content);
  return Buffer.from(new Uint8Array(content));
}

export interface ImapEmailProviderOptions {
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  user: string;
  /** OAuth2 access token (Yahoo) or app password, depending on account setup. */
  authToken: string;
  fromAddress: string;
}

/**
 * IMAPFlow (sync) + PostalMime (MIME parsing) + Nodemailer (SMTP send)
 * against a Yahoo Mail (or any IMAP/SMTP) account. Each call opens and
 * closes its own connection rather than holding a long-lived client,
 * since this provider is invoked from short-lived server actions and the
 * BullMQ sync worker, not a persistent process.
 */
export class ImapEmailProvider implements EmailProvider {
  readonly isConfigured = true;

  constructor(private readonly options: ImapEmailProviderOptions) {}

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    const transporter = nodemailer.createTransport({
      host: this.options.smtpHost,
      port: this.options.smtpPort,
      secure: this.options.smtpPort === 465,
      auth: { user: this.options.user, pass: this.options.authToken },
    });

    const info = await transporter.sendMail({
      from: this.options.fromAddress,
      to: params.to.join(", "),
      cc: params.cc?.join(", "),
      subject: params.subject,
      html: params.html,
      inReplyTo: params.inReplyTo,
    });

    return { messageId: info.messageId };
  }

  async fetchNew(folder: string, sinceUid?: string): Promise<FetchedEmail[]> {
    const client = new ImapFlow({
      host: this.options.imapHost,
      port: this.options.imapPort,
      secure: true,
      auth: { user: this.options.user, pass: this.options.authToken },
      logger: false,
    });

    const results: FetchedEmail[] = [];

    await client.connect();
    try {
      const lock = await client.getMailboxLock(folder);
      try {
        const range = sinceUid ? `${Number(sinceUid) + 1}:*` : "1:*";
        for await (const message of client.fetch(range, { source: true, uid: true }, { uid: true })) {
          if (!message.source) continue;
          const parsed = await PostalMime.parse(message.source);

          results.push({
            messageId: parsed.messageId ?? `${folder}-${message.uid}`,
            uid: String(message.uid),
            folder,
            from: parsed.from?.address ?? "",
            to: (parsed.to ?? []).map((addr) => addr.address ?? "").filter(Boolean),
            cc: (parsed.cc ?? []).map((addr) => addr.address ?? "").filter(Boolean),
            subject: parsed.subject ?? "",
            textBody: parsed.text ?? null,
            htmlBody: parsed.html ?? null,
            attachments: parsed.attachments.map((att) => ({
              filename: att.filename ?? "attachment",
              contentType: att.mimeType,
              content: toBuffer(att.content),
            })),
            receivedAt: parsed.date ? new Date(parsed.date) : new Date(),
          });
        }
      } finally {
        lock.release();
      }
    } finally {
      await client.logout();
    }

    return results;
  }
}

/**
 * No-op EmailProvider used when EMAIL_IMAP_HOST is unset (e.g. local dev
 * without a Yahoo OAuth app). Every method throws EmailConfigurationError
 * so the emails UI can surface a clear "email is not configured" state.
 */
export function createNullEmailProvider(): EmailProvider {
  return {
    isConfigured: false,
    async send() {
      throw new EmailConfigurationError();
    },
    async fetchNew() {
      throw new EmailConfigurationError();
    },
  };
}

export function createEmailProvider(env: {
  EMAIL_IMAP_HOST?: string;
  EMAIL_IMAP_PORT?: string;
  EMAIL_SMTP_HOST?: string;
  EMAIL_SMTP_PORT?: string;
  EMAIL_USER?: string;
  EMAIL_OAUTH_ACCESS_TOKEN?: string;
  EMAIL_FROM_ADDRESS?: string;
}): EmailProvider {
  if (!env.EMAIL_IMAP_HOST || !env.EMAIL_USER || !env.EMAIL_OAUTH_ACCESS_TOKEN) {
    return createNullEmailProvider();
  }
  return new ImapEmailProvider({
    imapHost: env.EMAIL_IMAP_HOST,
    imapPort: Number(env.EMAIL_IMAP_PORT ?? 993),
    smtpHost: env.EMAIL_SMTP_HOST ?? env.EMAIL_IMAP_HOST,
    smtpPort: Number(env.EMAIL_SMTP_PORT ?? 465),
    user: env.EMAIL_USER,
    authToken: env.EMAIL_OAUTH_ACCESS_TOKEN,
    fromAddress: env.EMAIL_FROM_ADDRESS ?? env.EMAIL_USER,
  });
}
