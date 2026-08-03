import "server-only";
import { asc } from "drizzle-orm";
import { db, projects, fabricInventory, users } from "@kostas/database";
import type { ProjectOption, FabricOption, AssigneeOption } from "../types";

export async function listProjectOptions(): Promise<ProjectOption[]> {
  return db
    .select({ id: projects.id, name: projects.name, clientName: projects.clientName })
    .from(projects)
    .orderBy(asc(projects.name));
}

export async function listFabricOptions(): Promise<FabricOption[]> {
  return db
    .select({
      id: fabricInventory.id,
      name: fabricInventory.name,
      fabricCode: fabricInventory.fabricCode,
      yardsInStock: fabricInventory.yardsInStock,
    })
    .from(fabricInventory)
    .orderBy(asc(fabricInventory.name));
}

export async function listAssigneeOptions(): Promise<AssigneeOption[]> {
  return db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .orderBy(asc(users.name));
}
