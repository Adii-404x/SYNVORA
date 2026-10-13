import { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { ApiError } from '../utils/api-error';

const reviewResultSchema = z.object({
  factId: z.string().uuid(),
  decision: z.enum(['confirm', 'reject']),
  factType: z.enum(['observation', 'medication']).nullable(),
  recordId: z.string().uuid().nullable(),
  idempotent: z.boolean(),
}).strict();

interface PendingFactRow {
  id: string;
  document_id: string;
  fact_type: string;
  display_name: string | null;
  fact_value: string;
  fact_unit: string | null;
  reference_range: string | null;
  fact_date: string | null;
  source_text: string;
  page_number: number | null;
  extraction_method: string | null;
  candidate_data: Record<string, unknown> | null;
  ocr_confidence: number | null;
  llm_confidence: number | null;
  source_start_offset: number | null;
  source_end_offset: number | null;
  source_boxes: unknown[];
  quality_flags: string[];
  created_at: string;
}

interface DocumentRow {
  id: string;
  file_name: string;
}

export class FactsService {
  async listPending(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from('extracted_facts')
      .select('id, document_id, fact_type, display_name, fact_value, fact_unit, reference_range, fact_date, source_text, page_number, extraction_method, candidate_data, ocr_confidence, llm_confidence, source_start_offset, source_end_offset, source_boxes, quality_flags, created_at')
      .eq('user_id', userId)
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw new ApiError(500, 'Failed to retrieve pending facts');

    const facts = (data ?? []) as PendingFactRow[];
    const documentIds = [...new Set(facts.map((fact) => fact.document_id))];
    if (documentIds.length === 0) return [];

    const { data: documentsData, error: documentsError } = await supabase
      .from('health_documents')
      .select('id, file_name')
      .eq('user_id', userId)
      .in('id', documentIds);

    if (documentsError) throw new ApiError(500, 'Failed to retrieve pending fact sources');

    const documents = new Map(((documentsData ?? []) as DocumentRow[]).map((document) => [document.id, document]));
    return facts.flatMap((fact) => {
      const document = documents.get(fact.document_id);
      if (!document) return [];
      return [{ ...fact, source_document: document }];
    });
  }

  async review(
    supabase: SupabaseClient,
    factId: string,
    decision: 'confirm' | 'reject',
    observationDate?: string,
  ) {
    const { data, error } = await supabase.rpc('review_extracted_fact', {
      p_fact_id: factId,
      p_decision: decision,
      p_observation_date: observationDate ?? null,
    });

    if (error) {
      if (error.code === 'P0002') throw new ApiError(404, 'Candidate fact not found');
      if (error.code === '22023') throw new ApiError(422, 'Candidate fact is incomplete and remains pending');
      if (error.code === '23514' || error.code === 'P0001') {
        throw new ApiError(409, 'Candidate fact cannot be reviewed in its current state');
      }
      throw new ApiError(500, 'Failed to review candidate fact');
    }

    const parsed = reviewResultSchema.safeParse(data);
    if (!parsed.success) throw new ApiError(500, 'Invalid candidate review response');
    return parsed.data;
  }
}

export const factsService = new FactsService();
