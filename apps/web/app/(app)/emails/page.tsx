import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@kostas/ui";
import { listEmails } from "@/app/(modules)/emails/api/queries";
import { EmailList } from "@/app/(modules)/emails/components/email-list";
import { emailProvider } from "@/lib/email";

async function EmailListSection() {
  const emails = await listEmails();
  return <EmailList emails={emails} />;
}

export default function EmailsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Emails</h1>
          <p className="text-sm text-muted-foreground">
            {emailProvider.isConfigured
              ? "Synced from your connected mailbox."
              : "Email sync isn't configured yet — set EMAIL_IMAP_HOST and related env vars to enable it."}
          </p>
        </div>
        <Link href="/emails/compose">
          <Button>Compose</Button>
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading emails…</p>}>
        <EmailListSection />
      </Suspense>
    </div>
  );
}
