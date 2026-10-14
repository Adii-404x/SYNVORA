import { describe, expect, it, vi } from 'vitest';
import { CopilotService } from '../../src/services/copilot.service';
import { ApiError } from '../../src/utils/api-error';

const factId = '72bc852d-fc33-4d4c-bad7-bf8424f7db8a';
const source = {
  factId,
  documentId: 'cb2af40d-f3d1-4937-8e20-e4ca39b8b8b6',
  fileName: 'report.pdf',
  evidence: 'Glucose: 105 mg/dL',
};

function makeService(answer: unknown) {
  const llm = { chat: vi.fn().mockResolvedValue({ content: JSON.stringify(answer), uncertainty: false }) };
  const records = {
    getForUser: vi.fn().mockResolvedValue({
      observations: [{
        factId,
        name: 'Glucose',
        date: '2026-01-05',
        value: 105,
        unit: 'mg/dL',
        referenceRange: '70-99',
        interpretation: 'H',
      }],
      medications: [],
      sources: [source],
    }),
  };
  const supabase = { rpc: vi.fn().mockResolvedValue({ data: 'conversation-1', error: null }) };
  return { service: new CopilotService(llm as never, records as never), llm, records, supabase };
}

describe('CopilotService', () => {
  it('returns only citations that were retrieved with verified records', async () => {
    const { service, llm, supabase } = makeService({ answer: 'The record lists 105 mg/dL.', citations: [factId], uncertainty: false });
    const result = await service.groundedChat('user-1', supabase as never, 'What was my result?');

    expect(result.sources).toEqual([source]);
    expect(result.uncertainty).toBe(false);
    expect(result.conversationId).toBe('conversation-1');
    expect(supabase.rpc).toHaveBeenCalledWith('save_copilot_turn', expect.objectContaining({
      p_conversation_id: null, p_user_id: 'user-1', p_user_message: 'What was my result?',
    }));
    expect(llm.chat).toHaveBeenCalledWith(expect.objectContaining({ responseFormat: 'json' }));
    expect(llm.chat.mock.calls[0][0].systemPrompt).toContain('source does not provide enough context');
    expect(llm.chat.mock.calls[0][0].prompt).toContain('"interpretation":"H"');
  });

  it('rejects model citations outside the retrieved source set', async () => {
    const { service, supabase } = makeService({
      answer: 'Unsupported claim.',
      citations: ['93bc852d-fc33-4d4c-bad7-bf8424f7db8a'],
      uncertainty: false,
    });

    await expect(service.groundedChat('user-1', supabase as never, 'Question'))
      .rejects.toMatchObject({ statusCode: 502, message: 'AI returned a source that was not retrieved' });
  });

  it('does not call the model when no verified sources are available', async () => {
    const { service, llm, records, supabase } = makeService({ answer: 'Unused', citations: [], uncertainty: true });
    records.getForUser.mockResolvedValueOnce({ observations: [], medications: [], sources: [] });

    const result = await service.groundedChat('user-1', supabase as never, 'Question');
    expect(result.uncertainty).toBe(true);
    expect(result.sources).toEqual([]);
    expect(llm.chat).not.toHaveBeenCalled();
  });

  it('does not use another user\'s conversation', async () => {
    const { service, records } = makeService({ answer: 'Unused', citations: [], uncertainty: true });
    const query: any = {};
    for (const method of ['select', 'eq']) query[method] = vi.fn(() => query);
    query.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = { from: vi.fn(() => query), rpc: vi.fn() };

    await expect(service.groundedChat('user-1', supabase as never, 'Question', factId))
      .rejects.toBeInstanceOf(ApiError);
    expect(records.getForUser).not.toHaveBeenCalled();
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('fails safely when the atomic conversation write fails', async () => {
    const { service, supabase } = makeService({ answer: 'Answer', citations: [factId], uncertainty: false });
    supabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'database failure' } });

    await expect(service.groundedChat('user-1', supabase as never, 'Question'))
      .rejects.toMatchObject({ statusCode: 500, message: 'Failed to save conversation' });
  });
});
