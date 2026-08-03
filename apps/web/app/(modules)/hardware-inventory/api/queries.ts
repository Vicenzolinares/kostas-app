import "server-only";
import { and, asc, desc, eq, ilike, lte, or, sql } from "drizzle-orm";
import { db, hardwareInventory, hardwareScanEvents } from "@kostas/database";
import type { HardwareFilters } from "@kostas/shared/schemas";

export async function listHardware(filters: HardwareFilters = {}) {
  const conditions = [];
  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(hardwareInventory.name, term),
        ilike(hardwareInventory.sku, term),
        ilike(hardwareInventory.barcode, term),
      ),
    );
  }
  if (filters.category) {
    conditions.push(eq(hardwareInventory.category, filters.category));
  }
  if (filters.lowStockOnly) {
    conditions.push(lte(hardwareInventory.quantity, hardwareInventory.reorderThreshold));
  }

  return db
    .select()
    .from(hardwareInventory)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(hardwareInventory.name));
}

export async function getHardwareById(id: string) {
  return db.query.hardwareInventory.findFirst({ where: eq(hardwareInventory.id, id) });
}

export async function getHardwareByCode(code: string) {
  return db.query.hardwareInventory.findFirst({
    where: or(eq(hardwareInventory.barcode, code), eq(hardwareInventory.sku, code)),
  });
}

export async function listScanEvents(hardwareId: string, limit = 20) {
  return db
    .select()
    .from(hardwareScanEvents)
    .where(eq(hardwareScanEvents.hardwareId, hardwareId))
    .orderBy(desc(hardwareScanEvents.createdAt))
    .limit(limit);
}

export async function countLowStock() {
  const [row] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(hardwareInventory)
    .where(lte(hardwareInventory.quantity, hardwareInventory.reorderThreshold));
  return row?.count ?? 0;
}
