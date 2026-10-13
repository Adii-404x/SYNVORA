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
      observations: [{ factId, name: 'Glucose', date: '2026-01-05', value: 105, unit: 'mg/dL', referenceRange: '70-99' }],
      medications: [],
      sources: [source],
    }),
  };
  return { service: new CopilotService(llm as never, records as never), llm, records };
}

describe('CopilotService', () => {
  it('returns only citations that were retrieved with verified records', async () => {
    const { service, llm } = makeService({ answer: 'The record lists 105 mg/dL.', citations: [factId], uncertainty: false });
    const result = await service.groundedChat('user-1', {} as never, 'What was my result?');

    expect(result.sources).toEqual([source]);
    expect(result.uncertainty).toBe(false);
    expect(llm.chat).toHaveBeenCalledWith(expect.objectContaining({ responseFormat: 'json' }));
  });

  it('rejects model citations outside the retrieved source set', async () => {
    const { service } = makeService({
      answer: 'Unsupported claim.',
      citations: ['93bc852d-fc33-4d4c-bad7-bf8424f7db8a'],
      uncertainty: false,
    });

    await expect(service.groundedChat('user-1', {} as never, 'Question'))
      .rejects.toMatchObject({ statusCode: 502, message: 'AI returned a source that was not retrieved' });
  });

  it('does not call the model when no verified sources are available', async () => {
    const { service, llm, records } = makeService({ answer: 'Unused', citations: [], uncertainty: true });
    records.getForUser.mockResolvedValueOnce({ observations: [], medications: [], sources: [] });

    const result = await service.groundedChat('user-1', {} as never, 'Question');
    expect(result.uncertainty).toBe(true);
    expect(result.sources).toEqual([]);
    expect(llm.chat).not.toHaveBeenCalled();
  });

  it('does not use another user\'s conversation', async () => {
    const { service, records } = makeService({ answer: 'Unused', citations: [], uncertainty: true });
    const query: any = {};
    for (const method of ['select', 'eq']) query[method] = vi.fn(() => query);
    query.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = { from: vi.fn(() => query) };

    await expect(service.groundedChat('user-1', supabase as never, 'Question', factId))
      .rejects.toBeInstanceOf(ApiError);
    expect(records.getForUser).not.toHaveBeenCalled();
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });
});
