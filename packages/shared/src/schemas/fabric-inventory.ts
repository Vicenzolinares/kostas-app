import { z } from "zod";

export const createFabricSchema = z.object({
  fabricCode: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  mill: z.string().trim().max(200).optional().or(z.literal("")),
  color: z.string().trim().max(100).optional().or(z.literal("")),
  pattern: z.string().trim().max(100).optional().or(z.literal("")),
  composition: z.string().trim().max(200).optional().or(z.literal("")),
  widthInches: z.coerce.number().positive().optional().nullable(),
  costPerYard: z.coerce.number().nonnegative().optional().nullable(),
  yardsInStock: z.coerce.number().nonnegative().default(0),
  yardsReserved: z.coerce.number().nonnegative().default(0),
  warehouseLocation: z.string().trim().max(100).optional().or(z.literal("")),
});
export type CreateFabricInput = z.infer<typeof createFabricSchema>;

export const updateFabricSchema = createFabricSchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateFabricInput = z.infer<typeof updateFabricSchema>;
