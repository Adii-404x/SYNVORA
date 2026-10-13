import { describe, expect, it, vi } from 'vitest';
import { VerifiedRecordsService } from '../../src/services/verified-records.service';

function makeQuery(data: unknown) {
  const query: any = {};
  for (const method of ['select', 'eq', 'in']) query[method] = vi.fn(() => query);
  query.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve({ data, error: null }).then(resolve, reject);
  return query;
}

describe('VerifiedRecordsService', () => {
  it('scopes rows to the user and returns only records linked to confirmed source facts', async () => {
    const queries = {
      observations: makeQuery([{
        id: 'observation-1',
        fact_id: 'fact-1',
        observation_date: '2026-01-05',
        display_name: 'Glucose',
        value: 105,
        unit: 'mg/dL',
        interpretation: null,
      }]),
      medications: makeQuery([]),
      extracted_facts: makeQuery([{
        id: 'fact-1',
        document_id: 'document-1',
        source_text: 'Glucose 105 mg/dL',
        reference_range: '70-99 mg/dL',
      }]),
      health_documents: makeQuery([{ id: 'document-1', file_name: 'report.pdf' }]),
    };
    const supabase = { from: vi.fn((table: keyof typeof queries) => queries[table]) };

    const result = await new VerifiedRecordsService().getForUser(supabase as never, 'user-1');

    expect(result.observations).toEqual([{
      id: 'observation-1',
      factId: 'fact-1',
      name: 'Glucose',
      date: '2026-01-05',
      value: 105,
      unit: 'mg/dL',
      referenceRange: '70-99 mg/dL',
    }]);
    expect(result.sources).toEqual([{
      factId: 'fact-1',
      documentId: 'document-1',
      fileName: 'report.pdf',
      evidence: 'Glucose 105 mg/dL',
    }]);
    expect(queries.observations.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(queries.observations.eq).toHaveBeenCalledWith('verified_by', 'user-1');
    expect(queries.extracted_facts.eq).toHaveBeenCalledWith('verification_status', 'confirmed');
    expect(queries.extracted_facts.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(queries.health_documents.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });
});
