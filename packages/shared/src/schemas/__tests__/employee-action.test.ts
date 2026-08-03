import { describe, expect, it } from "vitest";
import {
  queuedEmployeeActionSchema,
  syncEmployeeActionsSchema,
} from "../employee-action";

describe("queuedEmployeeActionSchema", () => {
  it("accepts a minimal clock_in action", () => {
    const result = queuedEmployeeActionSchema.safeParse({
      clientId: "123e4567-e89b-12d3-a456-426614174000",
      type: "clock_in",
      occurredAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.payload).toEqual({});
    }
  });

  it("rejects an unknown action type", () => {
    const result = queuedEmployeeActionSchema.safeParse({
      clientId: "123e4567-e89b-12d3-a456-426614174000",
      type: "lunch_break",
      occurredAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});

describe("syncEmployeeActionsSchema", () => {
  it("rejects an empty actions array", () => {
    const result = syncEmployeeActionsSchema.safeParse({ actions: [] });
    expect(result.success).toBe(false);
  });

  it("accepts a batch of valid actions", () => {
    const result = syncEmployeeActionsSchema.safeParse({
      actions: [
        {
          clientId: "123e4567-e89b-12d3-a456-426614174000",
          type: "clock_in",
          occurredAt: new Date().toISOString(),
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
