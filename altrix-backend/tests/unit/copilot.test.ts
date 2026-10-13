import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { llmService } from "../../src/services/llm/llm.service";
import { ApiError } from "../../src/utils/api-error";

const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ auth: { getUser: getUserMock } })),
}));

vi.mock("../../src/services/llm/llm.service", () => ({
  llmService: { chat: vi.fn() },
}));

describe("Copilot API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    vi.mocked(llmService.chat).mockResolvedValue({ content: "A cautious answer.", uncertainty: false });
  });

  it("requires authentication", async () => {
    const res = await request(app).post("/api/copilot/chat").send({ message: "Hello" });
    expect(res.status).toBe(401);
    expect(llmService.chat).not.toHaveBeenCalled();
  });

  it("rejects invalid request bodies", async () => {
    const res = await request(app).post("/api/copilot/chat")
      .set("Authorization", "Bearer valid")
      .send({ msg: "wrong key" });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("Validation failed");
    expect(llmService.chat).not.toHaveBeenCalled();
  });

  it("returns a successful answer and marks client supplied context unverified", async () => {
    const res = await request(app).post("/api/copilot/chat")
      .set("Authorization", "Bearer valid")
      .send({ message: "What does this result mean?", context: [{
        factId: "72bc852d-fc33-4d4c-bad7-bf8424f7db8a", type: "Glucose", value: "105", unit: "mg/dL",
      }] });
    expect(res.status).toBe(200);
    expect(res.body.answer).toBe("A cautious answer.");
    expect(res.body.uncertainty).toBe(true);
    expect(res.body.sources).toEqual([]);
    expect(vi.mocked(llmService.chat).mock.calls[0][0].prompt).toContain("UNVERIFIED");
  });

  it("does not claim certainty when there is no supplied context", async () => {
    const res = await request(app).post("/api/copilot/chat")
      .set("Authorization", "Bearer valid")
      .send({ message: "What is my diagnosis?" });
    expect(res.status).toBe(200);
    expect(res.body.uncertainty).toBe(true);
  });

  it("returns a safe provider failure", async () => {
    vi.mocked(llmService.chat).mockRejectedValueOnce(new ApiError(502, "AI Service temporarily unavailable"));
    const res = await request(app).post("/api/copilot/chat")
      .set("Authorization", "Bearer valid")
      .send({ message: "Hello" });
    expect(res.status).toBe(502);
    expect(res.body.error.message).toBe("AI Service temporarily unavailable");
    expect(JSON.stringify(res.body)).not.toContain("private provider details");
  });
});
