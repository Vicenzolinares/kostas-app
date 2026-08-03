import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getDesignSubmission } from "@/app/(modules)/designer-portal/api/queries";
import { SubmissionDetail } from "@/app/(modules)/designer-portal/components/submission-detail";
import { authProvider } from "@/lib/auth";

async function SubmissionDetailSection({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [submission, session] = await Promise.all([
    getDesignSubmission(id),
    authProvider.requireRole([]),
  ]);
  if (!submission) notFound();

  return (
    <SubmissionDetail submission={submission} currentUser={session.user} />
  );
}

export default function DesignSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted-foreground">Loading submission…</p>
      }
    >
      <SubmissionDetailSection params={params} />
    </Suspense>
  );
}
