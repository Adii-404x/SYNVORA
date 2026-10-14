import { describe, expect, it, vi } from 'vitest';
import { SummaryService } from '../../src/services/summary.service';

const source = {
  factId: '72bc852d-fc33-4d4c-bad7-bf8424f7db8a',
  documentId: 'cb2af40d-f3d1-4937-8e20-e4ca39b8b8b6',
  fileName: 'report.pdf',
  evidence: 'Glucose: 105 mg/dL',
};

function makeService(response: unknown) {
  const llm = { chat: vi.fn().mockResolvedValue({ content: JSON.stringify(response), uncertainty: false }) };
  const records = {
    getForUser: vi.fn().mockResolvedValue({
      observations: [{
        factId: source.factId,
        name: 'Glucose',
        date: '2026-01-05',
        value: 105,
        unit: 'mg/dL',
        referenceRange: '70-99 mg/dL',
        interpretation: 'H',
      }],
      medications: [],
      sources: [source],
    }),
  };
  return { service: new SummaryService(llm as never, records as never), llm, records };
}

describe('SummaryService', () => {
  it('does not call the model when there are no verified source records', async () => {
    const { service, llm, records } = makeService({ answer: 'Unused', citations: [], uncertainty: true });
    records.getForUser.mockResolvedValueOnce({ observations: [], medications: [], sources: [] });

    const result = await service.generateSummary('user-1', {} as never);
    expect(result.uncertainty).toBe(true);
    expect(result.sources).toEqual([]);
    expect(llm.chat).not.toHaveBeenCalled();
  });

  it('returns only retrieved citations from a validated summary response', async () => {
    const { service } = makeService({ answer: 'Discuss the glucose result with your clinician.', citations: [source.factId], uncertainty: false });

    const result = await service.generateSummary('user-1', {} as never);
    expect(result.summary).toContain('glucose result');
    expect(result.sources).toEqual([source]);
    expect(result.uncertainty).toBe(false);
  });

  it('asks for a cautious plain-language explanation of source-reported flags', async () => {
    const { service, llm } = makeService({ answer: 'The report marks this result high.', citations: [source.factId], uncertainty: false });

    await service.generateSummary('user-1', {} as never);

    expect(llm.chat).toHaveBeenCalledWith(expect.objectContaining({
      systemPrompt: expect.stringContaining('source-reported high/low/abnormal flag'),
      prompt: expect.stringContaining('"interpretation":"H"'),
    }));
  });

  it('rejects citations absent from the retrieved records', async () => {
    const { service } = makeService({
      answer: 'Unsupported citation.',
      citations: ['93bc852d-fc33-4d4c-bad7-bf8424f7db8a'],
      uncertainty: false,
    });

    await expect(service.generateSummary('user-1', {} as never))
      .rejects.toMatchObject({ statusCode: 502, message: 'AI returned a source that was not retrieved' });
  });
});
