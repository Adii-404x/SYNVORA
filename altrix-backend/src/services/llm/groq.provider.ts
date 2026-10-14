import { z } from "zod";
import { env } from "../../config/env";
import { ILLMProvider, LLMRequest, LLMResponse } from "./llm.types";

const groqResponseSchema = z.object({
  choices: z.array(z.object({
    message: z.object({
      content: z.string().min(1),
    }),
  })).min(1),
});

export class GroqProvider implements ILLMProvider {
  async generate(request: LLMRequest): Promise<LLMResponse> {
    if (!env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL,
        messages: [
          ...(request.systemPrompt ? [{ role: "system", content: request.systemPrompt }] : []),
          { role: "user", content: request.prompt },
        ],
        temperature: request.temperature ?? 0.2,
        max_completion_tokens: request.maxTokens ?? 1024,
        ...(request.responseFormat === "json"
          ? { response_format: { type: "json_object" } }
          : {}),
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      throw new Error(`Groq API request failed (${response.status})`);
    }

    const parsed = groqResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new Error("Invalid Groq response");
    }

    return {
      content: parsed.data.choices[0].message.content,
      uncertainty: false,
    };
  }
}
