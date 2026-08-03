import { z } from "zod";

export const employeeActionTypeValues = [
  "clock_in",
  "clock_out",
  "task_note",
  "photo_upload",
] as const;
export const employeeActionTypeSchema = z.enum(employeeActionTypeValues);
export type EmployeeActionType = z.infer<typeof employeeActionTypeSchema>;

// What the offline queue (Zustand, persisted to IndexedDB) stores per
// pending action and replays via a single `POST /api/employee-actions/sync`
// once the browser is back online.
export const queuedEmployeeActionSchema = z.object({
  clientId: z.string().uuid(),
  projectId: z.string().uuid().optional().nullable(),
  type: employeeActionTypeSchema,
  payload: z.record(z.string(), z.unknown()).default({}),
  photoDataUrl: z.string().optional(), // base64 capture from react-camera-pro, uploaded on sync
  occurredAt: z.coerce.date(),
});
export type QueuedEmployeeAction = z.infer<typeof queuedEmployeeActionSchema>;

export const syncEmployeeActionsSchema = z.object({
  actions: z.array(queuedEmployeeActionSchema).min(1).max(100),
});
export type SyncEmployeeActionsInput = z.infer<typeof syncEmployeeActionsSchema>;
