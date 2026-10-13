import { llmService } from './llm/llm.service';
import { supabaseAdmin } from '../integrations/supabase/client';
import { ApiError } from '../utils/api-error';
import { auditService } from './audit.service';

export class CopilotService {
  async groundedChat(userId: string, message: string, conversationId?: string) {
    try {
      const { data: observations } = await supabaseAdmin
        .from('observations')
        .select('*')
        .eq('user_id', userId);
      
      const { data: medications } = await supabaseAdmin
        .from('medications')
        .select('*')
        .eq('user_id', userId);

      const { data: docs } = await supabaseAdmin
        .from('health_documents')
        .select('id, file_name')
        .eq('user_id', userId);

      const context = `
        Verified Observations: ${JSON.stringify(observations)}
        Verified Medications: ${JSON.stringify(medications)}
        Available Documents: ${JSON.stringify(docs)}
      `;

      const systemPrompt = `You are the Altrix Health Copilot. You provide plain-language explanations based ONLY on the provided verified medical records.
      
      STRICT RULES:
      1. Grounding: If a fact is not in the provided context, state that you do not have that information.
      2. Citations: When mentioning a record, cite the source (e.g., [Doc: ID]).
      3. No Diagnosis: Do not diagnose. Do not prescribe.
      4. Urgent Care: If the user describes an emergent situation, advise immediate professional care.
      5. Integrity: Never fabricate data or sources.
      
      CONTEXT:
      ${context}`;

      const response = await llmService.chat({
        systemPrompt,
        prompt: message,
        temperature: 0.2,
      });

      if (conversationId) {
        await supabaseAdmin.from('copilot_messages').insert({
          conversation_id: conversationId,
          role: 'user',
          content: message,
        });
        await supabaseAdmin.from('copilot_messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: response.content,
        });
      }

      return {
        answer: response.content,
        sources: docs?.map((d: any) => d.id) || [],
      };
    } catch (error) {
      throw new ApiError(500, 'Copilot service unavailable', true, error);
    }
  }
}

export const copilotService = new CopilotService();