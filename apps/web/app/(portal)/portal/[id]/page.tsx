import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@kostas/ui";
import { authProvider } from "@/lib/auth";
import { getPortalSubmission } from "@/app/(modules)/designer-portal/api/portal-queries";
import { PortalStatusBadge } from "@/app/(modules)/designer-portal/components/portal-project-card";
import { WorkflowActions } from "@/app/(modules)/designer-portal/components/workflow-actions";
import { CommentList } from "@/app/(modules)/designer-portal/components/comment-list";
import { CommentEditor } from "@/app/(modules)/designer-portal/components/comment-editor";

async function PortalSubmissionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await authProvider.getSession();
  if (!session) notFound();

  // Scoped by designer id: another firm's submission is indistinguishable
  // from a bad id, so this leaks nothing about what exists.
  const submission = await getPortalSubmission(id, session.user.id);
  if (!submission) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/portal"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to My Projects
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{submission.projectName}</h1>
          <PortalStatusBadge status={submission.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {submission.title} · {submission.clientName}
          {submission.submittedByName
            ? ` · Sent by ${submission.submittedByName}`
            : ""}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {submission.fileKeys.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Files &amp; Drawings</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {submission.fileKeys.map((key) => (
                  <div
                    key={key}
                    className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
                  >
                    <Image
                      src={`/api/storage/${key}`}
                      alt={key}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Messages &amp; Comments</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <CommentList comments={submission.comments} />
              <CommentEditor submissionId={submission.id} />
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Decision</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                {submission.status === "designer_review"
                  ? "Approve to release this to production, or request changes with a note explaining what needs to change."
                  : "No decision is needed from you right now."}
              </p>
              {/* WorkflowActions derives its buttons from the same
                  transition table the server validates against, so the
                  portal can only ever offer legal moves. */}
              <WorkflowActions
                submissionId={submission.id}
                status={submission.status}
                canAct={submission.status === "designer_review"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Client</span>
                <span className="text-right font-medium">
                  {submission.clientName}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Due</span>
                <span className="text-right font-medium">
                  {submission.dueDate
                    ? new Date(submission.dueDate).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Last updated</span>
                <span className="text-right font-medium">
                  {new Date(submission.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

// Cache Components needs at least one static param for a dynamic segment;
// dynamicParams stays on, so every real id still renders on demand. Same
// pattern as the work-orders and emails detail routes.
export async function generateStaticParams() {
  return [{ id: "00000000-0000-0000-0000-000000000000" }];
}

export default function PortalSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
    >
      <PortalSubmissionDetail params={params} />
    </Suspense>
  );
}
