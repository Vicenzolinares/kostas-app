"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, fabricInventory } from "@kostas/database";
import {
  createFabricSchema,
  type CreateFabricInput,
} from "@kostas/shared/schemas";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function createFabricAction(
  input: CreateFabricInput,
): Promise<ActionResult> {
  const parsed = createFabricSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const {
    mill,
    color,
    pattern,
    composition,
    widthInches,
    costPerYard,
    warehouseLocation,
    ...rest
  } = parsed.data;

  await db.insert(fabricInventory).values({
    ...rest,
    mill: mill || null,
    color: color || null,
    pattern: pattern || null,
    composition: composition || null,
    widthInches: widthInches != null ? String(widthInches) : null,
    costPerYard: costPerYard != null ? String(costPerYard) : null,
    warehouseLocation: warehouseLocation || null,
    yardsInStock: String(parsed.data.yardsInStock),
    yardsReserved: String(parsed.data.yardsReserved),
  });

  revalidatePath("/fabric-inventory");
  return { success: true };
}

export async function updateFabricStockAction(
  id: string,
  yardsInStock: number,
): Promise<ActionResult> {
  if (yardsInStock < 0)
    return { success: false, error: "Stock cannot be negative." };
  await db
    .update(fabricInventory)
    .set({ yardsInStock: String(yardsInStock), updatedAt: new Date() })
    .where(eq(fabricInventory.id, id));
  revalidatePath("/fabric-inventory");
  return { success: true };
}

export async function deleteFabricAction(id: string): Promise<ActionResult> {
  await db.delete(fabricInventory).where(eq(fabricInventory.id, id));
  revalidatePath("/fabric-inventory");
  return { success: true };
}
