import { z } from "zod";

export const createHardwareSchema = z.object({
  sku: z.string().trim().min(1).max(100),
  barcode: z.string().trim().max(100).optional().or(z.literal("")),
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().max(100).optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(0).default(0),
  unit: z.string().trim().min(1).max(20).default("ea"),
  binLocation: z.string().trim().max(100).optional().or(z.literal("")),
  reorderThreshold: z.coerce.number().int().min(0).default(0),
  supplier: z.string().trim().max(200).optional().or(z.literal("")),
  costPerUnit: z.coerce.number().nonnegative().optional().nullable(),
});
export type CreateHardwareInput = z.infer<typeof createHardwareSchema>;

export const updateHardwareSchema = createHardwareSchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateHardwareInput = z.infer<typeof updateHardwareSchema>;

export const hardwareScanEventTypeSchema = z.enum(["scan_in", "scan_out", "adjustment"]);
export type HardwareScanEventType = z.infer<typeof hardwareScanEventTypeSchema>;

// Submitted by the barcode/QR scanning UI (zxing-js for 1D barcodes,
// html5-qrcode for QR) once a code has been decoded client-side.
export const scanHardwareSchema = z.object({
  code: z.string().trim().min(1).max(200),
  type: hardwareScanEventTypeSchema,
  quantityDelta: z.coerce.number().int().refine((v) => v !== 0, "Quantity change cannot be zero."),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});
export type ScanHardwareInput = z.infer<typeof scanHardwareSchema>;

export const hardwareFiltersSchema = z.object({
  search: z.string().trim().max(200).optional(),
  category: z.string().trim().max(100).optional(),
  lowStockOnly: z.coerce.boolean().optional(),
});
export type HardwareFilters = z.infer<typeof hardwareFiltersSchema>;
