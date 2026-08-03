import { describe, expect, it } from "vitest";
import { createFabricSchema } from "../fabric-inventory";
import { createProjectFabricSchema } from "../project-fabric";

describe("createFabricSchema", () => {
  it("defaults stock and reserved yardage to 0", () => {
    const result = createFabricSchema.safeParse({
      fabricCode: "FAB-0001",
      name: "Belgian Linen",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.yardsInStock).toBe(0);
      expect(result.data.yardsReserved).toBe(0);
    }
  });

  it("rejects a negative width", () => {
    const result = createFabricSchema.safeParse({
      fabricCode: "FAB-0001",
      name: "Belgian Linen",
      widthInches: -10,
    });
    expect(result.success).toBe(false);
  });
});

describe("createProjectFabricSchema", () => {
  it("requires yardsRequired to be positive", () => {
    const result = createProjectFabricSchema.safeParse({
      projectId: "123e4567-e89b-12d3-a456-426614174000",
      fabricId: "123e4567-e89b-12d3-a456-426614174001",
      yardsRequired: 0,
    });
    expect(result.success).toBe(false);
  });

  it("defaults status to draft", () => {
    const result = createProjectFabricSchema.safeParse({
      projectId: "123e4567-e89b-12d3-a456-426614174000",
      fabricId: "123e4567-e89b-12d3-a456-426614174001",
      yardsRequired: 5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("draft");
    }
  });
});
