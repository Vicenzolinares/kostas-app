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

/**
 * The illustrated measurement sheets (mockup deck p4).
 *
 * A different model from the freeform canvas above: the deck doesn't ask
 * the user to draw, it asks them to fill in a fixed set of named dimensions
 * against a standard illustration — Overall Width, Seat Depth, Rod Height
 * and so on, each tied to a numbered callout on the drawing.
 *
 * Only the key and the value are stored. The label, the note ("Arm to
 * arm") and where the callout sits on the sketch are presentation, defined
 * once in the app beside the SVG, so a wording change doesn't require
 * rewriting every stored row.
 */
export const sketchKindSchema = z.enum(["sofa", "window"]);
export type SketchKind = z.infer<typeof sketchKindSchema>;

export const measurementUnitSchema = z.enum(["in", "cm"]);
export type MeasurementUnit = z.infer<typeof measurementUnitSchema>;

export const measurementEntrySchema = z.object({
  key: z.string().min(1).max(60),
  /** Null means "not measured yet" — distinct from a genuine zero. */
  value: z.number().nonnegative().nullable(),
});

export const measurementSheetSchema = z.object({
  kind: sketchKindSchema,
  /** Values are always persisted in inches; this is the display preference. */
  unit: measurementUnitSchema.default("in"),
  entries: z.array(measurementEntrySchema).default([]),
});
export type MeasurementSheet = z.infer<typeof measurementSheetSchema>;

export const updateMeasurementSheetsSchema = z.object({
  id: z.string().uuid(),
  sheets: z.array(measurementSheetSchema).max(4),
});
export type UpdateMeasurementSheetsInput = z.infer<
  typeof updateMeasurementSheetsSchema
>;

export const createClientMeasurementSchema = z.object({
  projectId: z.string().uuid(),
  furniturePiece: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  canvasData: measurementCanvasSchema,
  sheets: z.array(measurementSheetSchema).max(4).default([]),
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
