import { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../utils/api-error';

interface ObservationRow {
  id: string;
  fact_id: string | null;
  observation_date: string;
  display_name: string;
  value: number | string | null;
  unit: string | null;
  interpretation: string | null;
}

interface MedicationRow {
  id: string;
  fact_id: string | null;
  drug_name: string;
  dosage: string | null;
  frequency: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
}

interface FactRow {
  id: string;
  document_id: string;
  source_text: string;
  reference_range: string | null;
  fact_date: string | null;
}

interface DocumentRow {
  id: string;
  file_name: string;
}

export interface VerifiedSource {
  factId: string;
  documentId: string;
  fileName: string;
  evidence: string;
}

export interface VerifiedObservation {
  id: string;
  factId: string;
  name: string;
  date: string;
  value: number | string | null;
  unit: string | null;
  referenceRange: string | null;
}

export interface VerifiedMedication {
  id: string;
  factId: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
}

export interface VerifiedRecords {
  observations: VerifiedObservation[];
  medications: VerifiedMedication[];
  sources: VerifiedSource[];
}

export class VerifiedRecordsService {
  async getForUser(supabase: SupabaseClient, userId: string): Promise<VerifiedRecords> {
    const [observationResult, medicationResult] = await Promise.all([
      supabase
        .from('observations')
        .select('id, fact_id, observation_date, display_name, value, unit, interpretation')
        .eq('user_id', userId)
        .eq('verified_by', userId),
      supabase
        .from('medications')
        .select('id, fact_id, drug_name, dosage, frequency, start_date, end_date, status')
        .eq('user_id', userId)
        .eq('verified_by', userId),
    ]);

    if (observationResult.error || medicationResult.error) {
      throw new ApiError(500, 'Failed to retrieve verified health records');
    }

    const observationRows = (observationResult.data ?? []) as ObservationRow[];
    const medicationRows = (medicationResult.data ?? []) as MedicationRow[];
    const factIds = [...new Set([
      ...observationRows.map((row) => row.fact_id),
      ...medicationRows.map((row) => row.fact_id),
    ].filter((id): id is string => Boolean(id)))];

    if (factIds.length === 0) {
      return { observations: [], medications: [], sources: [] };
    }

    const { data: factData, error: factError } = await supabase
      .from('extracted_facts')
      .select('id, document_id, source_text, reference_range, fact_date')
      .eq('user_id', userId)
      .eq('verification_status', 'confirmed')
      .in('id', factIds);

    if (factError) throw new ApiError(500, 'Failed to retrieve verified health evidence');

    const facts = (factData ?? []) as FactRow[];
    const documentIds = [...new Set(facts.map((fact) => fact.document_id))];
    if (documentIds.length === 0) {
      return { observations: [], medications: [], sources: [] };
    }

    const { data: documentData, error: documentError } = await supabase
      .from('health_documents')
      .select('id, file_name')
      .eq('user_id', userId)
      .in('id', documentIds);

    if (documentError) throw new ApiError(500, 'Failed to retrieve health record sources');

    const documents = new Map(((documentData ?? []) as DocumentRow[]).map((document) => [document.id, document]));
    const factSources = new Map<string, VerifiedSource>();
    for (const fact of facts) {
      const document = documents.get(fact.document_id);
      if (!document || !fact.source_text.trim()) continue;
      factSources.set(fact.id, {
        factId: fact.id,
        documentId: fact.document_id,
        fileName: document.file_name,
        evidence: fact.source_text,
      });
    }

    const observations = observationRows.flatMap((row) => {
      const source = row.fact_id ? factSources.get(row.fact_id) : undefined;
      return source ? [{
        id: row.id,
        factId: source.factId,
        name: row.display_name,
        date: row.observation_date,
        value: row.value,
        unit: row.unit,
        referenceRange: facts.find((fact) => fact.id === source.factId)?.reference_range ?? row.interpretation,
      }] : [];
    });

    const medications = medicationRows.flatMap((row) => {
      const source = row.fact_id ? factSources.get(row.fact_id) : undefined;
      return source ? [{
        id: row.id,
        factId: source.factId,
        name: row.drug_name,
        dosage: row.dosage,
        frequency: row.frequency,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
      }] : [];
    });

    const referencedFactIds = new Set([
      ...observations.map((record) => record.factId),
      ...medications.map((record) => record.factId),
    ]);

    return {
      observations,
      medications,
      sources: [...factSources.values()].filter((source) => referencedFactIds.has(source.factId)),
    };
  }
}

export const verifiedRecordsService = new VerifiedRecordsService();
