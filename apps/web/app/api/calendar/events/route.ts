import { NextResponse, type NextRequest } from "next/server";
import { calendarRangeSchema } from "@kostas/shared/schemas";
import { listCalendarEvents } from "@/app/(modules)/calendar/api/queries";

/**
 * Backs FullCalendar's client-side range refetch (datesSet) so navigating
 * months doesn't require a full page reload. The initial page load still
 * renders server-side with a default range for fast first paint.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = calendarRangeSchema.safeParse({
    start: searchParams.get("start"),
    end: searchParams.get("end"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  const events = await listCalendarEvents(parsed.data);
  return NextResponse.json(events);
}
