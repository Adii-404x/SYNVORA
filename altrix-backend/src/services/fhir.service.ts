import { SupabaseClient } from '@supabase/supabase-js';
import { verifiedRecordsService, VerifiedRecords } from './verified-records.service';
import { ApiError } from '../utils/api-error';

type FhirResource = Record<string, unknown> & {
  resourceType: string;
  id: string;
};

interface FhirBundle {
  resourceType: 'Bundle';
  type: 'collection';
  timestamp: string;
  total: number;
  entry: Array<{ fullUrl: string; resource: FhirResource }>;
}

const urn = (resourceType: string, id: string) => `urn:uuid:${id}`;

const asFiniteNumber = (value: number | string | null) => {
  if (value === null || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

export class FhirExportService {
  constructor(private readonly records = verifiedRecordsService) {}

  async exportForUser(userId: string, supabase: SupabaseClient): Promise<FhirBundle> {
    try {
      const records = await this.records.getForUser(supabase, userId);
      return this.buildBundle(userId, records);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to export health records', true, error);
    }
  }

  private buildBundle(userId: string, records: VerifiedRecords): FhirBundle {
    const entries: FhirBundle['entry'] = [];
    const patientId = userId;
    const add = (resource: FhirResource) => {
      entries.push({ fullUrl: urn(resource.resourceType, resource.id), resource });
    };

    add({ resourceType: 'Patient', id: patientId });

    const sourceByFactId = new Map(records.sources.map((source) => [source.factId, source]));
    const documentSources = new Map<string, (typeof records.sources)[number]>();
    const observations = records.observations.filter((item) => {
      const source = sourceByFactId.get(item.factId);
      if (!source || !item.name.trim() || !item.date) return false;
      documentSources.set(source.documentId, source);
      return true;
    });
    const medications = records.medications.filter((item) => {
      const source = sourceByFactId.get(item.factId);
      if (!source || !item.name.trim() || !this.toMedicationStatus(item.status) || !item.startDate) return false;
      documentSources.set(source.documentId, source);
      return true;
    });

    for (const source of documentSources.values()) {
      add({
        resourceType: 'DocumentReference',
        id: source.documentId,
        status: 'current',
        subject: { reference: `Patient/${patientId}` },
        description: source.evidence,
        content: [{ attachment: { title: source.fileName } }],
      });
    }

    for (const item of observations) {
      const source = sourceByFactId.get(item.factId)!;
      const value = asFiniteNumber(item.value);
      add({
        resourceType: 'Observation',
        id: item.id,
        status: 'final',
        code: { text: item.name },
        subject: { reference: `Patient/${patientId}` },
        effectiveDateTime: item.date,
        ...(value === undefined
          ? { valueString: String(item.value ?? '') }
          : { valueQuantity: { value, ...(item.unit ? { unit: item.unit } : {}) } }),
        ...(item.referenceRange ? { referenceRange: [{ text: item.referenceRange }] } : {}),
        derivedFrom: [{ reference: `DocumentReference/${source.documentId}` }],
        note: [{ text: source.pageNumber ? `Page ${source.pageNumber}: ${source.evidence}` : source.evidence }],
      });
    }

    for (const item of medications) {
      const source = sourceByFactId.get(item.factId)!;
      add({
        resourceType: 'MedicationStatement',
        id: item.id,
        status: this.toMedicationStatus(item.status)!,
        medicationCodeableConcept: { text: item.strength ? `${item.name} ${item.strength}` : item.name },
        subject: { reference: `Patient/${patientId}` },
        effectivePeriod: { start: item.startDate!, ...(item.endDate ? { end: item.endDate } : {}) },
        ...(item.dosage || item.frequency
          ? { dosage: [{
            ...(item.dosage ? { text: item.dosage } : {}),
            ...(item.frequency ? { timing: { code: { text: item.frequency } } } : {}),
          }] }
          : {}),
        derivedFrom: [{ reference: `DocumentReference/${source.documentId}` }],
        note: [{ text: source.pageNumber ? `Page ${source.pageNumber}: ${source.evidence}` : source.evidence }],
      });
    }

    const bundle: FhirBundle = {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp: new Date().toISOString(),
      total: entries.length,
      entry: entries,
    };
    this.validateBundle(bundle);
    return bundle;
  }

  private toMedicationStatus(status: string | null) {
    if (status === 'active' || status === 'completed') return status;
    if (status === 'discontinued') return 'stopped';
    return undefined;
  }

  private validateBundle(bundle: FhirBundle) {
    const resourceKeys = new Set(bundle.entry.map(({ resource }) => `${resource.resourceType}/${resource.id}`));
    if (bundle.total !== bundle.entry.length || !bundle.entry.some(({ resource }) => resource.resourceType === 'Patient')) {
      throw new ApiError(500, 'FHIR export validation failed');
    }

    for (const { fullUrl, resource } of bundle.entry) {
      if (fullUrl !== urn(resource.resourceType, resource.id)) {
        throw new ApiError(500, 'FHIR export validation failed');
      }
      const derivedFrom = (resource.derivedFrom as Array<{ reference: string }> | undefined) ?? [];
      const subject = resource.subject as { reference?: string } | undefined;
      const references = [...derivedFrom.map((item) => item.reference), ...(subject?.reference ? [subject.reference] : [])];
      if (references.some((reference) => !resourceKeys.has(reference))) {
        throw new ApiError(500, 'FHIR export contains an unresolved reference');
      }
    }
  }
}

export const fhirExportService = new FhirExportService();
