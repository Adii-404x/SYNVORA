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
        const savedConversationId = await this.saveMessages(supabase, userId, conversationId, message, answer, []);
        return { answer, sources: [], uncertainty: true, conversationId: savedConversationId };
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
      const savedConversationId = await this.saveMessages(
        supabase, userId, conversationId, message, parsed.data.answer, sources,
      );

      return {
        answer: parsed.data.answer,
        sources,
        uncertainty: parsed.data.uncertainty || sources.length === 0,
        conversationId: savedConversationId,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Copilot service unavailable', true, error);
    }
  }

  private async saveMessages(
    supabase: SupabaseClient,
    userId: string,
    conversationId: string | undefined,
    message: string,
    answer: string,
    citations: Array<{ factId: string; documentId: string; fileName: string; evidence: string }>,
  ) {
    const { data, error } = await supabase.rpc('save_copilot_turn', {
      p_conversation_id: conversationId ?? null,
      p_user_id: userId,
      p_user_message: message,
      p_assistant_message: answer,
      p_citations: citations,
    });
    if (error || typeof data !== 'string') throw new ApiError(500, 'Failed to save conversation');
    return data;
  }
}

export const copilotService = new CopilotService();
