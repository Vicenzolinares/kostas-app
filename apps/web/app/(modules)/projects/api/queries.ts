import "server-only";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db, projects } from "@kostas/database";
import type { ProjectFilters } from "@kostas/shared/schemas";

export async function listProjects(filters: ProjectFilters = {}) {
  const conditions = [];
  if (filters.status) {
    conditions.push(eq(projects.status, filters.status));
  }
  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(or(ilike(projects.name, term), ilike(projects.clientName, term)));
  }

  return db
    .select()
    .from(projects)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: string) {
  return db.query.projects.findFirst({
    where: eq(projects.id, id),
    with: {
      clientMeasurements: true,
      projectFabrics: { with: { fabric: true } },
    },
  });
}
