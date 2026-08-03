"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, workOrders, workOrderFabrics } from "@kostas/database";
import { createWorkOrderSchema, updateWorkOrderStatusSchema } from "@kostas/shared/schemas";
import { AuthError } from "@kostas/auth";
import { authProvider } from "@/lib/auth";
import { nextOrderNumber } from "./queries";

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  workOrderId?: string;
}

const WRITE_ROLES = ["admin", "manager", "sales", "designer"] as const;

async function requireWriteAccess(): Promise<ActionResult | null> {
  try {
    const session = await authProvider.requireRole([...WRITE_ROLES]);
    return session ? null : { success: false, error: "Not authenticated." };
  } catch (err) {
    if (err instanceof AuthError) return { success: false, error: err.message };
    return { success: false, error: "Something went wrong." };
  }
}

/**
 * Creates a work order from the wizard's final "Review" step payload. The
 * caller (review-step.tsx) submits the fully-assembled wizard state as
 * JSON rather than raw FormData, since it includes nested arrays
 * (fabrics, furniturePieces) that don't round-trip cleanly through
 * FormData.entries().
 */
export async function createWorkOrderAction(input: unknown): Promise<ActionResult> {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const parsed = createWorkOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const session = await authProvider.getSession();
  const { type, projectId, specifications, fabrics, assignedToId, dueDate } = parsed.data;
  const orderNumber = await nextOrderNumber();

  const workOrderId = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(workOrders)
      .values({
        orderNumber,
        projectId,
        type,
        specifications,
        assignedToId: assignedToId || null,
        dueDate: dueDate ?? null,
        createdById: session?.user.id,
      })
      .returning({ id: workOrders.id });

    if (!created) throw new Error("Failed to create work order.");

    if (fabrics.length > 0) {
      await tx.insert(workOrderFabrics).values(
        fabrics.map((f, index) => ({
          workOrderId: created.id,
          fabricId: f.fabricId,
          yardsAllocated: String(f.yardsAllocated),
          cutNotes: f.cutNotes || null,
          sortOrder: index,
        })),
      );
    }

    return created.id;
  });

  revalidatePath("/work-orders");
  return { success: true, workOrderId };
}

export async function updateWorkOrderStatusAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateWorkOrderStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db
    .update(workOrders)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(workOrders.id, parsed.data.id));

  revalidatePath("/work-orders");
  revalidatePath(`/work-orders/${parsed.data.id}`);
  return { success: true };
}

export async function storeWorkOrderPdfKeyAction(id: string, pdfStorageKey: string): Promise<ActionResult> {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  await db.update(workOrders).set({ pdfStorageKey, updatedAt: new Date() }).where(eq(workOrders.id, id));
  revalidatePath(`/work-orders/${id}`);
  return { success: true };
}

export async function deleteWorkOrderAction(id: string): Promise<ActionResult> {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  await db.delete(workOrders).where(eq(workOrders.id, id));
  revalidatePath("/work-orders");
  return { success: true };
}

export async function createWorkOrderAndRedirectAction(input: unknown) {
  const result = await createWorkOrderAction(input);
  if (result.success && result.workOrderId) {
    redirect(`/work-orders/${result.workOrderId}`);
  }
  return result;
}
