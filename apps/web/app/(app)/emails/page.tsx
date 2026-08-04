import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@kostas/ui";
import {
  listEmails,
  getLastSyncedAt,
} from "@/app/(modules)/emails/api/queries";
import { EmailList } from "@/app/(modules)/emails/components/email-list";
import { MailboxStatus } from "@/app/(modules)/emails/components/mailbox-status";
import { emailProvider } from "@/lib/email";

async function EmailListSection() {
  const emails = await listEmails();
  return <EmailList emails={emails} />;
}

async function MailboxStatusSection() {
  const lastSyncedAt = await getLastSyncedAt();
  return (
    <MailboxStatus
      isConfigured={emailProvider.isConfigured}
      lastSyncedAt={lastSyncedAt}
    />
  );
}

export default function EmailsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Emails</h1>
          <Suspense
            fallback={
              <p className="text-sm text-muted-foreground">Checking mailbox…</p>
            }
          >
            <MailboxStatusSection />
          </Suspense>
        </div>
        <Link href="/emails/compose">
          <Button>Compose</Button>
        </Link>
      </div>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading emails…</p>
        }
      >
        <EmailListSection />
      </Suspense>
    </div>
  );
}
