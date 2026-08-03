import { z } from "zod";

export const projectStatusValues = [
  "lead",
  "quoted",
  "approved",
  "in_progress",
  "quality_check",
  "ready_for_delivery",
  "completed",
  "cancelled",
] as const;
export const projectStatusSchema = z.enum(projectStatusValues);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  clientName: z.string().trim().min(1, "Client name is required").max(200),
  clientEmail: z.string().trim().email().optional().or(z.literal("")),
  clientPhone: z.string().trim().max(40).optional().or(z.literal("")),
  status: projectStatusSchema.default("lead"),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  dueDate: z.coerce.date().optional().nullable(),
  budget: z.coerce.number().nonnegative().optional().nullable(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const projectFiltersSchema = z.object({
  status: projectStatusSchema.optional(),
  search: z.string().trim().max(200).optional(),
});
export type ProjectFilters = z.infer<typeof projectFiltersSchema>;
