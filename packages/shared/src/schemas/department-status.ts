import { z } from "zod";

// The physical rooms in the Kostas shop, matching the department TVs in the
// mockup deck (Seamstress Room, Upholstery Room, Carpentry Room, Paint,
// Warehouse, In The Office). Each key gets its own shop-board screen.
export const departmentKeyValues = [
  "seamstress",
  "upholstery",
  "carpentry",
  "paint",
  "warehouse",
  "office",
] as const;
export const departmentKeySchema = z.enum(departmentKeyValues);
export type DepartmentKey = z.infer<typeof departmentKeySchema>;

/**
 * A single checklist item shown under a "Working Now" card on the shop
 * board. Labels are stored per-language rather than translated at render
 * time: task text is operational shop-floor content ("Replace Foam",
 * "Reemplazar Espuma") that the office writes per job, so it can't come
 * from a static UI dictionary.
 */
export const productionTaskSchema = z.object({
  id: z.string(),
  en: z.string().trim().min(1).max(120),
  es: z.string().trim().min(1).max(120),
  done: z.boolean().default(false),
});
export type ProductionTask = z.infer<typeof productionTaskSchema>;

/** Why a stage is blocked — rendered bilingually under "Needs Attention". */
export const blockedReasonValues = [
  "fabric",
  "hardware",
  "office_approval",
  "materials",
  "other",
] as const;
export const blockedReasonSchema = z.enum(blockedReasonValues);
export type BlockedReason = z.infer<typeof blockedReasonSchema>;

export const productionStageStatusValues = [
  "queued",
  "in_progress",
  "blocked",
  "done",
] as const;
export const productionStageStatusSchema = z.enum(productionStageStatusValues);
export type ProductionStageStatus = z.infer<typeof productionStageStatusSchema>;

export const updateProductionStageSchema = z.object({
  id: z.string().uuid(),
  status: productionStageStatusSchema,
  assignedTo: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type UpdateProductionStageInput = z.infer<
  typeof updateProductionStageSchema
>;
