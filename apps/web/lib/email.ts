import "server-only";
import { createEmailProvider, type EmailProvider } from "@kostas/shared/email";

/**
 * The single EmailProvider instance used across apps/web. Falls back to
 * the null provider (every call throws EmailConfigurationError) when
 * EMAIL_IMAP_HOST / EMAIL_USER / EMAIL_OAUTH_ACCESS_TOKEN are unset — see
 * packages/shared/src/email for the abstraction and docs/PROGRESS.md for
 * what's needed to go live with a Yahoo OAuth app.
 */
export const emailProvider: EmailProvider = createEmailProvider({
  EMAIL_IMAP_HOST: process.env.EMAIL_IMAP_HOST,
  EMAIL_IMAP_PORT: process.env.EMAIL_IMAP_PORT,
  EMAIL_SMTP_HOST: process.env.EMAIL_SMTP_HOST,
  EMAIL_SMTP_PORT: process.env.EMAIL_SMTP_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_OAUTH_ACCESS_TOKEN: process.env.EMAIL_OAUTH_ACCESS_TOKEN,
  EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS,
});
