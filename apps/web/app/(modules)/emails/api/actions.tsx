"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { render } from "@react-email/render";
import { db, emails } from "@kostas/database";
import { composeEmailSchema, linkEmailToProjectSchema } from "@kostas/shared/schemas";
import { EmailConfigurationError } from "@kostas/shared/email";
import { authProvider } from "@/lib/auth";
import { emailProvider } from "@/lib/email";
import { BasicMessageEmail } from "../templates/basic-message";

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Sends via the EmailProvider (Nodemailer/SMTP) and records the sent
 * message locally. When EMAIL_* env vars are unset, emailProvider is the
 * null implementation and this returns a clear "not configured" error
 * rather than throwing.
 */
export async function composeEmailAction(input: unknown): Promise<ActionResult> {
  const session = await authProvider.getSession();
  if (!session) return { success: false, error: "You must be signed in." };

  const parsed = composeEmailSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { to, cc, subject, bodyHtml, projectId, inReplyToMessageId } = parsed.data;

  try {
    const renderedHtml = await render(<BasicMessageEmail bodyHtml={bodyHtml} previewText={subject} />);

    const result = await emailProvider.send({
      to,
      cc,
      subject,
      html: renderedHtml,
      inReplyTo: inReplyToMessageId ?? undefined,
    });

    await db.insert(emails).values({
      messageId: result.messageId,
      direction: "outbound",
      fromAddress: session.user.email,
      toAddresses: to,
      ccAddresses: cc,
      subject,
      bodyHtml,
      projectId: projectId || null,
      isRead: true,
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

export async function linkEmailToProjectAction(input: unknown): Promise<ActionResult> {
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
