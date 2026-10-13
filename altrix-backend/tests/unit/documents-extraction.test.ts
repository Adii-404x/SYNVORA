import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExtractionService } from '../../src/services/documents/extraction.service';
import { storageService } from '../../src/integrations/supabase/storage';
import { pdfService } from '../../src/services/documents/pdf.service';
import { ocrService } from '../../src/services/documents/ocr.service';
import { llmService } from '../../src/services/llm/llm.service';
import { medicalDocumentScenarios } from '../fixtures/medical-document-scenarios';

vi.mock('../../src/services/audit.service', () => ({ auditService: { logAction: vi.fn() } }));
vi.mock('../../src/integrations/supabase/storage', () => ({
  storageService: { downloadMedicalDocument: vi.fn() },
}));
vi.mock('../../src/services/documents/pdf.service', () => ({ pdfService: { extractPages: vi.fn() } }));
vi.mock('../../src/services/documents/ocr.service', () => ({
  ocrService: { extractTextFromImage: vi.fn() },
  qualityFlagsForText: (text: string) => !text.trim() ? ['empty_text'] : text.trim().length < 40 ? ['suspiciously_short_text'] : [],
}));
vi.mock('../../src/services/llm/llm.service', () => ({ llmService: { chat: vi.fn() } }));

const observation = {
  test_name: 'Glucose', value: '5.4', unit: 'mmol/L', reference_range: '3.9-5.5',
  flag: null, date: null, page_number: 2, source_text: 'Glucose 5.4 mmol/L',
};
const medication = {
  drug_name: 'Example medicine', strength: '10 mg', dosage_instructions: 'Take as printed',
  frequency: 'once daily', duration: '5 days', date: null, page_number: 1,
  source_text: 'Example medicine 10 mg',
};
const pages = [
  { pageNumber: 1, text: 'Example medicine 10 mg', method: 'pdf_text' as const, ocrConfidence: null, blocks: [], qualityFlags: [] },
  { pageNumber: 2, text: 'Glucose 5.4 mmol/L', method: 'pdf_ocr' as const, ocrConfidence: 86, blocks: [], qualityFlags: [] },
];

function makeSupabase() {
  let runId = 0;
  const runTable = {
    insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockImplementation(async () => ({ data: { id: `run-${++runId}` }, error: null })) })) })),
    update: vi.fn(() => ({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) })),
  };
  const upsert = vi.fn().mockResolvedValue({ error: null });
  return {
    client: { from: vi.fn((table: string) => table === 'extraction_runs' ? runTable : { upsert }) },
    runTable,
    upsert,
  };
}

describe('ExtractionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(storageService.downloadMedicalDocument).mockResolvedValue(Buffer.from('synthetic'));
    vi.mocked(pdfService.extractPages).mockResolvedValue({
      pages,
      text: '[Page 1]\nExample medicine 10 mg\n[Page 2]\nGlucose 5.4 mmol/L',
      pageCount: 2,
      extractionMethod: 'mixed_pdf',
      qualityFlags: [],
    });
    vi.mocked(ocrService.extractTextFromImage).mockResolvedValue({ text: 'synthetic image text', confidence: null, blocks: [], qualityFlags: [] });
    vi.mocked(llmService.chat).mockResolvedValue({
      content: JSON.stringify({
        metadata: { document_type: 'lab', report_date: '2026-02-01', facility: null, patient_name: null },
        observations: [observation],
        medications: [medication],
      }),
      uncertainty: false,
    });
  });

  it('persists the complete typed payload, source offsets and independent confidence values', async () => {
    const db = makeSupabase();
    const result = await new ExtractionService().processDocument('doc-1', 'user-1', 'path', 'application/pdf', db.client as never);

    const [candidates, options] = db.upsert.mock.calls[0];
    expect(options).toEqual({ onConflict: 'document_id,dedupe_key', ignoreDuplicates: true });
    expect(candidates[0]).toMatchObject({
      fact_date: null,
      candidate_data: observation,
      verification_status: 'pending',
      ocr_confidence: 86,
      llm_confidence: null,
      source_start_offset: 0,
      source_end_offset: 18,
      quality_flags: [],
    });
    expect(candidates[1]).toMatchObject({
      fact_date: null,
      candidate_data: medication,
      ocr_confidence: null,
      llm_confidence: null,
      source_start_offset: 0,
    });
    expect(candidates[1].candidate_data).toMatchObject({ frequency: 'once daily', duration: '5 days' });
    expect(result).toMatchObject({ extractionMethod: 'mixed_pdf', pageCount: 2 });
  });

  it('uses a stable candidate key across retries so the database can ignore duplicates', async () => {
    const service = new ExtractionService();
    const first = makeSupabase();
    const second = makeSupabase();
    await service.processDocument('doc-1', 'user-1', 'path', 'application/pdf', first.client as never);
    await service.processDocument('doc-1', 'user-1', 'path', 'application/pdf', second.client as never);
    const firstRows = first.upsert.mock.calls[0][0] as Array<{ dedupe_key: string }>;
    const secondRows = second.upsert.mock.calls[0][0] as Array<{ dedupe_key: string }>;
    expect(firstRows.map((row) => row.dedupe_key)).toEqual(secondRows.map((row) => row.dedupe_key));
  });

  it('records a failed attempt without logging document/provider error text', async () => {
    vi.mocked(storageService.downloadMedicalDocument).mockRejectedValue(new Error('private document body or provider detail'));
    const db = makeSupabase();
    await expect(new ExtractionService().processDocument('doc-1', 'user-1', 'path', 'application/pdf', db.client as never)).rejects.toThrow();
    expect(db.runTable.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed', error_message: 'processing_failed' }));
    const { auditService } = await import('../../src/services/audit.service');
    expect(vi.mocked(auditService.logAction).mock.calls.at(-1)?.[0]).not.toHaveProperty('newValue');
  });

  it('keeps low-confidence OCR data pending and explicitly flags questionable values and dates', async () => {
    vi.mocked(pdfService.extractPages).mockResolvedValue({
      pages: [{ ...pages[1], text: 'Glucose 5..4 mmol/L', ocrConfidence: 42, qualityFlags: ['suspiciously_short_text'] }],
      text: '[Page 2]\nGlucose 5..4 mmol/L', pageCount: 1, extractionMethod: 'pdf_ocr', qualityFlags: ['suspiciously_short_text'],
    });
    vi.mocked(llmService.chat).mockResolvedValue({
      content: JSON.stringify({
        metadata: { document_type: 'lab', report_date: null, facility: null, patient_name: null },
        observations: [{ ...observation, value: '5..4', reference_range: '3..9-5.5', date: '2026-02-31', page_number: 2, source_text: 'Glucose 5..4 mmol/L' }],
        medications: [],
      }), uncertainty: false,
    });
    const db = makeSupabase();
    await new ExtractionService().processDocument('doc-1', 'user-1', 'path', 'application/pdf', db.client as never);
    const rows = db.upsert.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows[0]).toMatchObject({ verification_status: 'pending', fact_date: null, ocr_confidence: 42, llm_confidence: null });
    expect(rows[0].quality_flags).toEqual(expect.arrayContaining([
      'suspiciously_short_text',
      'invalid_or_ambiguous_date',
      'ambiguous_numeric_value',
      'ambiguous_reference_range',
    ]));
  });

  it('keeps table test/value/unit/range associations tied to each row excerpt', async () => {
    const scenario = medicalDocumentScenarios.table;
    const tablePages = [{
      pageNumber: 1,
      text: scenario.text,
      method: 'pdf_text' as const,
      ocrConfidence: null,
      blocks: [],
      qualityFlags: [],
    }];
    vi.mocked(pdfService.extractPages).mockResolvedValue({
      pages: tablePages,
      text: `[Page 1]\n${scenario.text}`,
      pageCount: 1,
      extractionMethod: 'pdf_text',
      qualityFlags: [],
    });
    const observations = scenario.expectedObservations.map((row, index) => ({
      ...row,
      flag: null,
      date: null,
      page_number: 1,
      source_text: scenario.text.split('\n')[index],
    }));
    vi.mocked(llmService.chat).mockResolvedValue({
      content: JSON.stringify({
        metadata: { document_type: 'lab', report_date: null, facility: null, patient_name: null },
        observations,
        medications: [],
      }), uncertainty: false,
    });
    const db = makeSupabase();
    await new ExtractionService().processDocument('doc-1', 'user-1', 'path', 'application/pdf', db.client as never);
    const rows = db.upsert.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows.map((row) => [row.display_name, row.fact_value, row.fact_unit, row.reference_range])).toEqual([
      ['Hemoglobin', '13.2', 'g/dL', '12-16'],
      ['WBC', '6.1', '10^9/L', '4-11'],
    ]);
    expect(rows.every((row) => row.source_start_offset !== null && row.source_text)).toBe(true);
  });
});
