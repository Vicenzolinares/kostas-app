import type {
  QueuedEmployeeAction,
  EmployeeActionType,
} from "@kostas/shared/schemas";

export type { QueuedEmployeeAction, EmployeeActionType };

export interface SyncResult {
  synced: number;
  failed: number;
}
