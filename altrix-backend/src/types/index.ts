export interface HealthDocument {
  id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  metadata: any;
}

export interface ExtractionResult {
  text: string;
  pages: ExtractedDocumentPage[];
  pageCount: number;
  extractionMethod: 'pdf_text' | 'pdf_ocr' | 'mixed_pdf' | 'image_ocr';
  qualityFlags: string[];
  facts: {
    metadata: {
      document_type: string | null;
      report_date: string | null;
      facility: string | null;
      patient_name: string | null;
    };
    observations: Array<{
      test_name: string;
      value: string;
      unit: string | null;
      reference_range: string | null;
      flag: string | null;
      date: string | null;
      page_number?: number | null;
      source_text: string;
      quality_flags?: string[];
    }>;
    medications: Array<{
      drug_name: string;
      strength: string | null;
      dosage_instructions: string | null;
      frequency: string | null;
      duration: string | null;
      date: string | null;
      source_text: string;
      page_number?: number | null;
      quality_flags?: string[];
    }>;
  };
}

export interface OcrBlock {
  text: string;
  confidence: number | null;
  bbox: { x0: number; y0: number; x1: number; y1: number } | null;
}

export interface ExtractedDocumentPage {
  pageNumber: number;
  text: string;
  embeddedText?: string | null;
  method: 'pdf_text' | 'pdf_ocr' | 'image_ocr';
  ocrConfidence: number | null;
  blocks: OcrBlock[];
  qualityFlags: string[];
}

export interface AuditLogEntry {
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}
