import { SupabaseClient } from '@supabase/supabase-js';
import { env } from '../../config/env';
import { MEDICAL_EXTRACTION_PROMPT } from '../../prompts/medical-extraction.prompt';
import { medicalExtractionSchema } from '../../schemas/extraction.schema';
import { ExtractionResult } from '../../types';
import { ApiError } from '../../utils/api-error';
import { auditService } from '../audit.service';
import { llmService } from '../llm/llm.service';
import { storageService } from '../../integrations/supabase/storage';
import { ocrService } from './ocr.service';
import { pdfService } from './pdf.service';

function toIsoDate(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value;
}

export class ExtractionService {
  async processDocument(
    documentId: string,
    userId: string,
    storagePath: string,
    mimeType: string,
    supabase: SupabaseClient,
  ): Promise<ExtractionResult> {
    try {
      await auditService.logAction({ userId, action: 'DOCUMENT_EXTRACTION_STARTED', entityType: 'health_document', entityId: documentId });

      const buffer = await storageService.downloadMedicalDocument(supabase, storagePath);
      let extractedText: string;
      let extractionMethod: 'pdf_text' | 'image_ocr';
      if (mimeType === 'application/pdf') {
        extractedText = await pdfService.extractText(buffer);
        extractionMethod = 'pdf_text';
      } else if (mimeType.startsWith('image/')) {
        extractedText = await ocrService.extractTextFromImage(buffer);
        extractionMethod = 'image_ocr';
      } else {
        throw new ApiError(400, 'Unsupported file type for extraction');
      }

      if (!extractedText.trim()) throw new ApiError(422, 'Document contains no extractable text');

      const llmResponse = await llmService.chat({
        systemPrompt: MEDICAL_EXTRACTION_PROMPT.system,
        prompt: `${MEDICAL_EXTRACTION_PROMPT.userPrefix}${extractedText}`,
        temperature: 0.1,
        responseFormat: 'json',
      });

      let output: unknown;
      try {
        output = JSON.parse(llmResponse.content);
      } catch {
        throw new ApiError(502, 'AI failed to produce valid structured medical data');
      }

      const parsed = medicalExtractionSchema.safeParse(output);
      if (!parsed.success) throw new ApiError(502, 'AI failed to produce valid structured medical data');

      await this.persistExtraction(supabase, userId, documentId, parsed.data, extractionMethod);
      return { text: extractedText, facts: parsed.data };
    } catch (error) {
      await auditService.logAction({
        userId,
        action: 'DOCUMENT_EXTRACTION_FAILED',
        entityType: 'health_document',
        entityId: documentId,
        newValue: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async persistExtraction(
    supabase: SupabaseClient,
    userId: string,
    documentId: string,
    data: ExtractionResult['facts'],
    extractionMethod: 'pdf_text' | 'image_ocr',
  ) {
    const { data: run, error: runError } = await supabase
      .from('extraction_runs')
      .insert({ document_id: documentId, model_used: env.OLLAMA_MODEL, status: 'completed', raw_response: data })
      .select('id')
      .single();

    if (runError || !run) throw new ApiError(500, 'Failed to save extraction results', true, runError);

    const candidates = [
      ...data.observations.map((observation) => ({
        user_id: userId,
        document_id: documentId,
        run_id: run.id,
        fact_type: 'observation',
        display_name: observation.test_name,
        fact_value: observation.value,
        fact_unit: observation.unit,
        reference_range: observation.reference_range,
        fact_date: toIsoDate(observation.date) ?? toIsoDate(data.metadata.report_date),
        page_number: observation.page_number ?? null,
        extraction_method: extractionMethod,
        source_text: observation.source_text,
        verification_status: 'pending',
      })),
      ...data.medications.map((medication) => ({
        user_id: userId,
        document_id: documentId,
        run_id: run.id,
        fact_type: 'medication',
        display_name: medication.drug_name,
        fact_value: medication.drug_name,
        fact_unit: medication.strength,
        reference_range: medication.dosage_instructions,
        fact_date: toIsoDate(medication.date) ?? toIsoDate(data.metadata.report_date),
        page_number: null,
        extraction_method: extractionMethod,
        source_text: medication.source_text,
        verification_status: 'pending',
      })),
    ];

    if (candidates.length === 0) return;
    const { error } = await supabase.from('extracted_facts').insert(candidates);
    if (error) throw new ApiError(500, 'Failed to save extracted candidate facts', true, error);
  }
}

export const extractionService = new ExtractionService();
