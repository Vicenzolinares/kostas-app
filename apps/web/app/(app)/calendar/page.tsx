import { Suspense } from "react";
import { connection } from "next/server";
import { listCalendarEvents } from "@/app/(modules)/calendar/api/queries";
import { CalendarView } from "@/app/(modules)/calendar/components/calendar-view";

async function CalendarSection() {
  // `new Date()` is non-deterministic, so Cache Components requires
  // reading a request-time data source first (see the caching docs'
  // "Working with non-deterministic operations" section) — this page's
  // default range is genuinely "today", not a cacheable value.
  await connection();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  const events = await listCalendarEvents({ start, end });
  return <CalendarView events={events} />;
}

export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Schedule measurement appointments, fabric deliveries, production, and installs.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading calendar…</p>}>
        <CalendarSection />
      </Suspense>
    </div>
  );
}
