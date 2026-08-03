import { Badge } from "@kostas/ui";
import type { DesignSubmissionStatus } from "@kostas/shared/schemas";

const STATUS_LABEL: Record<DesignSubmissionStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  designer_review: "Designer Review",
  approved: "Approved",
  changes_requested: "Changes Requested",
  production: "Production",
  completed: "Completed",
};

const STATUS_VARIANT: Record<
  DesignSubmissionStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "outline",
  submitted: "secondary",
  designer_review: "default",
  approved: "secondary",
  changes_requested: "destructive",
  production: "default",
  completed: "secondary",
};

export function SubmissionStatusBadge({
  status,
}: {
  status: DesignSubmissionStatus;
}) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

export const SUBMISSION_STATUS_LABEL = STATUS_LABEL;
