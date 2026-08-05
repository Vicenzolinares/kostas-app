"use client";

import { useState, useTransition } from "react";
import { Button, Textarea } from "@kostas/ui";
import {
  APPROVAL_TRANSITIONS,
  type ApprovalEvent,
} from "../machines/approval-machine";
import { transitionDesignSubmissionAction } from "../api/actions";
import type { DesignSubmissionStatus } from "@kostas/shared/schemas";

const EVENT_LABEL: Record<ApprovalEvent["type"], string> = {
  SUBMIT: "Submit for review",
  START_REVIEW: "Start review",
  APPROVE: "Approve",
  REQUEST_CHANGES: "Request changes",
  RESUBMIT: "Resubmit",
  START_PRODUCTION: "Send to production",
  COMPLETE: "Mark completed",
};

/**
 * Which action buttons to show for a submission's current status is
 * derived from APPROVAL_TRANSITIONS (../machines/approval-machine.ts) —
 * the same table the server uses to validate a requested transition — so
 * this component can never offer a button the server would reject.
 */
export function WorkflowActions({
  submissionId,
  status,
  canAct,
}: {
  submissionId: string;
  status: DesignSubmissionStatus;
  canAct: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const events = Object.keys(
    APPROVAL_TRANSITIONS[status],
  ) as ApprovalEvent["type"][];

  function handleClick(eventType: ApprovalEvent["type"]) {
    if (eventType === "REQUEST_CHANGES" && !showNoteInput) {
      setShowNoteInput(true);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await transitionDesignSubmissionAction({
        id: submissionId,
        event: eventType,
      });
      if (!result.success) {
        setError(result.error ?? "Transition failed.");
      } else {
        setShowNoteInput(false);
        setNote("");
      }
    });
  }

  if (!canAct || events.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {showNoteInput ? (
        <Textarea
          placeholder="What needs to change?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        {events.map((eventType) => (
          <Button
            key={eventType}
            type="button"
            size="sm"
            variant={eventType === "REQUEST_CHANGES" ? "outline" : "default"}
            // Approval is the one irreversible-feeling step on this screen
            // and the mockups colour it green, so it reads as the positive
            // action rather than just "the default button".
            className={
              eventType === "APPROVE"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : undefined
            }
            disabled={
              pending ||
              (eventType === "REQUEST_CHANGES" && showNoteInput && !note.trim())
            }
            onClick={() => handleClick(eventType)}
          >
            {EVENT_LABEL[eventType]}
          </Button>
        ))}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
