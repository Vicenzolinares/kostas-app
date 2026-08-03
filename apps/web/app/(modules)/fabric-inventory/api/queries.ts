import "server-only";
import { asc } from "drizzle-orm";
import { db, fabricInventory } from "@kostas/database";

export async function listFabrics() {
  return db.select().from(fabricInventory).orderBy(asc(fabricInventory.name));
}
