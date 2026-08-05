import type {
  QueuedEmployeeAction,
  EmployeeActionType,
  ProductionTask,
  UserRole,
} from "@kostas/shared/schemas";

export type { QueuedEmployeeAction, EmployeeActionType };

export interface SyncResult {
  synced: number;
  failed: number;
}

/** A paired clock_in/clock_out. The open session's `end` is "now". */
export interface ClockSession {
  start: Date;
  end: Date;
  projectId: string | null;
}

export interface TaskCard {
  id: string;
  projectName: string;
  clientName: string;
  departmentName: string;
  status: "queued" | "in_progress" | "blocked" | "done";
  isRush: boolean;
  dueDate: Date | null;
  tasks: ProductionTask[];
}

export interface ActivityEntry {
  type: EmployeeActionType;
  occurredAt: Date;
  note: string | null;
}

export interface TaskHours {
  name: string;
  hours: number;
  share: number;
}

export interface TeammateSummary {
  id: string;
  name: string;
  role: UserRole;
  isMe: boolean;
}

export interface PortalWorkOrder {
  id: string;
  orderNumber: string;
  title: string;
  status: string;
  dueDate: Date | null;
  assignedTo: string | null;
  projectName: string | null;
  clientName: string | null;
}

export interface EmployeeDashboard {
  now: Date;
  hoursToday: number;
  hoursWeek: number;
  weeklyTarget: number;
  overtime: number;
  assignedCount: number;
  completedCount: number;
  /** When the running clock started, or null if not clocked in. */
  openSince: Date | null;
  activeTask: {
    projectName: string;
    clientName: string;
    departmentName: string;
    step: ProductionTask | null;
  } | null;
  tasks: TaskCard[];
  hoursByTask: TaskHours[];
  activity: ActivityEntry[];
  teammates: TeammateSummary[];
  workOrders: PortalWorkOrder[];
}
