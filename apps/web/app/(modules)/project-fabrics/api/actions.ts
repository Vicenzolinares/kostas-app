"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, projectFabrics } from "@kostas/database";
import {
  createProjectFabricSchema,
  projectFabricStatusSchema,
  type CreateProjectFabricInput,
} from "@kostas/shared/schemas";
import { requireWriteAccess } from "@/lib/action-auth";

export interface ActionResult {
  success: boolean;
  error?: string;
}

// This module straddles both sides of the shop: sales/design allocate a
// fabric to a job, and the floor drives the later half of the pipeline
// (received -> cut -> installed), so both need write access.
const WRITE_ROLES = ["admin", "manager", "sales", "shop_floor"] as const;

export async function createProjectFabricAction(
  input: CreateProjectFabricInput,
): Promise<ActionResult> {
  const denied = await requireWriteAccess(WRITE_ROLES);
  if (denied) return denied;

  const parsed = createProjectFabricSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { notes, yardsRequired, ...rest } = parsed.data;
  await db.insert(projectFabrics).values({
    ...rest,
    yardsRequired: String(yardsRequired),
    notes: notes || null,
  });

  revalidatePath("/project-fabrics");
  return { success: true };
}

export async function updateProjectFabricStatusAction(
  id: string,
  status: string,
): Promise<ActionResult> {
  const denied = await requireWriteAccess(WRITE_ROLES);
  if (denied) return denied;

  const parsed = projectFabricStatusSchema.safeParse(status);
  if (!parsed.success) {
    return { success: false, error: "Invalid status." };
  }
  await db
    .update(projectFabrics)
    .set({ status: parsed.data, updatedAt: new Date() })
    .where(eq(projectFabrics.id, id));
  revalidatePath("/project-fabrics");
  return { success: true };
}

export async function deleteProjectFabricAction(
  id: string,
): Promise<ActionResult> {
  const denied = await requireWriteAccess(WRITE_ROLES);
  if (denied) return denied;

  await db.delete(projectFabrics).where(eq(projectFabrics.id, id));
  revalidatePath("/project-fabrics");
  return { success: true };
}
