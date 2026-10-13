import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExtractionService } from '../../src/services/documents/extraction.service';
import { storageService } from '../../src/integrations/supabase/storage';
import { pdfService } from '../../src/services/documents/pdf.service';
import { llmService } from '../../src/services/llm/llm.service';

vi.mock('../../src/services/audit.service', () => ({ auditService: { logAction: vi.fn() } }));
vi.mock('../../src/integrations/supabase/storage', () => ({
  storageService: { downloadMedicalDocument: vi.fn() },
}));
vi.mock('../../src/services/documents/pdf.service', () => ({ pdfService: { extractText: vi.fn() } }));
vi.mock('../../src/services/documents/ocr.service', () => ({ ocrService: { extractTextFromImage: vi.fn() } }));
vi.mock('../../src/services/llm/llm.service', () => ({ llmService: { chat: vi.fn() } }));

describe('ExtractionService candidate persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists each complete typed payload and never substitutes the report date', async () => {
    const observation = {
      test_name: 'Glucose', value: '5.4', unit: 'mmol/L', reference_range: '3.9-5.5',
      flag: null, date: null, page_number: 2, source_text: 'Glucose 5.4 mmol/L',
    };
    const medication = {
      drug_name: 'Example medicine', strength: '10 mg', dosage_instructions: 'Take as printed',
      frequency: 'once daily', duration: '5 days', date: null, source_text: 'Example medicine 10 mg',
    };
    vi.mocked(storageService.downloadMedicalDocument).mockResolvedValue(Buffer.from('synthetic'));
    vi.mocked(pdfService.extractText).mockResolvedValue('[Page 1]\nSynthetic report');
    vi.mocked(llmService.chat).mockResolvedValue({
      content: JSON.stringify({
        metadata: { document_type: 'lab', report_date: '2026-02-01', facility: null, patient_name: null },
        observations: [observation],
        medications: [medication],
      }),
      uncertainty: false,
    });

    const runQuery: any = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'run-1' }, error: null }),
    };
    const candidateInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = {
      from: vi.fn((table: string) => table === 'extraction_runs' ? runQuery : { insert: candidateInsert }),
    };

    await new ExtractionService().processDocument('doc-1', 'user-1', 'path', 'application/pdf', supabase as never);

    const [candidates] = candidateInsert.mock.calls[0];
    expect(candidates[0]).toMatchObject({ fact_date: null, candidate_data: observation, verification_status: 'pending' });
    expect(candidates[1]).toMatchObject({
      fact_date: null,
      candidate_data: medication,
      verification_status: 'pending',
    });
    expect(candidates[1].candidate_data).toMatchObject({ frequency: 'once daily', duration: '5 days' });
  });
});
