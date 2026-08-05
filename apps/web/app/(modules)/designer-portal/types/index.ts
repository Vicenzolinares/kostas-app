import type { DesignSubmission, DesignComment } from "@kostas/database/schema";

export interface DesignSubmissionWithComments extends DesignSubmission {
  comments: (DesignComment & { authorName: string | null })[];
  projectName: string;
  submittedByName: string | null;
  designerName: string | null;
}

export interface DesignSubmissionListItem extends DesignSubmission {
  projectName: string;
  /** Present on the office list; the portal card doesn't need them. */
  clientName?: string;
  designerName?: string | null;
}
