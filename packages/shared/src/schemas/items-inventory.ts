import { z } from "zod";

export const createItemSchema = z.object({
  sku: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().max(100).optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(0).default(0),
  unit: z.string().trim().max(30).default("ea"),
  binLocation: z.string().trim().max(100).optional().or(z.literal("")),
  reorderThreshold: z.coerce.number().int().min(0).default(0),
  sortOrder: z.coerce.number().int().min(0).default(0),
});
export type CreateItemInput = z.infer<typeof createItemSchema>;

export const updateItemSchema = createItemSchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

export const reorderItemsSchema = z.object({
  items: z.array(z.object({ id: z.string().uuid(), sortOrder: z.number().int() })),
});
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>;

// Warehouse location node for the React Flow visualization.
export const warehouseLocationSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(["shelf", "bin", "zone"]),
  x: z.number(),
  y: z.number(),
  parentId: z.string().nullable().optional(),
});
export type WarehouseLocation = z.infer<typeof warehouseLocationSchema>;
