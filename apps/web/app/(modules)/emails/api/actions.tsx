"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { render } from "@react-email/render";
import { db, emails } from "@kostas/database";
import {
  composeEmailSchema,
  linkEmailToProjectSchema,
} from "@kostas/shared/schemas";
import { EmailConfigurationError } from "@kostas/shared/email";
import { authProvider } from "@/lib/auth";
import { emailProvider } from "@/lib/email";
import { emailDemoMode, DEMO_MESSAGE_ID_HOST } from "@/lib/demo-mode";
import { BasicMessageEmail } from "../templates/basic-message";

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Sends via the EmailProvider (Nodemailer/SMTP) and records the sent
 * message locally.
 *
 * When EMAIL_* env vars are unset the provider is the null implementation,
 * and rather than failing outright we fall back to demo mode: the message
 * is rendered and stored locally with a `demo.kostas.local` Message-ID and
 * never handed to a transport. That keeps compose/reply/forward walkable in
 * a local demo while guaranteeing nothing is actually delivered.
 *
 * The configured path below is untouched — once real credentials exist,
 * `emailDemoMode` is false and this sends for real.
 */
export async function composeEmailAction(
  input: unknown,
): Promise<ActionResult> {
  const session = await authProvider.getSession();
  if (!session) return { success: false, error: "You must be signed in." };

  const parsed = composeEmailSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { to, cc, subject, bodyHtml, projectId, inReplyToMessageId } =
    parsed.data;

  try {
    const renderedHtml = await render(
      <BasicMessageEmail bodyHtml={bodyHtml} previewText={subject} />,
    );

    // Demo mode short-circuits the transport entirely — no SMTP connection
    // is opened. The local row below is the only side effect.
    const messageId = emailDemoMode
      ? `<${crypto.randomUUID()}@${DEMO_MESSAGE_ID_HOST}>`
      : (
          await emailProvider.send({
            to,
            cc,
            subject,
            html: renderedHtml,
            inReplyTo: inReplyToMessageId ?? undefined,
          })
        ).messageId;

    await db.insert(emails).values({
      messageId,
      direction: "outbound",
      fromAddress: session.user.email,
      toAddresses: to,
      ccAddresses: cc,
      subject,
      bodyHtml,
      projectId: projectId || null,
      isRead: true,
      imapFolder: "Sent",
    });

    revalidatePath("/emails");
    return { success: true };
  } catch (err) {
    if (err instanceof EmailConfigurationError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Failed to send email." };
  }
}

export async function markEmailReadAction(id: string): Promise<ActionResult> {
  await db.update(emails).set({ isRead: true }).where(eq(emails.id, id));
  revalidatePath("/emails");
  return { success: true };
}

export async function linkEmailToProjectAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = linkEmailToProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db
    .update(emails)
    .set({ projectId: parsed.data.projectId })
    .where(eq(emails.id, parsed.data.emailId));

  revalidatePath("/emails");
  return { success: true };
}
