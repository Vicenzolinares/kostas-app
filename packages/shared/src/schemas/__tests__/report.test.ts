import { describe, expect, it } from "vitest";
import { reportFiltersSchema } from "../report";

describe("reportFiltersSchema", () => {
  it("accepts a report type with no date range", () => {
    const result = reportFiltersSchema.safeParse({ type: "project-pipeline" });
    expect(result.success).toBe(true);
  });

  it("accepts a report type with a date range", () => {
    const result = reportFiltersSchema.safeParse({
      type: "production-throughput",
      from: "2026-01-01",
      to: "2026-02-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown report type", () => {
    const result = reportFiltersSchema.safeParse({ type: "not-a-report" });
    expect(result.success).toBe(false);
  });
});
