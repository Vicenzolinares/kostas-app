import type { DepartmentKey, ProductionTask } from "@kostas/shared/schemas";
import type {
  DepartmentSnapshot,
  DepartmentStatusBoard,
} from "@/app/(modules)/department-status/types";

/**
 * Shapes the shared department-status payload into what a single
 * department TV renders. Kept as pure functions (no fetching, no React) so
 * the column-splitting and progress rules are testable on their own and
 * the board component stays presentational.
 */

export type BoardStage = DepartmentSnapshot["stages"][number] & {
  /** Share of this stage's checklist that is done, 0–100. */
  progressPct: number;
};

export interface DepartmentBoard {
  key: DepartmentKey;
  name: string;
  workingNow: BoardStage[];
  upNext: BoardStage[];
  needsAttention: BoardStage[];
  /** Completed vs total checklist items across everything in progress today. */
  tasksDone: number;
  tasksTotal: number;
  progressPct: number;
}

function taskProgress(tasks: ProductionTask[]): number {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100);
}

function withProgress(stage: DepartmentSnapshot["stages"][number]): BoardStage {
  return { ...stage, progressPct: taskProgress(stage.tasks ?? []) };
}

/** Soonest due date first; undated work sorts last. */
function byDueDate(a: BoardStage, b: BoardStage): number {
  const aTime = a.dueDate
    ? new Date(a.dueDate).getTime()
    : Number.MAX_SAFE_INTEGER;
  const bTime = b.dueDate
    ? new Date(b.dueDate).getTime()
    : Number.MAX_SAFE_INTEGER;
  return aTime - bTime;
}

export function toDepartmentBoard(
  snapshot: DepartmentSnapshot,
): DepartmentBoard {
  const stages = snapshot.stages.map(withProgress);

  const workingNow = stages
    .filter((s) => s.status === "in_progress")
    // Rush jobs lead — that's the whole point of flagging them.
    .sort((a, b) => Number(b.isRush) - Number(a.isRush) || byDueDate(a, b));

  const upNext = stages.filter((s) => s.status === "queued").sort(byDueDate);
  const needsAttention = stages.filter((s) => s.status === "blocked");

  // Department progress counts only the work actually on the floor today;
  // including queued jobs (which have no checklist yet) would peg every
  // department near 0% and make the gauge useless.
  const todaysTasks = workingNow.flatMap((s) => s.tasks ?? []);
  const tasksDone = todaysTasks.filter((t) => t.done).length;
  const tasksTotal = todaysTasks.length;

  return {
    key: snapshot.department.key as DepartmentKey,
    name: snapshot.department.name,
    workingNow,
    upNext,
    needsAttention,
    tasksDone,
    tasksTotal,
    progressPct:
      tasksTotal === 0 ? 0 : Math.round((tasksDone / tasksTotal) * 100),
  };
}

export function findDepartmentBoard(
  board: DepartmentStatusBoard | undefined,
  key: string | null,
): DepartmentBoard | null {
  if (!board || board.departments.length === 0) return null;
  const snapshot =
    board.departments.find((d) => d.department.key === key) ??
    board.departments[0];
  return snapshot ? toDepartmentBoard(snapshot) : null;
}

// --- live notification feed ------------------------------------------------

export type NotificationKind = "done" | "blocked" | "started" | "moved";

export interface BoardNotification {
  id: string;
  kind: NotificationKind;
  /** Project title — authored content, shown as-is in both languages. */
  projectName: string;
  /** Kept as a key, not a name, so the room reads in the chosen language. */
  departmentKey: DepartmentKey;
  at: number;
}

const KIND_BY_STATUS: Record<string, NotificationKind> = {
  done: "done",
  blocked: "blocked",
  in_progress: "started",
  queued: "moved",
};

/**
 * Derives the notification feed from real stage activity rather than a
 * separate table: each message is a statement about a row's current status
 * and `updatedAt`, so the feed stays truthful and needs no extra writes.
 *
 * Sentences are assembled at render time (see LiveNotifications) — building
 * them here would bake in a language.
 */
export function deriveNotifications(
  board: DepartmentStatusBoard | undefined,
  limit = 6,
): BoardNotification[] {
  if (!board) return [];

  return board.departments
    .flatMap((snapshot) =>
      snapshot.stages.map((stage) => ({
        id: `${stage.id}-${stage.status}`,
        kind: KIND_BY_STATUS[stage.status] ?? "moved",
        projectName: stage.projectName,
        departmentKey: snapshot.department.key as DepartmentKey,
        at: new Date(stage.updatedAt).getTime(),
      })),
    )
    .sort((a, b) => b.at - a.at)
    .slice(0, limit);
}
