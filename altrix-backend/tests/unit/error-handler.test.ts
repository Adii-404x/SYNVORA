import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { errorHandler } from "../../src/middleware/error-handler";

describe("Central error handling", () => {
  it("returns a safe JSON 500 for unexpected asynchronous errors", async () => {
    const app = express();
    app.get("/failure", async () => { throw new Error("secret provider or stack detail"); });
    app.use(errorHandler);
    const res = await request(app).get("/failure");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, error: { message: "Internal server error", statusCode: 500 } });
    expect(JSON.stringify(res.body)).not.toContain("secret provider or stack detail");
  });
});
