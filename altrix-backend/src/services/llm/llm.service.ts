import { ILLMProvider, LLMRequest, LLMResponse } from "./llm.types";
import { OllamaProvider } from "./ollama.provider";
import { GroqProvider } from "./groq.provider";
import { env } from "../../config/env";
import { ApiError } from "../../utils/api-error";

export class LLMService {
  constructor(
    private readonly provider: ILLMProvider = env.AI_PROVIDER === "groq"
      ? new GroqProvider()
      : new OllamaProvider(),
  ) {}

  async chat(request: LLMRequest): Promise<LLMResponse> {
    try {
      return await this.provider.generate(request);
    } catch {
      throw new ApiError(502, "AI Service temporarily unavailable");
    }
  }
}

export const activeLLMModel = env.AI_PROVIDER === "groq" ? env.GROQ_MODEL : env.OLLAMA_MODEL;
export const llmService = new LLMService();
