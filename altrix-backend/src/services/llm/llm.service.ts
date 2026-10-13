import { ILLMProvider, LLMRequest, LLMResponse } from "./llm.types";
import { OllamaProvider } from "./ollama.provider";
import { ApiError } from "../../utils/api-error";

export class LLMService {
  constructor(private readonly provider: ILLMProvider = new OllamaProvider()) {}

  async chat(request: LLMRequest): Promise<LLMResponse> {
    try {
      return await this.provider.generate(request);
    } catch {
      throw new ApiError(502, "AI Service temporarily unavailable");
    }
  }
}

export const llmService = new LLMService();

