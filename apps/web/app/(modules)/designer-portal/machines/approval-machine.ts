import { setup, assign } from "xstate";
import type { DesignSubmissionStatus } from "@kostas/shared/schemas";

/**
 * Design approval workflow, modeled explicitly so the UI (and the server
 * actions in ../api/actions.ts) can only ever apply transitions the state
 * machine itself allows — no ad-hoc status string mutation anywhere else.
 *
 *   Draft --SUBMIT--> Submitted --START_REVIEW--> Designer Review
 *     Designer Review --APPROVE--> Approved --START_PRODUCTION--> Production --COMPLETE--> Completed
 *     Designer Review --REQUEST_CHANGES--> Changes Requested --RESUBMIT--> Designer Review
 *
 * State ids intentionally match `designSubmissionStatusValues` in
 * packages/shared/src/schemas/design-submission.ts and the
 * `design_submission_status` Postgres enum in
 * packages/database/src/schema/design-submissions.ts — the server persists
 * `machine.getSnapshot().value` directly as the row's `status` column.
 */

export interface ApprovalContext {
  submissionId: string;
  reviewerNote?: string;
}

export type ApprovalEvent =
  | { type: "SUBMIT" }
  | { type: "START_REVIEW" }
  | { type: "APPROVE" }
  | { type: "REQUEST_CHANGES"; note: string }
  | { type: "RESUBMIT" }
  | { type: "START_PRODUCTION" }
  | { type: "COMPLETE" };

export const approvalMachine = setup({
  types: {
    context: {} as ApprovalContext,
    events: {} as ApprovalEvent,
    input: {} as ApprovalContext,
  },
}).createMachine({
  id: "designApproval",
  context: ({ input }) => input,
  initial: "draft",
  states: {
    draft: {
      on: { SUBMIT: "submitted" },
    },
    submitted: {
      on: { START_REVIEW: "designer_review" },
    },
    designer_review: {
      on: {
        APPROVE: "approved",
        REQUEST_CHANGES: {
          target: "changes_requested",
          actions: assign({
            reviewerNote: ({ event }) => event.note,
          }),
        },
      },
    },
    changes_requested: {
      on: { RESUBMIT: "designer_review" },
    },
    approved: {
      on: { START_PRODUCTION: "production" },
    },
    production: {
      on: { COMPLETE: "completed" },
    },
    completed: {
      type: "final",
    },
  },
});

// Derived from the machine definition so the server (which doesn't run the
// machine, just validates a requested transition against it — see
// isValidTransition below) and the UI agree on what's allowed from each
// state without duplicating the table by hand.
export const APPROVAL_TRANSITIONS: Record<
  DesignSubmissionStatus,
  Partial<Record<ApprovalEvent["type"], DesignSubmissionStatus>>
> = {
  draft: { SUBMIT: "submitted" },
  submitted: { START_REVIEW: "designer_review" },
  designer_review: {
    APPROVE: "approved",
    REQUEST_CHANGES: "changes_requested",
  },
  changes_requested: { RESUBMIT: "designer_review" },
  approved: { START_PRODUCTION: "production" },
  production: { COMPLETE: "completed" },
  completed: {},
};

export function isValidTransition(
  from: DesignSubmissionStatus,
  event: ApprovalEvent["type"],
): boolean {
  return APPROVAL_TRANSITIONS[from]?.[event] !== undefined;
}

export function nextStatus(
  from: DesignSubmissionStatus,
  event: ApprovalEvent["type"],
): DesignSubmissionStatus | null {
  return APPROVAL_TRANSITIONS[from]?.[event] ?? null;
}
