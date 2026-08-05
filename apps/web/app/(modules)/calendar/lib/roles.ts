import type { UserRole } from "@kostas/shared/schemas";

/**
 * Who may create, move, edit or delete calendar events.
 *
 * Previously the actions called `requireRole([])`, which only asserts "is
 * signed in" — that let external designers (and shop-floor kiosk accounts)
 * POST straight to the mutation endpoints and reschedule anything on the
 * shop's calendar. Scheduling is office work, so this is the office roles
 * only — `designer` is external (see proxy.ts's EXTERNAL_ROLES) and is
 * excluded for the same reason it is kept out of every office route, and
 * shop_floor/employee are read-only here.
 */
export const CALENDAR_WRITE_ROLES = [
  "admin",
  "manager",
  "sales",
] as const satisfies readonly UserRole[];
