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
        original_value: '105.0',
        unit: 'mg/dL',
        interpretation: null,
      }]),
      medications: makeQuery([]),
      extracted_facts: makeQuery([{
        id: 'fact-1',
        document_id: 'document-1',
        source_text: 'Glucose 105 mg/dL',
        reference_range: '70-99 mg/dL',
        page_number: 1,
        extraction_method: 'pdf_text',
        candidate_data: null,
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
      value: '105.0',
      unit: 'mg/dL',
      referenceRange: '70-99 mg/dL',
    }]);
    expect(result.sources).toEqual([{
      factId: 'fact-1',
      documentId: 'document-1',
      fileName: 'report.pdf',
      evidence: 'Glucose 105 mg/dL',
      pageNumber: 1,
      extractionMethod: 'pdf_text',
    }]);
    expect(queries.observations.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(queries.observations.eq).toHaveBeenCalledWith('verified_by', 'user-1');
    expect(queries.extracted_facts.eq).toHaveBeenCalledWith('verification_status', 'confirmed');
    expect(queries.extracted_facts.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(queries.health_documents.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('excludes pending or rejected facts and their records from verified output', async () => {
    const queries = {
      observations: makeQuery([{
        id: 'observation-1', fact_id: 'fact-1', observation_date: '2026-01-05',
        display_name: 'Glucose', value: 105, original_value: '105', unit: 'mg/dL', interpretation: null,
      }]),
      medications: makeQuery([]),
      extracted_facts: makeQuery([]),
      health_documents: makeQuery([]),
    };
    const supabase = { from: vi.fn((table: keyof typeof queries) => queries[table]) };

    const result = await new VerifiedRecordsService().getForUser(supabase as never, 'user-1');

    expect(result).toEqual({ observations: [], medications: [], sources: [] });
    expect(queries.extracted_facts.eq).toHaveBeenCalledWith('verification_status', 'confirmed');
  });

  it('returns medication details from that candidate’s typed payload', async () => {
    const queries = {
      observations: makeQuery([]),
      medications: makeQuery([{
        id: 'medication-1', fact_id: 'fact-2', drug_name: 'Example medicine',
        dosage: 'Take as printed', frequency: 'once daily', start_date: null,
        end_date: null, status: null,
      }]),
      extracted_facts: makeQuery([{
        id: 'fact-2', document_id: 'document-2', source_text: 'Example medicine 10 mg',
        reference_range: null, fact_date: null, page_number: 1, extraction_method: 'image_ocr',
        candidate_data: { strength: '10 mg', duration: '5 days', date: 'as printed' },
      }]),
      health_documents: makeQuery([{ id: 'document-2', file_name: 'prescription.png' }]),
    };
    const supabase = { from: vi.fn((table: keyof typeof queries) => queries[table]) };

    const result = await new VerifiedRecordsService().getForUser(supabase as never, 'user-1');

    expect(result.medications).toEqual([{
      id: 'medication-1', factId: 'fact-2', name: 'Example medicine',
      dosage: 'Take as printed', frequency: 'once daily', startDate: null,
      endDate: null, status: null, strength: '10 mg', duration: '5 days', reportedDate: 'as printed',
    }]);
  });
});
