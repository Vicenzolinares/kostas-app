import { describe, expect, it } from "vitest";
import { createProjectSchema, updateProjectSchema } from "../project";

describe("createProjectSchema", () => {
  it("accepts a minimal valid project", () => {
    const result = createProjectSchema.safeParse({
      name: "Sofa reupholstery",
      clientName: "Jane Smith",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("lead");
    }
  });

  it("rejects an empty name", () => {
    const result = createProjectSchema.safeParse({
      name: "",
      clientName: "Jane",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid client email", () => {
    const result = createProjectSchema.safeParse({
      name: "Sofa",
      clientName: "Jane",
      clientEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative budget", () => {
    const result = createProjectSchema.safeParse({
      name: "Sofa",
      clientName: "Jane",
      budget: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown status", () => {
    const result = createProjectSchema.safeParse({
      name: "Sofa",
      clientName: "Jane",
      status: "not_a_status",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateProjectSchema", () => {
  it("requires a valid id", () => {
    const result = updateProjectSchema.safeParse({ name: "New name" });
    expect(result.success).toBe(false);
  });

  it("allows a partial update with a valid id", () => {
    const result = updateProjectSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      status: "approved",
    });
    expect(result.success).toBe(true);
  });
});
