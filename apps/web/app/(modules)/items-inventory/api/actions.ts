"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, itemsInventory } from "@kostas/database";
import {
  createItemSchema,
  reorderItemsSchema,
  type CreateItemInput,
} from "@kostas/shared/schemas";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function createItemAction(
  input: CreateItemInput,
): Promise<ActionResult> {
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
  await db.delete(itemsInventory).where(eq(itemsInventory.id, id));
  revalidatePath("/items-inventory");
  return { success: true };
}
