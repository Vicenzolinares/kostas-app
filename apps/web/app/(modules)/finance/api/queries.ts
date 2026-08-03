import "server-only";
import { connection } from "next/server";
import { and, desc, eq, ilike, or, gte, sql } from "drizzle-orm";
import { db, invoices, transactions } from "@kostas/database";
import type {
  InvoiceFilters,
  TransactionFilters,
} from "@kostas/shared/schemas";
import type { RevenuePoint } from "../types";

export async function listInvoices(filters: InvoiceFilters = {}) {
  const conditions = [];
  if (filters.status) conditions.push(eq(invoices.status, filters.status));
  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(ilike(invoices.invoiceNumber, term), ilike(invoices.clientName, term)),
    );
  }

  return db
    .select()
    .from(invoices)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(invoices.createdAt));
}

export async function getInvoiceById(id: string) {
  return db.query.invoices.findFirst({
    where: eq(invoices.id, id),
    with: {
      lineItems: true,
      transactions: { orderBy: (t, { desc }) => desc(t.occurredAt) },
    },
  });
}

export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const existing = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(ilike(invoices.invoiceNumber, `${prefix}%`))
    .orderBy(desc(invoices.invoiceNumber))
    .limit(1);

  const last = existing[0]?.invoiceNumber;
  const lastSeq = last ? Number(last.slice(prefix.length)) : 0;
  const nextSeq = Number.isFinite(lastSeq) ? lastSeq + 1 : 1;
  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}

export async function listTransactions(filters: TransactionFilters = {}) {
  const conditions = [];
  if (filters.status) conditions.push(eq(transactions.status, filters.status));
  if (filters.type) conditions.push(eq(transactions.type, filters.type));
  if (filters.search)
    conditions.push(ilike(transactions.description, `%${filters.search}%`));

  return db
    .select()
    .from(transactions)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(transactions.occurredAt));
}

/** Monthly revenue (succeeded payments minus refunds) for the last N months, for the Recharts revenue chart. */
export async function getMonthlyRevenue(months = 12): Promise<RevenuePoint[]> {
  // Cache Components treats new Date() as non-deterministic — calling
  // connection() first defers this to request time (the caller is
  // already wrapped in <Suspense>, satisfying the other half of the
  // pattern Next requires for this).
  await connection();
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      month: sql<string>`to_char(${transactions.occurredAt}, 'YYYY-MM')`,
      revenue: sql<string>`sum(case when ${transactions.type} = 'refund' then -${transactions.amount} else ${transactions.amount} end)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.status, "succeeded"),
        gte(transactions.occurredAt, since),
      ),
    )
    .groupBy(sql`to_char(${transactions.occurredAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${transactions.occurredAt}, 'YYYY-MM')`);

  const byMonth = new Map(rows.map((r) => [r.month, Number(r.revenue)]));
  const points: RevenuePoint[] = [];
  const cursor = new Date(since);
  for (let i = 0; i < months; i++) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    points.push({ month: key, revenue: byMonth.get(key) ?? 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return points;
}
