/**
 * Shared by the live view and the page's Suspense fallback so the deck's
 * title block (p10) paints immediately rather than after the event query
 * resolves — and so there is exactly one copy of the wording.
 */
export function CalendarHeading() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Calendar</h1>
      <p className="text-sm text-muted-foreground">
        View and manage all events, appointments, and tasks.
      </p>
    </div>
  );
}
