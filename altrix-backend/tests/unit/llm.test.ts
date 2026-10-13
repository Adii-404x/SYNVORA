import { afterEach, describe, expect, it, vi } from "vitest";
import { OllamaProvider } from "../../src/services/llm/ollama.provider";
import { LLMService } from "../../src/services/llm/llm.service";
import { ApiError } from "../../src/utils/api-error";

const request = { prompt: "synthetic prompt" };

afterEach(() => vi.unstubAllGlobals());

describe("Ollama provider and LLM service", () => {
  it("validates the Ollama response shape", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ response: 12 }) }));
    await expect(new OllamaProvider().generate(request)).rejects.toThrow("Ollama provider request failed");
  });

  it("handles provider timeouts without exposing fetch details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("timed out", "TimeoutError")));
    await expect(new OllamaProvider().generate(request)).rejects.toThrow("Ollama provider request failed");
  });

  it("handles unavailable and rate-limited provider responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429, statusText: "Rate limited" }));
    await expect(new OllamaProvider().generate(request)).rejects.toThrow("Ollama provider request failed");
  });

  it("maps provider errors to a safe API error", async () => {
    const service = new LLMService({ generate: async () => { throw new Error("private provider detail"); } });
    await expect(service.chat(request)).rejects.toMatchObject({
      statusCode: 502,
      message: "AI Service temporarily unavailable",
    } satisfies Partial<ApiError>);
  });
});
