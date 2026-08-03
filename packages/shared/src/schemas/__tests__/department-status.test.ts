import { describe, expect, it } from "vitest";
import { updateProductionStageSchema } from "../department-status";

describe("updateProductionStageSchema", () => {
  it("accepts a minimal valid update", () => {
    const result = updateProductionStageSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      status: "in_progress",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown status", () => {
    const result = updateProductionStageSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      status: "on_hold",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-uuid id", () => {
    const result = updateProductionStageSchema.safeParse({
      id: "not-a-uuid",
      status: "done",
    });
    expect(result.success).toBe(false);
  });
});
