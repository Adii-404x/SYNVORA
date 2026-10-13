import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app";

describe("Health Check", () => {
  it("returns 200 with process health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe("healthy");
    expect(res.body.timestamp).toBeTypeOf("string");
  });

  it("returns a consistent 404 for unknown routes without stack details", async () => {
    const res = await request(app).get("/no-such-route");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: { message: "Route not found", statusCode: 404 } });
  });

  it("returns a safe 400 for malformed JSON", async () => {
    const res = await request(app).post("/api/copilot/chat")
      .set("Content-Type", "application/json")
      .send("{");
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("Malformed JSON request body");
    expect(JSON.stringify(res.body)).not.toContain("SyntaxError");
  });
});
