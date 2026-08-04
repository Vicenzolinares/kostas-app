import { Suspense } from "react";
import { getEmailById } from "@/app/(modules)/emails/api/queries";
import { ComposeForm } from "@/app/(modules)/emails/components/compose-form";
import { emailDemoMode } from "@/lib/demo-mode";

/** Strips tags so a quoted original reads sensibly in the plain textarea. */
function toPlainText(html: string | null, text: string | null): string {
  if (text) return text;
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function quote(from: string, receivedAt: Date, body: string): string {
  const when = new Date(receivedAt).toLocaleString();
  const quoted = body
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  return `\n\n On ${when}, ${from} wrote:\n${quoted}`;
}

/** Adds a prefix only when it isn't already there, so Re: Re: can't stack up. */
function prefixSubject(prefix: string, subject: string): string {
  return subject.toLowerCase().startsWith(prefix.toLowerCase())
    ? subject
    : `${prefix} ${subject}`;
}

async function ComposeSection({
  searchParams,
}: {
  searchParams: Promise<{ replyTo?: string; forward?: string }>;
}) {
  const { replyTo, forward } = await searchParams;
  const sourceId = replyTo ?? forward;
  const source = sourceId ? await getEmailById(sourceId) : null;

  if (!source) {
    return <ComposeForm demoMode={emailDemoMode} />;
  }

  const body = toPlainText(source.bodyHtml, source.bodyText);
  const isReply = Boolean(replyTo);

  return (
    <ComposeForm
      demoMode={emailDemoMode}
      projectId={source.projectId}
      // Only a reply threads to the original; a forward starts a new thread.
      inReplyToMessageId={isReply ? source.messageId : null}
      defaultValues={{
        to: isReply ? source.fromAddress : "",
        cc: "",
        subject: prefixSubject(
          isReply ? "Re:" : "Fwd:",
          source.subject || "(no subject)",
        ),
        bodyHtml: quote(source.fromAddress, source.receivedAt, body),
      }}
    />
  );
}

export default function ComposeEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ replyTo?: string; forward?: string }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Compose email</h1>
        <p className="text-sm text-muted-foreground">
          {emailDemoMode
            ? "Demo mode — messages are saved to the local mailbox, not delivered."
            : "Send a message via your connected mailbox."}
        </p>
      </div>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <ComposeSection searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
