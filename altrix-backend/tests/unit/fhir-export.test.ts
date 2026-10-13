import { describe, expect, it, vi } from 'vitest';
import { FhirExportService } from '../../src/services/fhir.service';
import { VerifiedRecords } from '../../src/services/verified-records.service';

const records: VerifiedRecords = {
  observations: [{
    id: 'observation-1', factId: 'fact-1', name: 'Original lab label', date: '2026-02-03',
    value: '5.40', unit: 'mmol/L', referenceRange: '4.0-6.0 mmol/L',
  }],
  medications: [
    {
      id: 'medication-1', factId: 'fact-2', name: 'Example medicine', dosage: 'one tablet',
      frequency: 'twice daily', startDate: '2026-02-03', endDate: null, status: 'active',
      strength: '10 mg', duration: 'five days', reportedDate: null,
    },
    {
      id: 'medication-2', factId: 'fact-3', name: 'Incomplete medicine', dosage: null,
      frequency: null, startDate: null, endDate: null, status: null,
      strength: null, duration: null, reportedDate: null,
    },
  ],
  sources: [
    { factId: 'fact-1', documentId: 'document-1', fileName: 'report.pdf', evidence: 'Original lab line', pageNumber: 1, extractionMethod: 'pdf_text' },
    { factId: 'fact-2', documentId: 'document-2', fileName: 'prescription.pdf', evidence: 'Medicine source line', pageNumber: 1, extractionMethod: 'ocr' },
  ],
};

describe('FhirExportService', () => {
  it('creates a source-linked collection bundle for only the requested user', async () => {
    const getForUser = vi.fn().mockResolvedValue(records);
    const service = new FhirExportService({ getForUser } as never);
    const bundle = await service.exportForUser('user-1', {} as never);
    const resources = bundle.entry.map(({ resource }) => resource);
    const observation = resources.find((resource) => resource.resourceType === 'Observation')!;
    const medication = resources.find((resource) => resource.resourceType === 'MedicationStatement')!;

    expect(getForUser).toHaveBeenCalledWith({}, 'user-1');
    expect(bundle).toMatchObject({ resourceType: 'Bundle', type: 'collection', total: resources.length });
    expect(observation).toMatchObject({
      code: { text: 'Original lab label' },
      valueQuantity: { value: 5.4, unit: 'mmol/L' },
      referenceRange: [{ text: '4.0-6.0 mmol/L' }],
      derivedFrom: [{ reference: 'DocumentReference/document-1' }],
      note: [{ text: 'Page 1: Original lab line' }],
    });
    expect(medication).toMatchObject({
      status: 'active', medicationCodeableConcept: { text: 'Example medicine 10 mg' },
      dosage: [{ text: 'one tablet', timing: { code: { text: 'twice daily' } } }],
      derivedFrom: [{ reference: 'DocumentReference/document-2' }],
      note: [{ text: 'Page 1: Medicine source line' }],
    });
    expect(resources.some((resource) => resource.id === 'medication-2')).toBe(false);
    expect(resources.some((resource) => resource.resourceType === 'DocumentReference' && resource.id === 'document-2')).toBe(true);
  });

  it('does not invent a clinical code or numeric value for unparseable reported text', async () => {
    const textValueRecords: VerifiedRecords = {
      ...records,
      observations: [{ ...records.observations[0], value: 'positive' }],
      medications: [],
    };
    const service = new FhirExportService({ getForUser: vi.fn().mockResolvedValue(textValueRecords) } as never);
    const bundle = await service.exportForUser('user-1', {} as never);
    const observation = bundle.entry.find(({ resource }) => resource.resourceType === 'Observation')!.resource;

    expect(observation.code).toEqual({ text: 'Original lab label' });
    expect(observation.valueString).toBe('positive');
    expect(observation.valueQuantity).toBeUndefined();
  });

  it('omits records whose provenance source is unavailable', async () => {
    const orphaned: VerifiedRecords = {
      ...records,
      sources: records.sources.filter((source) => source.factId !== 'fact-1'),
    };
    const service = new FhirExportService({ getForUser: vi.fn().mockResolvedValue(orphaned) } as never);

    const bundle = await service.exportForUser('user-1', {} as never);
    expect(bundle.entry.some(({ resource }) => resource.resourceType === 'Observation')).toBe(false);
    expect(bundle.entry.some(({ resource }) => resource.id === 'document-1')).toBe(false);
  });
});
