"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db, hardwareInventory, hardwareScanEvents } from "@kostas/database";
import { createHardwareSchema, updateHardwareSchema, scanHardwareSchema } from "@kostas/shared/schemas";
import { AuthError } from "@kostas/auth";
import { authProvider } from "@/lib/auth";

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

const WRITE_ROLES = ["admin", "manager", "shop_floor"] as const;

async function requireWriteAccess(): Promise<ActionResult | null> {
  try {
    await authProvider.requireRole([...WRITE_ROLES]);
    return null;
  } catch (err) {
    if (err instanceof AuthError) return { success: false, error: err.message };
    return { success: false, error: "Something went wrong." };
  }
}

export async function createHardwareAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const raw = Object.fromEntries(formData.entries());
  const parsed = createHardwareSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { costPerUnit, barcode, category, binLocation, supplier, ...rest } = parsed.data;

  await db.insert(hardwareInventory).values({
    ...rest,
    barcode: barcode || null,
    category: category || null,
    binLocation: binLocation || null,
    supplier: supplier || null,
    costPerUnit: costPerUnit != null ? String(costPerUnit) : null,
  });

  revalidatePath("/hardware-inventory");
  return { success: true };
}

export async function updateHardwareAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateHardwareSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { id, costPerUnit, barcode, category, binLocation, supplier, ...rest } = parsed.data;

  await db
    .update(hardwareInventory)
    .set({
      ...rest,
      ...(barcode !== undefined ? { barcode: barcode || null } : {}),
      ...(category !== undefined ? { category: category || null } : {}),
      ...(binLocation !== undefined ? { binLocation: binLocation || null } : {}),
      ...(supplier !== undefined ? { supplier: supplier || null } : {}),
      ...(costPerUnit !== undefined ? { costPerUnit: costPerUnit != null ? String(costPerUnit) : null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(hardwareInventory.id, id));

  revalidatePath("/hardware-inventory");
  return { success: true };
}

export async function deleteHardwareAction(id: string): Promise<ActionResult> {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  await db.delete(hardwareInventory).where(eq(hardwareInventory.id, id));
  revalidatePath("/hardware-inventory");
  return { success: true };
}

/**
 * Applies a decoded barcode/QR scan: looks the item up by barcode or SKU,
 * records an audit event, and atomically adjusts quantity. Used by both the
 * zxing-js (1D barcode) and html5-qrcode (QR) scanning workflows — both
 * resolve to the same decoded string before calling this action.
 */
export async function applyHardwareScanAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const raw = Object.fromEntries(formData.entries());
  const parsed = scanHardwareSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { code, type, quantityDelta, note } = parsed.data;

  const item = await db.query.hardwareInventory.findFirst({
    where: (h, { or, eq }) => or(eq(h.barcode, code), eq(h.sku, code)),
  });

  if (!item) {
    return { success: false, error: `No hardware item found for code "${code}".` };
  }

  const nextQuantity = item.quantity + quantityDelta;
  if (nextQuantity < 0) {
    return { success: false, error: `Scan would result in negative stock (${nextQuantity}).` };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(hardwareInventory)
      .set({ quantity: sql`${hardwareInventory.quantity} + ${quantityDelta}`, updatedAt: new Date() })
      .where(eq(hardwareInventory.id, item.id));

    await tx.insert(hardwareScanEvents).values({
      hardwareId: item.id,
      type,
      quantityDelta,
      scannedCode: code,
      note: note || null,
    });
  });

  revalidatePath("/hardware-inventory");
  revalidatePath(`/hardware-inventory/${item.id}`);
  return { success: true };
}
