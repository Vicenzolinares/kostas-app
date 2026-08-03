import { z } from "zod";

// A single labeled dimension point/line drawn on the Konva canvas.
export const measurementPointSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  label: z.string().max(120).optional(),
});

export const measurementLineSchema = z.object({
  id: z.string(),
  points: z.array(z.number()).min(4), // [x1,y1,x2,y2,...]
  label: z.string().max(120).optional(),
  valueInches: z.number().nonnegative().optional(),
});

export const measurementCanvasSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  points: z.array(measurementPointSchema).default([]),
  lines: z.array(measurementLineSchema).default([]),
  backgroundImageUrl: z.string().optional().nullable(),
});
export type MeasurementCanvas = z.infer<typeof measurementCanvasSchema>;

export const createClientMeasurementSchema = z.object({
  projectId: z.string().uuid(),
  furniturePiece: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  canvasData: measurementCanvasSchema,
});
export type CreateClientMeasurementInput = z.infer<
  typeof createClientMeasurementSchema
>;

export const updateClientMeasurementSchema = createClientMeasurementSchema
  .partial()
  .extend({ id: z.string().uuid() });
export type UpdateClientMeasurementInput = z.infer<
  typeof updateClientMeasurementSchema
>;
