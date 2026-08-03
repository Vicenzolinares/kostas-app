import { beforeAll, describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "../jwt";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-at-least-32-bytes-long!!";
});

describe("session token sign/verify", () => {
  it("round-trips a valid payload", async () => {
    const token = await signSessionToken(
      { sub: "user-1", name: "Jane", email: "jane@example.com", role: "admin" },
      new Date(Date.now() + 60_000),
    );

    const payload = await verifySessionToken(token);
    expect(payload).toEqual({
      sub: "user-1",
      name: "Jane",
      email: "jane@example.com",
      role: "admin",
    });
  });

  it("rejects an expired token", async () => {
    const token = await signSessionToken(
      { sub: "user-1", name: "Jane", email: "jane@example.com", role: "admin" },
      new Date(Date.now() - 1000),
    );

    const payload = await verifySessionToken(token);
    expect(payload).toBeNull();
  });

  it("rejects a garbage token", async () => {
    const payload = await verifySessionToken("not-a-real-token");
    expect(payload).toBeNull();
  });
});
