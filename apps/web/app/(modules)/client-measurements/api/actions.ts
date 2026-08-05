"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, clientMeasurements } from "@kostas/database";
import {
  createClientMeasurementSchema,
  updateMeasurementSheetsSchema,
  type CreateClientMeasurementInput,
} from "@kostas/shared/schemas";
import { LocalStorageProvider } from "@kostas/shared/storage";
import path from "node:path";
import { requireWriteAccess } from "@/lib/action-auth";

const storage = new LocalStorageProvider({
  rootDir: process.env.STORAGE_ROOT_DIR
    ? path.resolve(process.env.STORAGE_ROOT_DIR)
    : path.resolve(process.cwd(), ".local-storage"),
  publicPathPrefix: process.env.STORAGE_PUBLIC_PATH_PREFIX ?? "/api/storage",
});

export interface ActionResult {
  success: boolean;
  error?: string;
}

// Measurements are taken in the client's home by whoever is on site —
// sales on a first visit, a designer on a spec revision — and corrected by
// managers afterwards.
const WRITE_ROLES = ["admin", "manager", "sales", "designer"] as const;

export async function createMeasurementAction(
  input: CreateClientMeasurementInput,
): Promise<ActionResult> {
  const denied = await requireWriteAccess(WRITE_ROLES);
  if (denied) return denied;

  const parsed = createClientMeasurementSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  await db.insert(clientMeasurements).values({
    projectId: parsed.data.projectId,
    furniturePiece: parsed.data.furniturePiece,
    notes: parsed.data.notes || null,
    canvasData: parsed.data.canvasData,
  });

  revalidatePath("/client-measurements");
  return { success: true };
}

/**
 * Persists an illustrated sheet's values (deck p4).
 *
 * Only the keys and values are written — the sheet's labels, notes and
 * callout positions are defined in the app, so nothing here has to agree
 * with the UI beyond the key. Values arrive already normalised to inches by
 * the client's unit toggle.
 */
export async function saveMeasurementSheetsAction(
  input: unknown,
): Promise<ActionResult> {
  const denied = await requireWriteAccess(WRITE_ROLES);
  if (denied) return denied;

  const parsed = updateMeasurementSheetsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid measurements.",
    };
  }

  await db
    .update(clientMeasurements)
    .set({ sheets: parsed.data.sheets, updatedAt: new Date() })
    .where(eq(clientMeasurements.id, parsed.data.id));

  revalidatePath("/client-measurements");
  return { success: true };
}

export async function uploadReferencePhotoAction(
  measurementId: string,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireWriteAccess(WRITE_ROLES);
  if (denied) return denied;

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "No file provided." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { key } = await storage.upload(buffer, {
    folder: `client-measurements/${measurementId}`,
    fileName: file.name,
    contentType: file.type,
  });

  await db
    .update(clientMeasurements)
    .set({ referencePhotoKey: key, updatedAt: new Date() })
    .where(eq(clientMeasurements.id, measurementId));

  revalidatePath("/client-measurements");
  return { success: true };
}

export async function deleteMeasurementAction(
  id: string,
): Promise<ActionResult> {
  const denied = await requireWriteAccess(WRITE_ROLES);
  if (denied) return denied;

  await db.delete(clientMeasurements).where(eq(clientMeasurements.id, id));
  revalidatePath("/client-measurements");
  return { success: true };
}
