import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@kostas/ui";
import { getEmailById } from "@/app/(modules)/emails/api/queries";
import { MarkReadOnView } from "@/app/(modules)/emails/components/email-detail-actions";

async function EmailDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const email = await getEmailById(id);
  if (!email) notFound();

  return (
    <div className="flex flex-col gap-6">
      <MarkReadOnView id={email.id} isRead={email.isRead} />
      <div>
        <h1 className="text-2xl font-semibold">{email.subject || "(no subject)"}</h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="capitalize">
            {email.direction}
          </Badge>
          <span>{new Date(email.receivedAt).toLocaleString()}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Message</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>
            <span className="text-muted-foreground">From: </span>
            {email.fromAddress}
          </p>
          <p>
            <span className="text-muted-foreground">To: </span>
            {email.toAddresses.join(", ") || "—"}
          </p>
          {email.ccAddresses.length > 0 ? (
            <p>
              <span className="text-muted-foreground">CC: </span>
              {email.ccAddresses.join(", ")}
            </p>
          ) : null}
          <div className="mt-4 border-t border-border pt-4">
            {email.bodyHtml ? (
              <div dangerouslySetInnerHTML={{ __html: email.bodyHtml }} />
            ) : (
              <p className="whitespace-pre-wrap">{email.bodyText ?? "(no content)"}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// See work-orders/[id]/page.tsx for why this placeholder param exists —
// Cache Components requires at least one static param for a dynamic
// segment; dynamicParams defaults to true so every other :id still
// renders on-demand.
export async function generateStaticParams() {
  return [{ id: "00000000-0000-0000-0000-000000000000" }];
}

export default function EmailDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading email…</p>}>
      <EmailDetail params={params} />
    </Suspense>
  );
}
