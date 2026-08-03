import { z } from "zod";

export const workOrderTypeValues = [
  "reupholstery",
  "custom_build",
  "repair",
  "cushion_only",
  "frame_only",
] as const;
export const workOrderTypeSchema = z.enum(workOrderTypeValues);
export type WorkOrderType = z.infer<typeof workOrderTypeSchema>;

export const workOrderStatusValues = [
  "draft",
  "pending_approval",
  "approved",
  "in_production",
  "completed",
  "cancelled",
] as const;
export const workOrderStatusSchema = z.enum(workOrderStatusValues);
export type WorkOrderStatus = z.infer<typeof workOrderStatusSchema>;

// --- Wizard step schemas -------------------------------------------------
// Each step of the "Choose Type -> Project -> Specifications -> Fabric ->
// Assignments -> Review -> Generate PDF" wizard is validated independently
// with React Hook Form + zodResolver so the user can move forward/back
// without losing per-step validation state.

export const wizardStepTypeSchema = z.object({
  type: workOrderTypeSchema,
});
export type WizardStepType = z.infer<typeof wizardStepTypeSchema>;

export const wizardStepProjectSchema = z.object({
  projectId: z.string().uuid("Select a project"),
});
export type WizardStepProject = z.infer<typeof wizardStepProjectSchema>;

export const workOrderSpecificationsSchema = z.object({
  furniturePieces: z.array(z.string().trim().min(1)).default([]),
  constructionNotes: z.string().trim().max(4000).optional().or(z.literal("")),
  measurementReferenceIds: z.array(z.string().uuid()).default([]),
  specialInstructions: z.string().trim().max(4000).optional().or(z.literal("")),
});
export type WorkOrderSpecifications = z.infer<typeof workOrderSpecificationsSchema>;

export const wizardStepFabricSchema = z.object({
  fabrics: z
    .array(
      z.object({
        fabricId: z.string().uuid(),
        yardsAllocated: z.coerce.number().positive(),
        cutNotes: z.string().trim().max(1000).optional().or(z.literal("")),
      }),
    )
    .default([]),
});
export type WizardStepFabric = z.infer<typeof wizardStepFabricSchema>;

export const wizardStepAssignmentsSchema = z.object({
  assignedToId: z.string().uuid().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
});
export type WizardStepAssignments = z.infer<typeof wizardStepAssignmentsSchema>;

// Full composite schema submitted on the final "Review" step.
export const createWorkOrderSchema = wizardStepTypeSchema.merge(wizardStepProjectSchema).extend({
  specifications: workOrderSpecificationsSchema.default({}),
  fabrics: wizardStepFabricSchema.shape.fabrics,
  assignedToId: z.string().uuid().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
});
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;

export const updateWorkOrderStatusSchema = z.object({
  id: z.string().uuid(),
  status: workOrderStatusSchema,
});
export type UpdateWorkOrderStatusInput = z.infer<typeof updateWorkOrderStatusSchema>;

export const workOrderFiltersSchema = z.object({
  status: workOrderStatusSchema.optional(),
  type: workOrderTypeSchema.optional(),
  search: z.string().trim().max(200).optional(),
});
export type WorkOrderFilters = z.infer<typeof workOrderFiltersSchema>;
