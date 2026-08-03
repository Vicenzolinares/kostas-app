"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, projectFabrics } from "@kostas/database";
import {
  createProjectFabricSchema,
  projectFabricStatusSchema,
  type CreateProjectFabricInput,
} from "@kostas/shared/schemas";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function createProjectFabricAction(
  input: CreateProjectFabricInput,
): Promise<ActionResult> {
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
  await db.delete(projectFabrics).where(eq(projectFabrics.id, id));
  revalidatePath("/project-fabrics");
  return { success: true };
}
