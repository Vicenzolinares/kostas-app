import "server-only";
import { desc, eq } from "drizzle-orm";
import { db, clientMeasurements, projects } from "@kostas/database";

export async function listMeasurements(projectId?: string) {
  return db.query.clientMeasurements.findMany({
    where: projectId ? eq(clientMeasurements.projectId, projectId) : undefined,
    orderBy: desc(clientMeasurements.createdAt),
    with: { project: true },
  });
}

export async function listProjectsForSelect() {
  return db.query.projects.findMany({
    columns: { id: true, name: true, clientName: true },
    orderBy: desc(projects.createdAt),
  });
}
