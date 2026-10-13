import { describe, expect, it, vi } from 'vitest';
import { FactsService } from '../../src/services/facts.service';

function makeQuery(data: unknown) {
  const query: any = {};
  for (const method of ['select', 'eq', 'in', 'order', 'limit']) query[method] = vi.fn(() => query);
  query.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve({ data, error: null }).then(resolve, reject);
  return query;
}

const result = {
  factId: '72bc852d-fc33-4d4c-bad7-bf8424f7db8a',
  decision: 'confirm' as const,
  factType: 'observation' as const,
  recordId: 'cb2af40d-f3d1-4937-8e20-e4ca39b8b8b6',
  idempotent: false,
};

describe('FactsService', () => {
  it('lists only the authenticated owner’s pending facts with owned document labels', async () => {
    const factQuery = makeQuery([{
      id: result.factId,
      document_id: 'document-1',
      fact_type: 'observation',
      display_name: 'Glucose',
      fact_value: '5.4',
      fact_unit: 'mmol/L',
      reference_range: '3.9-5.5',
      fact_date: null,
      source_text: 'Glucose 5.4 mmol/L',
      page_number: 2,
      extraction_method: 'pdf_text',
      candidate_data: { test_name: 'Glucose', value: '5.4' },
      created_at: '2026-01-05T00:00:00Z',
    }]);
    const documentQuery = makeQuery([{ id: 'document-1', file_name: 'report.pdf' }]);
    const supabase = { from: vi.fn((table: string) => table === 'extracted_facts' ? factQuery : documentQuery) };

    const rows = await new FactsService().listPending(supabase as never, 'user-1');

    expect(rows[0].source_document).toEqual({ id: 'document-1', file_name: 'report.pdf' });
    expect(factQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(factQuery.eq).toHaveBeenCalledWith('verification_status', 'pending');
    expect(documentQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('uses one atomic database RPC for confirmation and passes no client-selected owner', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: result, error: null });
    const supabase = { rpc, from: vi.fn() };

    await expect(new FactsService().review(supabase as never, result.factId, 'confirm', '2026-01-05'))
      .resolves.toEqual(result);

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('review_extracted_fact', {
      p_fact_id: result.factId,
      p_decision: 'confirm',
      p_observation_date: '2026-01-05',
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('treats a repeated confirmation as idempotent', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { ...result, idempotent: true }, error: null });
    const service = new FactsService();

    const response = await service.review({ rpc } as never, result.factId, 'confirm');

    expect(response.idempotent).toBe(true);
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it('returns a source-backed medication confirmation result', async () => {
    const medicationResult = {
      ...result,
      factType: 'medication' as const,
      recordId: '93bc852d-fc33-4d4c-bad7-bf8424f7db8a',
    };
    const rpc = vi.fn().mockResolvedValue({ data: medicationResult, error: null });

    await expect(new FactsService().review({ rpc } as never, result.factId, 'confirm'))
      .resolves.toEqual(medicationResult);
  });

  it('rejects without creating a verified record', async () => {
    const rejected = { ...result, decision: 'reject' as const, factType: 'medication' as const, recordId: null };
    const rpc = vi.fn().mockResolvedValue({ data: rejected, error: null });

    await expect(new FactsService().review({ rpc } as never, result.factId, 'reject')).resolves.toEqual(rejected);
    expect(rpc).toHaveBeenCalledWith('review_extracted_fact', expect.objectContaining({
      p_decision: 'reject',
      p_observation_date: null,
    }));
  });

  it('hides cross-user IDs as not found', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { code: 'P0002', message: 'candidate not found' } });

    await expect(new FactsService().review({ rpc } as never, result.factId, 'confirm'))
      .rejects.toMatchObject({ statusCode: 404, message: 'Candidate fact not found' });
  });

  it('keeps incomplete candidates pending and returns a safe validation error', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { code: '22023', message: 'private detail' } });

    await expect(new FactsService().review({ rpc } as never, result.factId, 'confirm'))
      .rejects.toMatchObject({ statusCode: 422, message: 'Candidate fact is incomplete and remains pending' });
  });

  it('rejects invalid transitions and database failures without leaking database details', async () => {
    const conflict = vi.fn().mockResolvedValue({ data: null, error: { code: '23514', message: 'private detail' } });
    const unavailable = vi.fn().mockResolvedValue({ data: null, error: { code: 'XX000', message: 'private detail' } });

    await expect(new FactsService().review({ rpc: conflict } as never, result.factId, 'confirm'))
      .rejects.toMatchObject({ statusCode: 409 });
    await expect(new FactsService().review({ rpc: unavailable } as never, result.factId, 'confirm'))
      .rejects.toMatchObject({ statusCode: 500, message: 'Failed to review candidate fact' });
  });
});
