import { Card, CardContent, CardHeader, CardTitle } from "@kostas/ui";
import { SubmissionStatusBadge } from "./submission-status-badge";
import { WorkflowActions } from "./workflow-actions";
import { CommentEditor } from "./comment-editor";
import { CommentList } from "./comment-list";
import { PdfViewer } from "./pdf-viewer";
import { storageProvider } from "@/lib/storage";
import type { DesignSubmissionWithComments } from "../types";
import type { SessionUser } from "@kostas/auth";

const CAN_ACT_ROLES: SessionUser["role"][] = ["admin", "manager", "designer"];

export function SubmissionDetail({
  submission,
  currentUser,
}: {
  submission: DesignSubmissionWithComments;
  currentUser: SessionUser;
}) {
  const pdfKeys = submission.fileKeys.filter((key) =>
    key.toLowerCase().endsWith(".pdf"),
  );
  const canAct = CAN_ACT_ROLES.includes(currentUser.role);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{submission.title}</h1>
          <p className="text-sm text-muted-foreground">
            {submission.projectName}
          </p>
        </div>
        <SubmissionStatusBadge status={submission.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Submitted by {submission.submittedByName ?? "—"}
            {submission.designerName
              ? ` · assigned to ${submission.designerName}`
              : ""}
          </p>
          <WorkflowActions
            submissionId={submission.id}
            status={submission.status}
            canAct={canAct}
          />
        </CardContent>
      </Card>

      {pdfKeys.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Design files</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {pdfKeys.map((key) => (
              <PdfViewer key={key} fileUrl={storageProvider.getUrl(key)} />
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CommentList comments={submission.comments} />
          <CommentEditor submissionId={submission.id} />
        </CardContent>
      </Card>
    </div>
  );
}
