import "server-only";
import { asc } from "drizzle-orm";
import { db, itemsInventory } from "@kostas/database";

export async function listItems() {
  return db
    .select()
    .from(itemsInventory)
    .orderBy(asc(itemsInventory.sortOrder));
}
