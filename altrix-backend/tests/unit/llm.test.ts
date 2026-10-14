import { afterEach, describe, expect, it, vi } from "vitest";
import { OllamaProvider } from "../../src/services/llm/ollama.provider";
import { GroqProvider } from "../../src/services/llm/groq.provider";
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

describe("Groq provider", () => {
  it("sends system/user messages and requests JSON using the configured model", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"answer":"ready"}' } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await new GroqProvider().generate({
      prompt: "synthetic prompt",
      systemPrompt: "Return a JSON object.",
      responseFormat: "json",
    });

    const [url, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(init.headers.Authorization).toBe("Bearer mock-groq-key");
    expect(body).toMatchObject({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: "Return a JSON object." },
        { role: "user", content: "synthetic prompt" },
      ],
      response_format: { type: "json_object" },
    });
    expect(result).toEqual({ content: '{"answer":"ready"}', uncertainty: false });
  });

  it("reports rate limits and malformed responses to the LLM service", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    await expect(new GroqProvider().generate(request)).rejects.toThrow("Groq API request failed (429)");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [] }) }));
    await expect(new GroqProvider().generate(request)).rejects.toThrow("Invalid Groq response");
  });
});
