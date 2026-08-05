"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, photoSearches, photoReferences } from "@kostas/database";
import {
  confirmPhotoMatchSchema,
  createPhotoReferenceSchema,
} from "@kostas/shared/schemas";
import { AuthError } from "@kostas/auth";
import { authProvider } from "@/lib/auth";
import { requireWriteAccess } from "@/lib/action-auth";

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/** Manual-review step: persists the user's confirm/reject decision for a photo search's suggested match. */
export async function confirmPhotoMatchAction(
  input: unknown,
): Promise<ActionResult> {
  // Same roles as createPhotoReferenceAction below: confirming a match is
  // what promotes a search into the reference catalog, so the two decisions
  // belong to the same people.
  const denied = await requireWriteAccess(["admin", "manager", "designer"]);
  if (denied) return denied;

  const parsed = confirmPhotoMatchSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { searchId, referenceId } = parsed.data;

  await db
    .update(photoSearches)
    .set({
      status: referenceId ? "confirmed" : "rejected",
      confirmedMatchId: referenceId,
    })
    .where(eq(photoSearches.id, searchId));

  revalidatePath("/photo-search");
  return { success: true };
}

/** Adds a new labeled reference photo to the catalog (e.g. from a confirmed search, or uploaded directly). */
export async function createPhotoReferenceAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    await authProvider.requireRole(["admin", "manager", "designer"]);
  } catch (err) {
    if (err instanceof AuthError) return { success: false, error: err.message };
    return { success: false, error: "Something went wrong." };
  }

  const parsed = createPhotoReferenceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { storageKey, itemId, fabricId, label } = parsed.data;

  await db.insert(photoReferences).values({
    storageKey,
    itemId: itemId || null,
    fabricId: fabricId || null,
    label: label || null,
  });

  revalidatePath("/photo-search");
  return { success: true };
}
