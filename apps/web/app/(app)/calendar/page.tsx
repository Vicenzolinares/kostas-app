import { Suspense } from "react";
import { connection } from "next/server";
import { listCalendarEvents } from "@/app/(modules)/calendar/api/queries";
import { CalendarView } from "@/app/(modules)/calendar/components/calendar-view";
import { CalendarHeading } from "@/app/(modules)/calendar/components/calendar-heading";
import { CALENDAR_WRITE_ROLES } from "@/app/(modules)/calendar/lib/roles";
import { authProvider } from "@/lib/auth";

async function CalendarSection() {
  // `new Date()` is non-deterministic, so Cache Components requires
  // reading a request-time data source first (see the caching docs'
  // "Working with non-deterministic operations" section) — this page's
  // default range is genuinely "today", not a cacheable value.
  await connection();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  // The session read stays inside this Suspense boundary alongside the
  // query — Cache Components forbids awaiting it above the boundary.
  const [events, session] = await Promise.all([
    listCalendarEvents({ start, end }),
    authProvider.getSession(),
  ]);

  // Mirrors the Server Actions' own gate. Hiding write controls from roles
  // the actions would reject keeps the UI honest about what it can do,
  // rather than offering buttons that fail on submit; the actions remain
  // the authoritative check.
  const canWrite = Boolean(
    session && (CALENDAR_WRITE_ROLES as readonly string[]).includes(session.user.role),
  );

  return <CalendarView events={events} canWrite={canWrite} />;
}

function CalendarFallback() {
  return (
    <div className="flex flex-col gap-4">
      <CalendarHeading />
      <div className="grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_17rem]">
        <div className="h-72 rounded-lg border border-border bg-card" />
        <div className="h-[32rem] rounded-lg border border-border bg-card" />
        <div className="hidden h-[32rem] rounded-lg border border-border bg-card xl:block" />
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarFallback />}>
      <CalendarSection />
    </Suspense>
  );
}
