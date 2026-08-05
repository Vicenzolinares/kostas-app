import type { ClockSession } from "../types";

/**
 * Pairs clock_in/clock_out events into worked sessions.
 *
 * The events table is an append-only log, so this is where "hours worked"
 * is actually derived — there is no stored duration to trust. A clock_in
 * with no matching clock_out is the *open* session (the portal's running
 * timer); a clock_out with no preceding clock_in is ignored rather than
 * counted from midnight, which is what a dropped offline event looks like.
 *
 * Kept free of `server-only` imports (unlike api/queries.ts, which uses it)
 * so the pairing rules can be unit-tested directly — the same split as the
 * shop board's lib/board-data.ts.
 */
export function pairClockSessions(
  events: { type: string; occurredAt: Date; projectId: string | null }[],
  now: Date,
): { sessions: ClockSession[]; open: ClockSession | null } {
  const ordered = [...events].sort(
    (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
  );
  const sessions: ClockSession[] = [];
  let open: { start: Date; projectId: string | null } | null = null;

  for (const event of ordered) {
    if (event.type === "clock_in") {
      // Two clock_ins in a row: the first is stale (a missed clock_out), so
      // it's closed at the second rather than left to run forever.
      if (open) {
        sessions.push({
          start: open.start,
          end: event.occurredAt,
          projectId: open.projectId,
        });
      }
      open = { start: event.occurredAt, projectId: event.projectId };
    } else if (event.type === "clock_out" && open) {
      sessions.push({
        start: open.start,
        end: event.occurredAt,
        projectId: open.projectId,
      });
      open = null;
    }
  }

  return {
    sessions,
    open: open
      ? { start: open.start, end: now, projectId: open.projectId }
      : null,
  };
}

/**
 * Hours in the sessions that overlap [from, now]. A session that started
 * before the window counts only its overlap, so yesterday's night shift
 * doesn't inflate today's total.
 */
export function hoursSince(sessions: ClockSession[], from: Date): number {
  const ms = sessions.reduce((total, session) => {
    const start = Math.max(session.start.getTime(), from.getTime());
    const end = session.end.getTime();
    return total + Math.max(0, end - start);
  }, 0);
  return Math.round((ms / 3_600_000) * 100) / 100;
}
