"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, productionStages } from "@kostas/database";
import { updateProductionStageSchema } from "@kostas/shared/schemas";
import { authProvider } from "@/lib/auth";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function updateProductionStageAction(
  input: unknown,
): Promise<ActionResult> {
  await authProvider.requireRole(["admin", "manager", "shop_floor"]);

  const parsed = updateProductionStageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid stage update." };
  }

  const { id, status, assignedTo, notes } = parsed.data;

  await db
    .update(productionStages)
    .set({
      status,
      assignedTo: assignedTo || null,
      notes: notes || null,
      startedAt: status === "in_progress" ? new Date() : undefined,
      completedAt: status === "done" ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(productionStages.id, id));

  revalidatePath("/department-status");
  revalidatePath("/shop-board");
  return { success: true };
}
