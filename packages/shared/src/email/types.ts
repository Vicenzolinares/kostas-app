export interface SendEmailParams {
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
  inReplyTo?: string;
}

export interface SendEmailResult {
  messageId: string;
}

export interface FetchedEmail {
  messageId: string;
  uid: string;
  folder: string;
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  textBody: string | null;
  htmlBody: string | null;
  attachments: { filename: string; contentType: string; content: Buffer }[];
  receivedAt: Date;
}

/**
 * Abstraction over the Yahoo/IMAP mailbox so the emails module can be
 * built and typechecked without a live Yahoo OAuth app. The `imap`
 * implementation (IMAPFlow for sync + PostalMime for parsing, Nodemailer
 * for SMTP send) reads EMAIL_IMAP_HOST / EMAIL_OAUTH_CLIENT_ID / etc.;
 * when unset, `createNullEmailProvider()` is used instead, which throws a
 * clear EmailConfigurationError on every call. Mirrors the AuthProvider/
 * StorageProvider/PaymentProvider/AIVisionProvider pattern elsewhere in
 * this package.
 */
export interface EmailProvider {
  readonly isConfigured: boolean;
  send(params: SendEmailParams): Promise<SendEmailResult>;
  /** Fetches messages newer than `sinceUid` (or all, if omitted) from `folder`. */
  fetchNew(folder: string, sinceUid?: string): Promise<FetchedEmail[]>;
}

export class EmailConfigurationError extends Error {
  constructor(
    message = "Email is not configured. Set EMAIL_IMAP_HOST, EMAIL_OAUTH_CLIENT_ID, and related env vars to enable it.",
  ) {
    super(message);
    this.name = "EmailConfigurationError";
  }
}
