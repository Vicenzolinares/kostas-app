import "server-only";
import { eq, desc } from "drizzle-orm";
import { db, projects } from "@kostas/database";
import type { ProjectViewData } from "../types";

/** Reuses the same relational query shape as the Projects module (module ~2-6). */
export async function getProjectViewData(id: string): Promise<ProjectViewData | undefined> {
  return db.query.projects.findFirst({
    where: eq(projects.id, id),
    with: {
      clientMeasurements: true,
      projectFabrics: { with: { fabric: true } },
    },
  });
}

export async function listProjectsForView() {
  return db.select().from(projects).orderBy(desc(projects.createdAt)).limit(50);
}
