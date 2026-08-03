import "server-only";
import { db, projects, fabricInventory } from "@kostas/database";
import { desc } from "drizzle-orm";

export async function listProjectFabrics() {
  return db.query.projectFabrics.findMany({
    orderBy: (table, { desc: descFn }) => descFn(table.createdAt),
    with: { project: true, fabric: true },
  });
}

export async function listProjectAndFabricOptions() {
  const [projectOptions, fabricOptions] = await Promise.all([
    db
      .select({
        id: projects.id,
        name: projects.name,
        clientName: projects.clientName,
      })
      .from(projects)
      .orderBy(desc(projects.createdAt)),
    db
      .select({
        id: fabricInventory.id,
        name: fabricInventory.name,
        fabricCode: fabricInventory.fabricCode,
      })
      .from(fabricInventory)
      .orderBy(fabricInventory.name),
  ]);

  return { projectOptions, fabricOptions };
}
