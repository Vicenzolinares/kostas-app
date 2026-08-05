"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, itemsInventory } from "@kostas/database";
import {
  createItemSchema,
  reorderItemsSchema,
  type CreateItemInput,
} from "@kostas/shared/schemas";
import { requireWriteAccess } from "@/lib/action-auth";

export interface ActionResult {
  success: boolean;
  error?: string;
}

// Same warehouse rationale as fabric-inventory and hardware-inventory.
const WRITE_ROLES = ["admin", "manager", "shop_floor"] as const;

export async function createItemAction(
  input: CreateItemInput,
): Promise<ActionResult> {
  const denied = await requireWriteAccess(WRITE_ROLES);
  if (denied) return denied;

  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { category, binLocation, ...rest } = parsed.data;
  await db.insert(itemsInventory).values({
    ...rest,
    category: category || null,
    binLocation: binLocation || null,
  });

  revalidatePath("/items-inventory");
  return { success: true };
}

export async function updateItemQuantityAction(
  id: string,
  quantity: number,
): Promise<ActionResult> {
  const denied = await requireWriteAccess(WRITE_ROLES);
  if (denied) return denied;

  if (quantity < 0)
    return { success: false, error: "Quantity cannot be negative." };
  await db
    .update(itemsInventory)
    .set({ quantity, updatedAt: new Date() })
    .where(eq(itemsInventory.id, id));
  revalidatePath("/items-inventory");
  return { success: true };
}

export async function reorderItemsAction(
  input: unknown,
): Promise<ActionResult> {
  const denied = await requireWriteAccess(WRITE_ROLES);
  if (denied) return denied;

  const parsed = reorderItemsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid reorder payload." };
  }

  await Promise.all(
    parsed.data.items.map(({ id, sortOrder }) =>
      db
        .update(itemsInventory)
        .set({ sortOrder })
        .where(eq(itemsInventory.id, id)),
    ),
  );

  revalidatePath("/items-inventory");
  return { success: true };
}

export async function deleteItemAction(id: string): Promise<ActionResult> {
  const denied = await requireWriteAccess(WRITE_ROLES);
  if (denied) return denied;

  await db.delete(itemsInventory).where(eq(itemsInventory.id, id));
  revalidatePath("/items-inventory");
  return { success: true };
}
