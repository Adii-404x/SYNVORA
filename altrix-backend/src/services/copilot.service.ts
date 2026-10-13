import { SupabaseClient } from '@supabase/supabase-js';
import { HEALTH_COPILOT_SYSTEM_PROMPT } from '../prompts/health-copilot.prompt';
import { groundedAnswerSchema } from '../schemas/copilot.schema';
import { ApiError } from '../utils/api-error';
import { verifiedRecordsService } from './verified-records.service';
import { llmService } from './llm/llm.service';

export class CopilotService {
  constructor(
    private readonly llm = llmService,
    private readonly records = verifiedRecordsService,
  ) {}

  async groundedChat(
    userId: string,
    supabase: SupabaseClient,
    message: string,
    conversationId?: string,
  ) {
    try {
      if (conversationId) {
        const { data, error } = await supabase
          .from('copilot_conversations')
          .select('id')
          .eq('id', conversationId)
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw new ApiError(500, 'Failed to load conversation');
        if (!data) throw new ApiError(404, 'Conversation not found');
      }

      const records = await this.records.getForUser(supabase, userId);
      if (records.sources.length === 0) {
        const answer = 'I do not have verified, source-linked health records to answer this. This is informational and not a clinician\'s diagnosis or treatment instruction.';
        await this.saveMessages(supabase, conversationId, message, answer, []);
        return { answer, sources: [], uncertainty: true };
      }

      const response = await this.llm.chat({
        systemPrompt: HEALTH_COPILOT_SYSTEM_PROMPT,
        prompt: JSON.stringify({ question: message, records }),
        temperature: 0.2,
        responseFormat: 'json',
      });

      let output: unknown;
      try {
        output = JSON.parse(response.content);
      } catch {
        throw new ApiError(502, 'AI returned an invalid structured response');
      }

      const parsed = groundedAnswerSchema.safeParse(output);
      if (!parsed.success) throw new ApiError(502, 'AI returned an invalid structured response');

      const sourceByFactId = new Map(records.sources.map((source) => [source.factId, source]));
      const citedSources = parsed.data.citations.map((factId) => sourceByFactId.get(factId));
      if (citedSources.some((source) => !source)) {
        throw new ApiError(502, 'AI returned a source that was not retrieved');
      }

      const sources = citedSources.filter((source) => source !== undefined);
      await this.saveMessages(supabase, conversationId, message, parsed.data.answer, sources);

      return {
        answer: parsed.data.answer,
        sources,
        uncertainty: parsed.data.uncertainty || sources.length === 0,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Copilot service unavailable', true, error);
    }
  }

  private async saveMessages(
    supabase: SupabaseClient,
    conversationId: string | undefined,
    message: string,
    answer: string,
    citations: Array<{ factId: string; documentId: string; fileName: string; evidence: string }>,
  ) {
    if (!conversationId) return;

    const { error: userMessageError } = await supabase.from('copilot_messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: message,
    });
    if (userMessageError) throw new ApiError(500, 'Failed to save conversation');

    const { error: assistantMessageError } = await supabase.from('copilot_messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: answer,
      citations,
    });
    if (assistantMessageError) throw new ApiError(500, 'Failed to save conversation');
  }
}

export const copilotService = new CopilotService();
