import { describe, expect, it } from "vitest";
import {
  isValidTransition,
  nextStatus,
  APPROVAL_TRANSITIONS,
} from "../approval-machine";

describe("approval-machine transition table", () => {
  it("allows SUBMIT from draft", () => {
    expect(isValidTransition("draft", "SUBMIT")).toBe(true);
    expect(nextStatus("draft", "SUBMIT")).toBe("submitted");
  });

  it("rejects skipping straight from draft to approved", () => {
    expect(isValidTransition("draft", "APPROVE")).toBe(false);
    expect(nextStatus("draft", "APPROVE")).toBeNull();
  });

  it("allows the changes-requested loop back to designer_review", () => {
    expect(isValidTransition("designer_review", "REQUEST_CHANGES")).toBe(true);
    expect(nextStatus("changes_requested", "RESUBMIT")).toBe("designer_review");
  });

  it("has no outgoing transitions from the terminal completed state", () => {
    expect(Object.keys(APPROVAL_TRANSITIONS.completed)).toHaveLength(0);
  });

  it("only allows COMPLETE from production", () => {
    expect(isValidTransition("production", "COMPLETE")).toBe(true);
    expect(isValidTransition("approved", "COMPLETE")).toBe(false);
  });
});
