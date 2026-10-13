import { z } from 'zod';

export const observationCandidateSchema = z.object({
  test_name: z.string(),
  value: z.string(),
  unit: z.string().nullable(),
  reference_range: z.string().nullable(),
  flag: z.string().nullable(),
  date: z.string().nullable(),
  page_number: z.number().int().positive().nullable().optional(),
  source_text: z.string(),
});

export const medicationCandidateSchema = z.object({
  drug_name: z.string(),
  strength: z.string().nullable(),
  dosage_instructions: z.string().nullable(),
  frequency: z.string().nullable(),
  duration: z.string().nullable(),
  date: z.string().nullable(),
  source_text: z.string(),
});

export const medicalExtractionSchema = z.object({
  metadata: z.object({
    document_type: z.string().nullable(),
    report_date: z.string().nullable(),
    facility: z.string().nullable(),
    patient_name: z.string().nullable(),
  }),
  observations: z.array(observationCandidateSchema),
  medications: z.array(medicationCandidateSchema),
});
