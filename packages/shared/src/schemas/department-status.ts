import { z } from "zod";

export const departmentKeyValues = [
  "cutting",
  "sewing",
  "upholstery",
  "frame_shop",
  "quality_check",
  "delivery",
] as const;
export const departmentKeySchema = z.enum(departmentKeyValues);
export type DepartmentKey = z.infer<typeof departmentKeySchema>;

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
export type UpdateProductionStageInput = z.infer<typeof updateProductionStageSchema>;
