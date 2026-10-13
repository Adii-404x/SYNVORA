export interface LLMResponse {
  content: string;
  citations?: Array<{
    factId: string;
    documentId: string;
  }>;
  uncertainty: boolean;
}

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  context?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json';
}

export interface ILLMProvider {
  generate(request: LLMRequest): Promise<LLMResponse>;
}

