import "server-only";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db, emails } from "@kostas/database";
import type { EmailFilters } from "@kostas/shared/schemas";

export async function listEmails(filters: EmailFilters = {}) {
  const conditions = [];
  if (filters.direction) conditions.push(eq(emails.direction, filters.direction));
  if (filters.projectId) conditions.push(eq(emails.projectId, filters.projectId));
  if (filters.unreadOnly) conditions.push(eq(emails.isRead, false));
  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(or(ilike(emails.subject, term), ilike(emails.fromAddress, term)));
  }

  return db
    .select()
    .from(emails)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(emails.receivedAt));
}

export async function getEmailById(id: string) {
  return db.query.emails.findFirst({ where: eq(emails.id, id) });
}

export async function countUnread(): Promise<number> {
  const rows = await db.select({ id: emails.id }).from(emails).where(eq(emails.isRead, false));
  return rows.length;
}
