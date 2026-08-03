import "server-only";
import { and, desc, eq, ilike } from "drizzle-orm";
import { db, workOrders } from "@kostas/database";
import type { WorkOrderFilters } from "@kostas/shared/schemas";

export async function listWorkOrders(filters: WorkOrderFilters = {}) {
  const conditions = [];
  if (filters.status) conditions.push(eq(workOrders.status, filters.status));
  if (filters.type) conditions.push(eq(workOrders.type, filters.type));
  if (filters.search) {
    conditions.push(ilike(workOrders.orderNumber, `%${filters.search}%`));
  }

  return db.query.workOrders.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: desc(workOrders.createdAt),
    with: {
      project: { columns: { id: true, name: true, clientName: true } },
      assignedTo: { columns: { id: true, name: true } },
    },
  });
}

export async function getWorkOrderById(id: string) {
  return db.query.workOrders.findFirst({
    where: eq(workOrders.id, id),
    with: {
      project: { columns: { id: true, name: true, clientName: true } },
      assignedTo: { columns: { id: true, name: true } },
      fabrics: { with: { fabric: { columns: { id: true, name: true, fabricCode: true } } } },
    },
  });
}

/** Generates the next sequential order number, e.g. "WO-2026-0001". */
export async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `WO-${year}-`;
  const existing = await db
    .select({ orderNumber: workOrders.orderNumber })
    .from(workOrders)
    .where(ilike(workOrders.orderNumber, `${prefix}%`))
    .orderBy(desc(workOrders.orderNumber))
    .limit(1);

  const last = existing[0]?.orderNumber;
  const lastSeq = last ? Number(last.slice(prefix.length)) : 0;
  const nextSeq = Number.isFinite(lastSeq) ? lastSeq + 1 : 1;
  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}
