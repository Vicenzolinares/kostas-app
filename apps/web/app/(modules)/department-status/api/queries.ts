import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, departments, productionStages, projects } from "@kostas/database";
import type { DepartmentStatusBoard } from "../types";

/**
 * Builds the full department status board: every department, its
 * in-flight production stages (joined to the project/client for display),
 * and a same-day utilization estimate against `capacityPerDay`. Consumed
 * by both module 13 (dashboard) and module 16 (kiosk board) through
 * `useRealtimeQuery` (packages/realtime/react.tsx) polling
 * `GET /api/department-status`.
 */
export async function getDepartmentStatusBoard(): Promise<DepartmentStatusBoard> {
  const allDepartments = await db.query.departments.findMany({
    orderBy: asc(departments.sortOrder),
  });

  const allStages = await db
    .select({
      stage: productionStages,
      projectName: projects.name,
      clientName: projects.clientName,
    })
    .from(productionStages)
    .innerJoin(projects, eq(productionStages.projectId, projects.id));

  const board = allDepartments.map((department) => {
    const stages = allStages
      .filter((row) => row.stage.departmentId === department.id)
      .map((row) => ({ ...row.stage, projectName: row.projectName, clientName: row.clientName }));

    const counts = {
      queued: stages.filter((s) => s.status === "queued").length,
      in_progress: stages.filter((s) => s.status === "in_progress").length,
      blocked: stages.filter((s) => s.status === "blocked").length,
      done: stages.filter((s) => s.status === "done").length,
    };

    const activeToday = counts.in_progress + counts.done;
    const utilizationPct =
      department.capacityPerDay > 0
        ? Math.min(100, Math.round((activeToday / department.capacityPerDay) * 100))
        : 0;

    return { department, stages, counts, utilizationPct };
  });

  return { departments: board, generatedAt: new Date().toISOString() };
}
