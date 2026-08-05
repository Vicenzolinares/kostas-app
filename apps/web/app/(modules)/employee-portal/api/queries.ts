import "server-only";
import { connection } from "next/server";
import { and, asc, desc, eq, gte, isNotNull } from "drizzle-orm";
import {
  db,
  employeeActions,
  productionStages,
  departments,
  projects,
  users,
  workOrders,
} from "@kostas/database";
import type { ProductionTask } from "@kostas/shared/schemas";
import { pairClockSessions, hoursSince } from "../lib/clock-sessions";
import type {
  EmployeeDashboard,
  TaskCard,
  ActivityEntry,
  TaskHours,
  TeammateSummary,
} from "../types";

/** A standard week for the "of 40 hrs" progress bar and overtime line in the deck. */
const WEEKLY_HOURS_TARGET = 40;

function startOfDay(now: Date): Date {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Monday-based week start, matching how the shop talks about "this week". */
function startOfWeek(now: Date): Date {
  const date = startOfDay(now);
  const weekday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - weekday);
  return date;
}

/**
 * Everything the portal dashboard renders for one employee.
 *
 * One function rather than a query per panel: every panel is derived from
 * the same clock log and the same assigned stages, so splitting them would
 * mean reading both twice and risking two panels disagreeing about how many
 * hours today is.
 */
export async function getEmployeeDashboard(user: {
  id: string;
  name: string;
}): Promise<EmployeeDashboard> {
  // `new Date()` is request-time state under Cache Components; the caller
  // renders inside <Suspense>, so this satisfies the other half.
  await connection();
  const now = new Date();
  const weekStart = startOfWeek(now);
  const dayStart = startOfDay(now);

  const [events, stageRows, orders, staff] = await Promise.all([
    db
      .select({
        type: employeeActions.type,
        occurredAt: employeeActions.occurredAt,
        projectId: employeeActions.projectId,
        payload: employeeActions.payload,
      })
      .from(employeeActions)
      .where(
        and(
          eq(employeeActions.userId, user.id),
          gte(employeeActions.occurredAt, weekStart),
        ),
      )
      .orderBy(asc(employeeActions.occurredAt)),
    db
      .select({
        stage: productionStages,
        projectName: projects.name,
        clientName: projects.clientName,
        departmentName: departments.name,
      })
      .from(productionStages)
      .innerJoin(projects, eq(productionStages.projectId, projects.id))
      .innerJoin(departments, eq(productionStages.departmentId, departments.id))
      .where(eq(productionStages.assignedTo, user.name)),
    db
      .select({
        id: workOrders.id,
        orderNumber: workOrders.orderNumber,
        // Work orders carry a type (reupholstery, repair, …) rather than a
        // free-text title; that's what the deck's "Item" column shows.
        type: workOrders.type,
        status: workOrders.status,
        dueDate: workOrders.dueDate,
        assignedToName: users.name,
        projectName: projects.name,
        clientName: projects.clientName,
      })
      .from(workOrders)
      .leftJoin(projects, eq(workOrders.projectId, projects.id))
      .leftJoin(users, eq(workOrders.assignedToId, users.id))
      .orderBy(asc(workOrders.dueDate))
      .limit(8),
    db
      .select({ id: users.id, name: users.name, role: users.role })
      .from(users)
      .where(isNotNull(users.pinHash))
      .orderBy(asc(users.name)),
  ]);

  const { sessions, open } = pairClockSessions(events, now);
  // The shift in progress counts toward both totals — its `end` is "now",
  // so it contributes the time worked so far. Without it someone three
  // hours into their day reads zero hours today while their own timer runs.
  const worked = open ? [...sessions, open] : sessions;
  const hoursWeek = hoursSince(worked, weekStart);
  const hoursToday = hoursSince(worked, dayStart);

  const activeStage = stageRows.find(
    (row) => row.stage.status === "in_progress",
  );
  const tasks: TaskCard[] = stageRows
    .filter((row) => row.stage.status !== "done")
    .map((row) => ({
      id: row.stage.id,
      projectName: row.projectName,
      clientName: row.clientName,
      departmentName: row.departmentName,
      status: row.stage.status,
      isRush: row.stage.isRush,
      dueDate: row.stage.dueDate,
      tasks: (row.stage.tasks ?? []) as ProductionTask[],
    }));

  // Hours per task come from the checklist that is actually ticked off,
  // spread across the week's logged hours. The clock log records when
  // someone worked, not what they touched, so this is an apportionment —
  // labelled as such in the UI rather than presented as measured.
  const doneTasks = tasks.flatMap((task) =>
    task.tasks.filter((entry) => entry.done).map((entry) => entry.en),
  );
  const taskCounts = new Map<string, number>();
  for (const name of doneTasks) {
    taskCounts.set(name, (taskCounts.get(name) ?? 0) + 1);
  }
  const totalDone = doneTasks.length;
  const hoursByTask: TaskHours[] = Array.from(taskCounts.entries())
    .map(([name, count]) => ({
      name,
      hours: totalDone
        ? Math.round(hoursWeek * (count / totalDone) * 100) / 100
        : 0,
      share: totalDone ? Math.round((count / totalDone) * 100) : 0,
    }))
    .sort((a, b) => b.hours - a.hours);

  const activity: ActivityEntry[] = [...events]
    .reverse()
    .slice(0, 6)
    .map((event) => ({
      type: event.type,
      occurredAt: event.occurredAt,
      note: typeof event.payload?.note === "string" ? event.payload.note : null,
    }));

  const teammates: TeammateSummary[] = staff.map((person) => ({
    id: person.id,
    name: person.name,
    role: person.role,
    isMe: person.id === user.id,
  }));

  return {
    now,
    hoursToday,
    hoursWeek,
    weeklyTarget: WEEKLY_HOURS_TARGET,
    overtime: Math.max(
      0,
      Math.round((hoursWeek - WEEKLY_HOURS_TARGET) * 100) / 100,
    ),
    assignedCount: tasks.length,
    completedCount: stageRows.filter((row) => row.stage.status === "done")
      .length,
    openSince: open?.start ?? null,
    activeTask: activeStage
      ? {
          projectName: activeStage.projectName,
          clientName: activeStage.clientName,
          departmentName: activeStage.departmentName,
          step:
            (activeStage.stage.tasks ?? []).find((entry) => !entry.done) ??
            null,
        }
      : null,
    tasks,
    hoursByTask,
    activity,
    teammates,
    workOrders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      title: order.type.replace(/_/g, " "),
      status: order.status,
      dueDate: order.dueDate,
      assignedTo: order.assignedToName,
      projectName: order.projectName,
      clientName: order.clientName,
    })),
  };
}

/** The kiosk grid: only accounts that actually have a PIN can appear on it. */
export async function listKioskEmployees() {
  return db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(isNotNull(users.pinHash))
    .orderBy(desc(users.role), asc(users.name));
}
