import { z } from "zod";

// Kept in lockstep with the XState machine's state ids — see
// apps/web/app/(modules)/designer-portal/machines/approval-machine.ts.
export const designSubmissionStatusValues = [
  "draft",
  "submitted",
  "designer_review",
  "approved",
  "changes_requested",
  "production",
  "completed",
] as const;
export const designSubmissionStatusSchema = z.enum(designSubmissionStatusValues);
export type DesignSubmissionStatus = z.infer<typeof designSubmissionStatusSchema>;

export const createDesignSubmissionSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(1, "Title is required").max(200),
  designerId: z.string().uuid().optional().or(z.literal("")),
  fileKeys: z.array(z.string()).default([]),
});
export type CreateDesignSubmissionInput = z.infer<typeof createDesignSubmissionSchema>;

// XState event names the server actions accept — a submission can only
// move forward/back along edges the machine itself defines.
export const designSubmissionEventSchema = z.enum([
  "SUBMIT",
  "START_REVIEW",
  "APPROVE",
  "REQUEST_CHANGES",
  "RESUBMIT",
  "START_PRODUCTION",
  "COMPLETE",
]);
export type DesignSubmissionEvent = z.infer<typeof designSubmissionEventSchema>;

export const transitionDesignSubmissionSchema = z.object({
  id: z.string().uuid(),
  event: designSubmissionEventSchema,
});
export type TransitionDesignSubmissionInput = z.infer<typeof transitionDesignSubmissionSchema>;

// TipTap stores its document as ProseMirror JSON, not HTML/markdown.
export const designCommentBodySchema = z.object({
  type: z.literal("doc"),
  content: z.array(z.record(z.string(), z.unknown())).default([]),
});
export type DesignCommentBody = z.infer<typeof designCommentBodySchema>;

export const createDesignCommentSchema = z.object({
  submissionId: z.string().uuid(),
  bodyJson: designCommentBodySchema,
});
export type CreateDesignCommentInput = z.infer<typeof createDesignCommentSchema>;
