import { ILLMProvider, LLMRequest, LLMResponse } from "./llm.types";
import { env } from "../../config/env";
import { z } from "zod";

const ollamaResponseSchema = z.object({ response: z.string().min(1) });

export class OllamaProvider implements ILLMProvider {
  async generate(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await fetch(`${env.OLLAMA_BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: env.OLLAMA_MODEL,
          prompt: request.prompt,
          system: request.systemPrompt,
          format: request.responseFormat,
          think: false,
          stream: false,
          options: {
            temperature: request.temperature ?? 0.2,
            num_predict: request.maxTokens ?? 1024,
          },
        }),
        signal: AbortSignal.timeout(120_000),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const parsed = ollamaResponseSchema.safeParse(await response.json());
      if (!parsed.success) {
        throw new Error("Invalid model response");
      }

      return {
        content: parsed.data.response,
        uncertainty: false,
      };
    } catch {
      throw new Error("Ollama provider request failed");
    }
  }
}
