import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { createClient } from "@supabase/supabase-js";

const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ auth: { getUser: getUserMock } })),
}));

describe("Authentication Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
  });

  it("rejects a missing bearer token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects malformed authorization headers", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer one two");
    expect(res.status).toBe(401);
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("rejects invalid or expired tokens safely", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null }, error: new Error("secret detail") });
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer invalid-token");
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid or expired token");
    expect(JSON.stringify(res.body)).not.toContain("secret detail");
    expect(getUserMock).toHaveBeenCalledWith("invalid-token");
  });

  it("attaches only the identity returned by Supabase", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer valid-token");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, user: { id: "user-123" } });
    expect(getUserMock).toHaveBeenCalledWith("valid-token");
    expect(vi.mocked(createClient)).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        global: { headers: { Authorization: "Bearer valid-token" } },
      }),
    );
  });
});
