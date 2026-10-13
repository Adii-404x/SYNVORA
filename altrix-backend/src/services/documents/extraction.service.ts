import { pdfService } from './pdf.service';
import { ocrService } from './ocr.service';
import { storageService } from '../../integrations/supabase/storage';
import { auditService } from '../audit.service';
import { llmService } from '../llm/llm.service';
import { MEDICAL_EXTRACTION_PROMPT } from '../../prompts/medical-extraction.prompt';
import { medicalExtractionSchema } from '../../schemas/extraction.schema';
import { ApiError } from '../../utils/api-error';
import { supabaseAdmin } from '../../integrations/supabase/client';
import { ExtractionResult } from '../../types';

export class ExtractionService {
  async processDocument(documentId: string, userId: string, storagePath: string, mimeType: string): Promise<ExtractionResult> {
    try {
      await auditService.logAction({
        userId,
        action: 'DOCUMENT_EXTRACTION_STARTED',
        entityType: 'health_document',
        entityId: documentId,
      });

      const buffer = await storageService.downloadMedicalDocument(storagePath);
      let extractedText = '';
      if (mimeType === 'application/pdf') {
        extractedText = await pdfService.extractText(buffer);
      } else if (mimeType.startsWith('image/')) {
        extractedText = await ocrService.extractTextFromImage(buffer);
      } else {
        throw new ApiError(400, 'Unsupported file type for extraction');
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new ApiError(422, 'Document contains no extractable text');
      }

      const llmResponse = await llmService.chat({
        systemPrompt: MEDICAL_EXTRACTION_PROMPT.system,
        prompt: `${MEDICAL_EXTRACTION_PROMPT.userPrefix}\n\n${extractedText}`,
        temperature: 0.1,
      });

      const parsed = medicalExtractionSchema.safeParse(JSON.parse(llmResponse.content));
      if (!parsed.success) {
        throw new ApiError(502, 'AI failed to produce valid structured medical data');
      }

      await this.persistExtraction(userId, documentId, parsed.data, llmResponse.content);

      return {
        text: extractedText,
        facts: parsed.data,
      };
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

  private async persistExtraction(userId: string, documentId: string, data: any, rawResponse: string) {
    const { data: run, error: runError } = await supabaseAdmin
      .from('extraction_runs')
      .insert({
        document_id: documentId,
        model_used: 'gemma2',
        status: 'completed',
        raw_response: JSON.parse(rawResponse),
      })
      .select()
      .single();

    if (runError) throw runError;

    if (data.observations && data.observations.length > 0) {
      const observations = data.observations.map((obs: any) => ({
        user_id: userId,
        document_id: documentId,
        run_id: run.id,
        fact_type: 'observation',
        fact_value: obs.value,
        fact_unit: obs.unit,
        reference_range: obs.reference_range,
        source_text: obs.source_text,
        verification_status: 'pending',
      }));
      
      const { error: obsError } = await supabaseAdmin.from('extracted_facts').insert(observations);
      if (obsError) throw obsError;
    }

    if (data.medications && data.medications.length > 0) {
      const medications = data.medications.map((med: any) => ({
        user_id: userId,
        document_id: documentId,
        run_id: run.id,
        fact_type: 'medication',
        fact_value: med.drug_name,
        fact_unit: med.strength,
        reference_range: med.dosage_instructions,
        source_text: med.source_text,
        verification_status: 'pending',
      }));

      const { error: medError } = await supabaseAdmin.from('extracted_facts').insert(medications);
      if (medError) throw medError;
    }
  }
}

export const extractionService = new ExtractionService();