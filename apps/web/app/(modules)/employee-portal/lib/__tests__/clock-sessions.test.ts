import { describe, it, expect } from "vitest";
import { pairClockSessions } from "../clock-sessions";

const NOW = new Date("2026-08-05T17:00:00Z");
const at = (iso: string) => new Date(iso);

function event(type: string, iso: string) {
  return { type, occurredAt: at(iso), projectId: null };
}

describe("pairClockSessions", () => {
  it("pairs a clock_in with the clock_out that follows it", () => {
    const { sessions, open } = pairClockSessions(
      [
        event("clock_in", "2026-08-05T08:00:00Z"),
        event("clock_out", "2026-08-05T16:00:00Z"),
      ],
      NOW,
    );

    expect(open).toBeNull();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.start).toEqual(at("2026-08-05T08:00:00Z"));
    expect(sessions[0]?.end).toEqual(at("2026-08-05T16:00:00Z"));
  });

  it("reports an unclosed clock_in as the open session, running to now", () => {
    const { sessions, open } = pairClockSessions(
      [event("clock_in", "2026-08-05T14:00:00Z")],
      NOW,
    );

    expect(sessions).toHaveLength(0);
    expect(open?.start).toEqual(at("2026-08-05T14:00:00Z"));
    expect(open?.end).toEqual(NOW);
  });

  it("closes a stale shift at the next clock_in rather than letting it run forever", () => {
    // Someone forgot to clock out yesterday. The old session must not stay
    // open, or today's timer would show 20+ hours.
    const { sessions, open } = pairClockSessions(
      [
        event("clock_in", "2026-08-04T08:00:00Z"),
        event("clock_in", "2026-08-05T08:00:00Z"),
      ],
      NOW,
    );

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.end).toEqual(at("2026-08-05T08:00:00Z"));
    expect(open?.start).toEqual(at("2026-08-05T08:00:00Z"));
  });

  it("ignores a clock_out with no preceding clock_in", () => {
    // A dropped offline clock_in looks exactly like this. Counting the
    // clock_out from midnight would invent hours nobody worked.
    const { sessions, open } = pairClockSessions(
      [event("clock_out", "2026-08-05T16:00:00Z")],
      NOW,
    );

    expect(sessions).toHaveLength(0);
    expect(open).toBeNull();
  });

  it("sorts events before pairing, so an out-of-order sync still pairs", () => {
    const { sessions } = pairClockSessions(
      [
        event("clock_out", "2026-08-05T16:00:00Z"),
        event("clock_in", "2026-08-05T08:00:00Z"),
      ],
      NOW,
    );

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.start).toEqual(at("2026-08-05T08:00:00Z"));
  });

  it("keeps notes and photo uploads out of the pairing", () => {
    const { sessions, open } = pairClockSessions(
      [
        event("clock_in", "2026-08-05T08:00:00Z"),
        event("task_note", "2026-08-05T10:00:00Z"),
        event("photo_upload", "2026-08-05T11:00:00Z"),
        event("clock_out", "2026-08-05T16:00:00Z"),
      ],
      NOW,
    );

    expect(open).toBeNull();
    expect(sessions).toHaveLength(1);
  });
});
