import "server-only";
import { and, eq, gte, lte, or, isNull } from "drizzle-orm";
import { RRule } from "rrule";
import { db, calendarEvents, users, workOrders, projects } from "@kostas/database";
import type { CalendarRange } from "@kostas/shared/schemas";
import type { FullCalendarEventInput } from "../types";

/** Row shape of the joined select below, reused by the mapper. */
type CalendarEventRow = typeof calendarEvents.$inferSelect & {
  assignedToName: string | null;
  workOrderNumber: string | null;
  projectName: string | null;
};

/**
 * Expands recurring events (rrule string) into individual instances that
 * fall within [range.start, range.end]. Done server-side with the `rrule`
 * package rather than relying on FullCalendar's paid Scheduler plugin —
 * we only use the free daygrid/timegrid/list/interaction plugins, which
 * expect a flat list of concrete event instances.
 */
export async function listCalendarEvents(range: CalendarRange): Promise<FullCalendarEventInput[]> {
  // Left-joined rather than fetched per event: the details panel names the
  // assignee, work order and project for whichever event is selected, and a
  // month's worth of events would otherwise be N+1 round trips.
  const rows: CalendarEventRow[] = await db
    .select({
      id: calendarEvents.id,
      title: calendarEvents.title,
      type: calendarEvents.type,
      start: calendarEvents.start,
      end: calendarEvents.end,
      allDay: calendarEvents.allDay,
      rrule: calendarEvents.rrule,
      location: calendarEvents.location,
      notes: calendarEvents.notes,
      projectId: calendarEvents.projectId,
      workOrderId: calendarEvents.workOrderId,
      assignedToId: calendarEvents.assignedToId,
      createdAt: calendarEvents.createdAt,
      updatedAt: calendarEvents.updatedAt,
      assignedToName: users.name,
      workOrderNumber: workOrders.orderNumber,
      projectName: projects.name,
    })
    .from(calendarEvents)
    .leftJoin(users, eq(users.id, calendarEvents.assignedToId))
    .leftJoin(workOrders, eq(workOrders.id, calendarEvents.workOrderId))
    .leftJoin(projects, eq(projects.id, calendarEvents.projectId))
    .where(
      or(
        // Non-recurring events overlapping the range.
        and(isNull(calendarEvents.rrule), lte(calendarEvents.start, range.end), gte(calendarEvents.end, range.start)),
        // Recurring events: rrule expansion below re-filters to the range,
        // so fetch any recurring event whose series could plausibly start
        // before the range ends.
        and(lte(calendarEvents.start, range.end)),
      ),
    );

  const results: FullCalendarEventInput[] = [];

  for (const row of rows) {
    if (!row.rrule) {
      if (row.start > range.end || row.end < range.start) continue;
      results.push(toEventInput(row.id, row, row.start, row.end));
      continue;
    }

    const durationMs = row.end.getTime() - row.start.getTime();
    try {
      const rule = RRule.fromString(`DTSTART:${toRRuleDate(row.start)}\n${row.rrule}`);
      const occurrences = rule.between(range.start, range.end, true);
      for (const occurrence of occurrences) {
        const start = occurrence;
        const end = new Date(occurrence.getTime() + durationMs);
        results.push(toEventInput(`${row.id}::${occurrence.toISOString()}`, row, start, end, true));
      }
    } catch {
      // Malformed rrule string — skip expansion, fall back to the base event.
      if (row.start <= range.end && row.end >= range.start) {
        results.push(toEventInput(row.id, row, row.start, row.end));
      }
    }
  }

  return results;
}

export async function getCalendarEventById(id: string) {
  return db.query.calendarEvents.findFirst({ where: eq(calendarEvents.id, id) });
}

function toRRuleDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function toEventInput(
  id: string,
  row: CalendarEventRow,
  start: Date,
  end: Date,
  isRecurrenceInstance = false,
): FullCalendarEventInput {
  return {
    id,
    title: row.title,
    start: start.toISOString(),
    end: end.toISOString(),
    allDay: row.allDay,
    extendedProps: {
      type: row.type,
      location: row.location,
      notes: row.notes,
      projectId: row.projectId,
      workOrderId: row.workOrderId,
      assignedToId: row.assignedToId,
      assignedToName: row.assignedToName,
      workOrderNumber: row.workOrderNumber,
      projectName: row.projectName,
      isRecurrenceInstance,
    },
  };
}
