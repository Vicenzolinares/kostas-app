"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, designSubmissions, designComments } from "@kostas/database";
import {
  createDesignSubmissionSchema,
  createDesignCommentSchema,
  transitionDesignSubmissionSchema,
} from "@kostas/shared/schemas";
import { authProvider } from "@/lib/auth";
import { isValidTransition, nextStatus } from "../machines/approval-machine";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function createDesignSubmissionAction(
  input: unknown,
): Promise<ActionResult> {
  const session = await authProvider.requireRole([
    "admin",
    "manager",
    "designer",
    "sales",
  ]);

  const parsed = createDesignSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid submission." };
  }

  await db.insert(designSubmissions).values({
    projectId: parsed.data.projectId,
    title: parsed.data.title,
    submittedById: session.user.id,
    designerId: parsed.data.designerId || null,
    fileKeys: parsed.data.fileKeys,
  });

  revalidatePath("/designer-portal");
  return { success: true };
}

/**
 * Applies an XState event to a submission's status. The machine
 * (../machines/approval-machine.ts) is the single source of truth for what
 * transitions are legal from a given state — this action re-derives the
 * target status from it rather than trusting a client-supplied status
 * string, so a submission can never skip a step.
 */
export async function transitionDesignSubmissionAction(
  input: unknown,
): Promise<ActionResult> {
  await authProvider.requireRole(["admin", "manager", "designer"]);

  const parsed = transitionDesignSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid transition." };
  }

  const submission = await db.query.designSubmissions.findFirst({
    where: eq(designSubmissions.id, parsed.data.id),
  });
  if (!submission) {
    return { success: false, error: "Submission not found." };
  }

  if (!isValidTransition(submission.status, parsed.data.event)) {
    return {
      success: false,
      error: `Cannot apply "${parsed.data.event}" from status "${submission.status}".`,
    };
  }

  const target = nextStatus(submission.status, parsed.data.event);
  if (!target) {
    return { success: false, error: "No target status resolved." };
  }

  await db
    .update(designSubmissions)
    .set({ status: target, updatedAt: new Date() })
    .where(eq(designSubmissions.id, parsed.data.id));

  revalidatePath("/designer-portal");
  revalidatePath(`/designer-portal/${parsed.data.id}`);
  return { success: true };
}

export async function createDesignCommentAction(
  input: unknown,
): Promise<ActionResult> {
  const session = await authProvider.requireRole([
    "admin",
    "manager",
    "designer",
    "sales",
  ]);

  const parsed = createDesignCommentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid comment." };
  }

  await db.insert(designComments).values({
    submissionId: parsed.data.submissionId,
    authorId: session.user.id,
    bodyJson: parsed.data.bodyJson,
  });

  revalidatePath(`/designer-portal/${parsed.data.submissionId}`);
  return { success: true };
}
