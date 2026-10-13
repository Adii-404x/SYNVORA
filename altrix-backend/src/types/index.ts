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
      source_text: string;
    }>;
    medications: Array<{
      drug_name: string;
      strength: string | null;
      dosage_instructions: string | null;
      frequency: string | null;
      duration: string | null;
      date: string | null;
      source_text: string;
    }>;
  };
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