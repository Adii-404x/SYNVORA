export const medicalDocumentScenarios = {
  digitalPdf: {
    text: 'Complete blood count. Hemoglobin 13.2 g/dL. Collected 2026-04-01.',
    expectedMethod: 'pdf_text',
  },
  scannedPdf: {
    embeddedText: '',
    ocrText: 'Glucose 5.4 mmol/L',
    expectedMethod: 'pdf_ocr',
  },
  mixedPdf: {
    pages: [
      { text: 'Complete blood count report with digitally embedded text.', method: 'pdf_text' },
      { text: 'Glucose 5.4 mmol/L', method: 'pdf_ocr' },
    ],
    expectedMethod: 'mixed_pdf',
  },
  rotatedNoisyImage: {
    text: 'Blood pressure 120/80 mmHg',
    confidence: 48,
    qualityFlags: ['low_ocr_confidence'],
  },
  table: {
    text: 'Hemoglobin | 13.2 | g/dL | 12-16\nWBC | 6.1 | 10^9/L | 4-11',
    expectedObservations: [
      { test_name: 'Hemoglobin', value: '13.2', unit: 'g/dL', reference_range: '12-16' },
      { test_name: 'WBC', value: '6.1', unit: '10^9/L', reference_range: '4-11' },
    ],
  },
  ambiguousNumber: { value: '6..1', expectedFlag: 'ambiguous_numeric_value' },
  poorQualityScan: { text: 'Hb 1', confidence: 22, expectedFlags: ['suspiciously_short_text', 'low_ocr_confidence'] },
  malformedPdf: { bytes: Buffer.from('%PDF-not-a-valid-document') },
} as const;
