import { z } from "zod";

export const projectFabricStatusValues = [
  "draft",
  "ordered",
  "received",
  "cut",
  "installed",
] as const;
export const projectFabricStatusSchema = z.enum(projectFabricStatusValues);
export type ProjectFabricStatus = z.infer<typeof projectFabricStatusSchema>;

export const createProjectFabricSchema = z.object({
  projectId: z.string().uuid(),
  fabricId: z.string().uuid(),
  yardsRequired: z.coerce.number().positive(),
  status: projectFabricStatusSchema.default("draft"),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type CreateProjectFabricInput = z.infer<typeof createProjectFabricSchema>;

export const updateProjectFabricSchema = createProjectFabricSchema
  .partial()
  .extend({ id: z.string().uuid() });
export type UpdateProjectFabricInput = z.infer<typeof updateProjectFabricSchema>;
