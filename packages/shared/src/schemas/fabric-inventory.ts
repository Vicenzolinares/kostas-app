import { z } from "zod";

// Optional numeric form fields submit as "" when left blank (uncontrolled
// `<input type="number">` via react-hook-form's `register`). Plain
// `z.coerce.number()` would coerce "" to 0, which then fails `.positive()`
// — silently blocking submission with no visible error, since the empty
// value never reaches a "this field is required" message. Treat "" (and
// null/undefined) as "not provided" before coercing.
const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().pipe(schema).optional(),
  );

export const createFabricSchema = z.object({
  fabricCode: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  mill: z.string().trim().max(200).optional().or(z.literal("")),
  color: z.string().trim().max(100).optional().or(z.literal("")),
  pattern: z.string().trim().max(100).optional().or(z.literal("")),
  composition: z.string().trim().max(200).optional().or(z.literal("")),
  widthInches: optionalNumber(z.number().positive()).nullable(),
  costPerYard: optionalNumber(z.number().nonnegative()).nullable(),
  yardsInStock: z.coerce.number().nonnegative().default(0),
  yardsReserved: z.coerce.number().nonnegative().default(0),
  warehouseLocation: z.string().trim().max(100).optional().or(z.literal("")),
});
export type CreateFabricInput = z.infer<typeof createFabricSchema>;

export const updateFabricSchema = createFabricSchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateFabricInput = z.infer<typeof updateFabricSchema>;
