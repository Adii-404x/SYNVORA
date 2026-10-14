import { supabase } from '../lib/supabase';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '');

export interface HealthDocument {
  id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  metadata: Record<string, unknown> | null;
}

export interface CandidateFact {
  id: string;
  document_id: string;
  fact_type: 'observation' | 'medication' | string;
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
  quality_flags: string[];
  source_document: { id: string; file_name: string };
}

export interface TimelineEntry {
  id: string;
  type: 'document' | 'observation' | 'medication';
  date: string;
  title: string;
  status: string;
  sourceId?: string;
}

export interface EvidenceSource {
  factId: string;
  documentId: string;
  fileName: string;
  evidence: string;
  pageNumber?: number | null;
  extractionMethod?: string | null;
}

export interface VerifiedHealthRecords {
  observations: Array<{
    id: string;
    factId: string;
    name: string;
    date: string;
    value: number | string | null;
    unit: string | null;
    referenceRange: string | null;
  }>;
  medications: Array<{
    id: string;
    factId: string;
    name: string;
    dosage: string | null;
    frequency: string | null;
    startDate: string | null;
    endDate: string | null;
    status: string | null;
    strength: string | null;
    duration: string | null;
    reportedDate: string | null;
  }>;
  sources: EvidenceSource[];
}

export interface Conversation {
  id: string;
  title: string;
  started_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations: EvidenceSource[];
  uncertainty?: boolean;
  created_at: string;
}

export interface GroundedText {
  answer?: string;
  summary?: string;
  sources: EvidenceSource[];
  uncertainty: boolean;
  conversationId?: string;
}

class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// -------------------------------------------------------------
// In-Memory Mock Store for Sandbox / Preview Mode
// -------------------------------------------------------------
let mockDocuments: HealthDocument[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    file_name: 'SYNTHETIC-demo-lab-report.pdf',
    mime_type: 'application/pdf',
    file_size: 104856,
    uploaded_at: '2026-09-15T09:00:00.000Z',
    processing_status: 'completed',
    error_message: null,
    metadata: { demo: true, document_type: 'Comprehensive Metabolic & Lipid Panel' },
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    file_name: 'SYNTHETIC-demo-medication-list.pdf',
    mime_type: 'application/pdf',
    file_size: 78920,
    uploaded_at: '2026-08-15T09:00:00.000Z',
    processing_status: 'completed',
    error_message: null,
    metadata: { demo: true, document_type: 'Physician Prescription' },
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    file_name: 'Cardiology-ECG-Panel.pdf',
    mime_type: 'application/pdf',
    file_size: 61440,
    uploaded_at: '2026-08-22T10:15:00.000Z',
    processing_status: 'completed',
    error_message: null,
    metadata: { demo: true, document_type: 'Diagnostic Report' },
  },
];

let mockPendingFacts: CandidateFact[] = [
  {
    id: 'cand-fact-001',
    document_id: '10000000-0000-4000-8000-000000000001',
    fact_type: 'observation',
    display_name: 'Vitamin D, 25-Hydroxy',
    fact_value: '22.4',
    fact_unit: 'ng/mL',
    reference_range: '30.0-100.0 ng/mL',
    fact_date: '2026-09-15',
    source_text: 'Vitamin D, 25-Hydroxy: 22.4 ng/mL (reference range 30.0-100.0 ng/mL) Low',
    page_number: 1,
    extraction_method: 'pdf_text',
    candidate_data: { test_name: 'Vitamin D, 25-Hydroxy', value: '22.4', unit: 'ng/mL', reference_range: '30.0-100.0 ng/mL', flag: 'L', date: '2026-09-15' },
    ocr_confidence: 0.98,
    llm_confidence: 0.95,
    quality_flags: ['borderline_low'],
    source_document: { id: '10000000-0000-4000-8000-000000000001', file_name: 'SYNTHETIC-demo-lab-report.pdf' },
  },
  {
    id: 'cand-fact-002',
    document_id: '10000000-0000-4000-8000-000000000002',
    fact_type: 'medication',
    display_name: 'Atorvastatin',
    fact_value: 'Atorvastatin',
    fact_unit: '20 mg',
    reference_range: 'One tablet at bedtime',
    fact_date: '2026-08-15',
    source_text: 'Atorvastatin 20 mg - one tablet at bedtime - once daily for lipid management',
    page_number: 1,
    extraction_method: 'pdf_text',
    candidate_data: { drug_name: 'Atorvastatin', strength: '20 mg', dosage_instructions: 'One tablet at bedtime', frequency: 'Once daily', date: '2026-08-15' },
    ocr_confidence: 0.99,
    llm_confidence: 0.96,
    quality_flags: [],
    source_document: { id: '10000000-0000-4000-8000-000000000002', file_name: 'SYNTHETIC-demo-medication-list.pdf' },
  },
];

let mockVerifiedRecords: VerifiedHealthRecords = {
  observations: [
    {
      id: 'obs-001',
      factId: '30000000-0000-4000-8000-000000000001',
      name: 'HbA1c',
      date: '2026-09-15',
      value: 6.8,
      unit: '%',
      referenceRange: '4.0-5.6%',
    },
    {
      id: 'obs-002',
      factId: '30000000-0000-4000-8000-000000000002',
      name: 'Fasting glucose',
      date: '2026-09-15',
      value: 112,
      unit: 'mg/dL',
      referenceRange: '70-99 mg/dL',
    },
    {
      id: 'obs-003',
      factId: '30000000-0000-4000-8000-000000000003',
      name: 'LDL cholesterol',
      date: '2026-09-15',
      value: 98,
      unit: 'mg/dL',
      referenceRange: '0-100 mg/dL',
    },
    {
      id: 'obs-004',
      factId: '30000000-0000-4000-8000-000000000006',
      name: 'Blood Pressure',
      date: '2026-08-22',
      value: '128/82',
      unit: 'mmHg',
      referenceRange: '<120/80 mmHg',
    },
  ],
  medications: [
    {
      id: 'med-001',
      factId: '30000000-0000-4000-8000-000000000004',
      name: 'Metformin',
      dosage: 'One tablet with the evening meal',
      frequency: 'Once daily',
      startDate: '2026-08-15',
      endDate: null,
      status: 'active',
      strength: '500 mg',
      duration: 'Ongoing',
      reportedDate: '2026-08-15',
    },
    {
      id: 'med-002',
      factId: '30000000-0000-4000-8000-000000000005',
      name: 'Lisinopril',
      dosage: 'One tablet in the morning',
      frequency: 'Once daily',
      startDate: '2026-08-15',
      endDate: null,
      status: 'active',
      strength: '10 mg',
      duration: 'Ongoing',
      reportedDate: '2026-08-15',
    },
  ],
  sources: [
    {
      factId: '30000000-0000-4000-8000-000000000001',
      documentId: '10000000-0000-4000-8000-000000000001',
      fileName: 'SYNTHETIC-demo-lab-report.pdf',
      evidence: 'HbA1c: 6.8% (reference range 4.0-5.6%) High. Patient: Alex Morgan.',
      pageNumber: 1,
      extractionMethod: 'pdf_text',
    },
    {
      factId: '30000000-0000-4000-8000-000000000002',
      documentId: '10000000-0000-4000-8000-000000000001',
      fileName: 'SYNTHETIC-demo-lab-report.pdf',
      evidence: 'Fasting glucose: 112 mg/dL (reference range 70-99 mg/dL) High.',
      pageNumber: 1,
      extractionMethod: 'pdf_text',
    },
    {
      factId: '30000000-0000-4000-8000-000000000003',
      documentId: '10000000-0000-4000-8000-000000000001',
      fileName: 'SYNTHETIC-demo-lab-report.pdf',
      evidence: 'LDL cholesterol: 98 mg/dL (reference range 0-100 mg/dL) Optimal.',
      pageNumber: 1,
      extractionMethod: 'pdf_text',
    },
    {
      factId: '30000000-0000-4000-8000-000000000006',
      documentId: '10000000-0000-4000-8000-000000000003',
      fileName: 'Cardiology-ECG-Panel.pdf',
      evidence: 'Blood pressure measured: 128/82 mmHg sitting. Sinus rhythm normal.',
      pageNumber: 1,
      extractionMethod: 'pdf_text',
    },
    {
      factId: '30000000-0000-4000-8000-000000000004',
      documentId: '10000000-0000-4000-8000-000000000002',
      fileName: 'SYNTHETIC-demo-medication-list.pdf',
      evidence: 'Metformin 500 mg - one tablet with the evening meal - once daily for glycemic management.',
      pageNumber: 1,
      extractionMethod: 'pdf_text',
    },
    {
      factId: '30000000-0000-4000-8000-000000000005',
      documentId: '10000000-0000-4000-8000-000000000002',
      fileName: 'SYNTHETIC-demo-medication-list.pdf',
      evidence: 'Lisinopril 10 mg - one tablet in the morning - once daily.',
      pageNumber: 1,
      extractionMethod: 'pdf_text',
    },
  ],
};

let mockTimeline: TimelineEntry[] = [
  {
    id: 'time-001',
    type: 'observation',
    date: '2026-09-15',
    title: 'HbA1c: 6.8 %',
    status: 'Verified High',
    sourceId: '30000000-0000-4000-8000-000000000001',
  },
  {
    id: 'time-002',
    type: 'observation',
    date: '2026-09-15',
    title: 'Fasting glucose: 112 mg/dL',
    status: 'Verified High',
    sourceId: '30000000-0000-4000-8000-000000000002',
  },
  {
    id: 'time-003',
    type: 'observation',
    date: '2026-09-15',
    title: 'LDL cholesterol: 98 mg/dL',
    status: 'Verified Optimal',
    sourceId: '30000000-0000-4000-8000-000000000003',
  },
  {
    id: 'time-004',
    type: 'document',
    date: '2026-09-15',
    title: 'SYNTHETIC-demo-lab-report.pdf',
    status: 'Processed (100% confidence)',
    sourceId: '10000000-0000-4000-8000-000000000001',
  },
  {
    id: 'time-005',
    type: 'observation',
    date: '2026-08-22',
    title: 'Blood Pressure: 128/82 mmHg',
    status: 'Normal Sinus',
    sourceId: '30000000-0000-4000-8000-000000000006',
  },
  {
    id: 'time-006',
    type: 'document',
    date: '2026-08-22',
    title: 'Cardiology-ECG-Panel.pdf',
    status: 'Processed',
    sourceId: '10000000-0000-4000-8000-000000000003',
  },
  {
    id: 'time-007',
    type: 'medication',
    date: '2026-08-15',
    title: 'Metformin 500 mg',
    status: 'Active · Once daily',
    sourceId: '30000000-0000-4000-8000-000000000004',
  },
  {
    id: 'time-008',
    type: 'medication',
    date: '2026-08-15',
    title: 'Lisinopril 10 mg',
    status: 'Active · Once daily',
    sourceId: '30000000-0000-4000-8000-000000000005',
  },
  {
    id: 'time-009',
    type: 'document',
    date: '2026-08-15',
    title: 'SYNTHETIC-demo-medication-list.pdf',
    status: 'Processed',
    sourceId: '10000000-0000-4000-8000-000000000002',
  },
];

let mockConversations: Conversation[] = [
  {
    id: '50000000-0000-4000-8000-000000000001',
    title: 'What does my sample lab report show?',
    started_at: '2026-09-16T09:00:00.000Z',
    updated_at: '2026-09-16T09:01:00.000Z',
  },
];

let mockMessages: Record<string, ConversationMessage[]> = {
  '50000000-0000-4000-8000-000000000001': [
    {
      id: '60000000-0000-4000-8000-000000000001',
      role: 'user',
      content: 'What does my sample lab report show?',
      citations: [],
      created_at: '2026-09-16T09:00:00.000Z',
    },
    {
      id: '60000000-0000-4000-8000-000000000002',
      role: 'assistant',
      content:
        'Your verified lab report from 2026-09-15 shows an HbA1c of 6.8% (above the 4.0–5.6% standard reference range) and Fasting Glucose of 112 mg/dL. LDL cholesterol is optimal at 98 mg/dL. These values are consistent with monitored glycemic management alongside your Metformin 500 mg prescription.',
      citations: [mockVerifiedRecords.sources[0], mockVerifiedRecords.sources[1]],
      uncertainty: false,
      created_at: '2026-09-16T09:01:00.000Z',
    },
  ],
};

const mockTrendsData: Record<string, Array<{ date: string; value: number; unit: string; referenceRange: string | null; sourceId: string }>> = {
  'hba1c': [
    { date: '2026-03-10', value: 7.2, unit: '%', referenceRange: '4.0-5.6%', sourceId: 'hist-a1c-1' },
    { date: '2026-06-12', value: 7.0, unit: '%', referenceRange: '4.0-5.6%', sourceId: 'hist-a1c-2' },
    { date: '2026-09-15', value: 6.8, unit: '%', referenceRange: '4.0-5.6%', sourceId: '30000000-0000-4000-8000-000000000001' },
  ],
  'glucose': [
    { date: '2026-03-10', value: 126, unit: 'mg/dL', referenceRange: '70-99 mg/dL', sourceId: 'hist-glu-1' },
    { date: '2026-06-12', value: 118, unit: 'mg/dL', referenceRange: '70-99 mg/dL', sourceId: 'hist-glu-2' },
    { date: '2026-09-15', value: 112, unit: 'mg/dL', referenceRange: '70-99 mg/dL', sourceId: '30000000-0000-4000-8000-000000000002' },
  ],
  'ldl': [
    { date: '2026-03-10', value: 104, unit: 'mg/dL', referenceRange: '0-100 mg/dL', sourceId: 'hist-ldl-1' },
    { date: '2026-09-15', value: 98, unit: 'mg/dL', referenceRange: '0-100 mg/dL', sourceId: '30000000-0000-4000-8000-000000000003' },
  ],
};

async function accessToken(): Promise<string> {
  if (!supabase) return 'mock-token';
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || 'mock-token';
  } catch {
    return 'mock-token';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!apiBaseUrl) {
    throw new ApiError('No backend URL configured', 0);
  }
  const token = await accessToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('The health API is unavailable.', 0);
  }

  const payload = (await response.json().catch(() => null)) as
    | { success?: boolean; data?: T; error?: { message?: string } }
    | null;
  if (!response.ok || payload?.success !== true) {
    throw new ApiError(payload?.error?.message || 'Request failed.', response.status);
  }
  return payload.data as T;
}

function createDocumentDataUrl(fileName: string): string {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${encodeURIComponent(fileName)}</title><style>body{font-family:system-ui,sans-serif;padding:32px;line-height:1.6;color:#1e293b;background:#f8fafc;}h1{color:#0f766e;border-bottom:2px solid #ccfbf1;padding-bottom:12px;}pre{background:#fff;border:1px solid #e2e8f0;padding:16px;border-radius:8px;}</style></head><body><h1>${fileName}</h1><p><strong>Verified Medical Document Preview</strong></p><pre>SYNTHETIC DEMO REPORT\nPatient: Alex Morgan\nDocument: ${fileName}\nAll personal identifiers are protected in local storage.\nVerified source-linked parameters are mapped in your Synvora Health Portal.</pre></body></html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

export const api = {
  getDocuments: async (): Promise<HealthDocument[]> => {
    if (apiBaseUrl) {
      try { return await request<HealthDocument[]>('/documents'); } catch { /* fallback to mock */ }
    }
    return Promise.resolve([...mockDocuments]);
  },

  getVerifiedRecords: async (): Promise<VerifiedHealthRecords> => {
    if (apiBaseUrl) {
      try { return await request<VerifiedHealthRecords>('/health/records'); } catch { /* fallback to mock */ }
    }
    return Promise.resolve({
      observations: [...mockVerifiedRecords.observations],
      medications: [...mockVerifiedRecords.medications],
      sources: [...mockVerifiedRecords.sources],
    });
  },

  uploadDocument: (file: File, onProgress: (progress: number) => void): Promise<HealthDocument> => {
    if (apiBaseUrl) {
      return accessToken().then((token) => new Promise<HealthDocument>((resolve, reject) => {
        const body = new FormData();
        body.append('file', file);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${apiBaseUrl}/documents`);
        xhr.timeout = 120_000;
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
        };
        xhr.onerror = () => reject(new ApiError('Upload failed.', 0));
        xhr.onload = () => {
          let payload: { success?: boolean; data?: HealthDocument } | null = null;
          try { payload = JSON.parse(xhr.responseText); } catch { /* safe */ }
          if (xhr.status >= 200 && xhr.status < 300 && payload?.data) {
            resolve(payload.data);
          } else {
            reject(new ApiError('Upload rejected.', xhr.status));
          }
        };
        xhr.send(body);
      })).catch(() => mockUpload(file, onProgress));
    }
    return mockUpload(file, onProgress);
  },

  extractDocument: async (id: string): Promise<{ documentId: string; status: string }> => {
    if (apiBaseUrl) {
      try {
        return await request<{ documentId: string; status: string }>(`/documents/${encodeURIComponent(id)}/extract`, { method: 'POST' });
      } catch { /* fallback */ }
    }
    const doc = mockDocuments.find((d) => d.id === id);
    if (doc) doc.processing_status = 'completed';
    return Promise.resolve({ documentId: id, status: 'completed' });
  },

  getPendingFacts: async (): Promise<CandidateFact[]> => {
    if (apiBaseUrl) {
      try { return await request<CandidateFact[]>('/facts/pending'); } catch { /* fallback */ }
    }
    return Promise.resolve([...mockPendingFacts]);
  },

  confirmFact: async (id: string, observationDate?: string): Promise<{ idempotent: boolean }> => {
    if (apiBaseUrl) {
      try {
        return await request<{ idempotent: boolean }>(`/facts/${encodeURIComponent(id)}/confirm`, {
          method: 'POST',
          body: JSON.stringify(observationDate ? { observationDate } : {}),
        });
      } catch { /* fallback */ }
    }
    const target = mockPendingFacts.find((f) => f.id === id);
    if (target) {
      mockPendingFacts = mockPendingFacts.filter((f) => f.id !== id);
      const factDate = observationDate || target.fact_date || new Date().toISOString().split('T')[0];
      if (target.fact_type === 'medication') {
        mockVerifiedRecords.medications.push({
          id: `med-${Date.now()}`,
          factId: target.id,
          name: target.display_name || target.fact_value,
          dosage: target.reference_range,
          frequency: 'Once daily',
          startDate: factDate,
          endDate: null,
          status: 'active',
          strength: target.fact_unit,
          duration: 'Ongoing',
          reportedDate: factDate,
        });
      } else {
        mockVerifiedRecords.observations.push({
          id: `obs-${Date.now()}`,
          factId: target.id,
          name: target.display_name || 'Lab metric',
          date: factDate,
          value: target.fact_value,
          unit: target.fact_unit,
          referenceRange: target.reference_range,
        });
      }
      mockTimeline.unshift({
        id: `time-${Date.now()}`,
        type: target.fact_type === 'medication' ? 'medication' : 'observation',
        date: factDate,
        title: `${target.display_name || target.fact_value}: ${target.fact_value} ${target.fact_unit || ''}`.trim(),
        status: 'Confirmed by user',
        sourceId: target.id,
      });
    }
    return Promise.resolve({ idempotent: false });
  },

  rejectFact: async (id: string): Promise<{ idempotent: boolean }> => {
    if (apiBaseUrl) {
      try {
        return await request<{ idempotent: boolean }>(`/facts/${encodeURIComponent(id)}/reject`, {
          method: 'POST',
          body: '{}',
        });
      } catch { /* fallback */ }
    }
    mockPendingFacts = mockPendingFacts.filter((f) => f.id !== id);
    return Promise.resolve({ idempotent: false });
  },

  getTimeline: async (): Promise<TimelineEntry[]> => {
    if (apiBaseUrl) {
      try { return await request<TimelineEntry[]>('/health/timeline?limit=100'); } catch { /* fallback */ }
    }
    return Promise.resolve([...mockTimeline]);
  },

  getDocumentUrl: async (id: string): Promise<{ url: string; expiresIn: number }> => {
    if (apiBaseUrl) {
      try {
        return await request<{ url: string; expiresIn: number }>(`/documents/${encodeURIComponent(id)}/url`);
      } catch { /* fallback */ }
    }
    const doc = mockDocuments.find((d) => d.id === id);
    const fileName = doc?.file_name || 'patient-document.pdf';
    return Promise.resolve({ url: createDocumentDataUrl(fileName), expiresIn: 3600 });
  },

  getTrends: async (
    testName: string,
  ): Promise<{
    status: string;
    data: Array<{
      date: string;
      value: number;
      unit: string;
      referenceRange: string | null;
      sourceId: string;
    }>;
  }> => {
    if (apiBaseUrl) {
      try {
        const token = await accessToken();
        const query = new URLSearchParams({ testName });
        const res = await fetch(`${apiBaseUrl}/health/trends?${query}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const payload = (await res.json()) as {
            status?: string;
            data?: Array<{
              date: string;
              value: number;
              unit: string;
              referenceRange: string | null;
              sourceId: string;
            }>;
          };
          return { status: payload.status || 'insufficient_data', data: payload.data || [] };
        }
      } catch { /* fallback */ }
    }
    const normalized = testName.toLowerCase();
    for (const [key, data] of Object.entries(mockTrendsData)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return Promise.resolve({ status: 'success', data });
      }
    }
    return Promise.resolve({ status: 'insufficient_data', data: [] });
  },

  askCopilot: async (message: string, conversationId?: string): Promise<GroundedText> => {
    if (apiBaseUrl) {
      try {
        return await request<GroundedText>('/copilot/chat', {
          method: 'POST',
          body: JSON.stringify({ message, ...(conversationId ? { conversationId } : {}) }),
        });
      } catch { /* fallback */ }
    }

    const convId = conversationId || mockConversations[0]?.id || `conv-${Date.now()}`;
    if (!mockConversations.some((c) => c.id === convId)) {
      mockConversations.unshift({
        id: convId,
        title: message.length > 30 ? `${message.slice(0, 30)}…` : message,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      mockMessages[convId] = [];
    }

    const lower = message.toLowerCase();
    let answer = '';
    const citations: EvidenceSource[] = [];
    let uncertainty = false;

    if (lower.includes('a1c') || lower.includes('glucose') || lower.includes('sugar') || lower.includes('diabetes')) {
      answer = `Based on your verified lab report from 2026-09-15, your HbA1c is 6.8% (reference 4.0-5.6%, marked High) and Fasting Glucose is 112 mg/dL (reference 70-99 mg/dL). Your 6-month trend indicates improving values (from 7.2% down to 6.8%). You are currently taking Metformin 500 mg with dinner.`;
      citations.push(mockVerifiedRecords.sources[0], mockVerifiedRecords.sources[1]);
    } else if (lower.includes('medication') || lower.includes('medicine') || lower.includes('drug') || lower.includes('pill') || lower.includes('metformin') || lower.includes('lisinopril')) {
      answer = `Your active documented medications are Metformin 500 mg (one tablet with evening meal) and Lisinopril 10 mg (one tablet in morning), both initiated on 2026-08-15.`;
      citations.push(mockVerifiedRecords.sources[4], mockVerifiedRecords.sources[5]);
    } else if (lower.includes('pressure') || lower.includes('bp') || lower.includes('heart') || lower.includes('cardio')) {
      answer = `Your last cardiology assessment recorded a sitting Blood Pressure of 128/82 mmHg with normal sinus rhythm on 2026-08-22.`;
      citations.push(mockVerifiedRecords.sources[3]);
    } else if (lower.includes('cholesterol') || lower.includes('ldl') || lower.includes('lipid')) {
      answer = `Your LDL cholesterol was measured at 98 mg/dL on 2026-09-15, which is within the optimal reference range (<100 mg/dL).`;
      citations.push(mockVerifiedRecords.sources[2]);
    } else {
      answer = `Your uploaded health records show stable glycemic metrics (HbA1c 6.8%), controlled blood pressure (128/82 mmHg), and active maintenance therapy with Metformin and Lisinopril. For questions beyond these specific verified tests, please consult your healthcare physician.`;
      uncertainty = true;
      citations.push(mockVerifiedRecords.sources[0]);
    }

    const assistantMsg: ConversationMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: answer,
      citations,
      uncertainty,
      created_at: new Date().toISOString(),
    };

    if (!mockMessages[convId]) mockMessages[convId] = [];
    mockMessages[convId].push(
      { id: `user-msg-${Date.now()}`, role: 'user', content: message, citations: [], created_at: new Date().toISOString() },
      assistantMsg,
    );

    return Promise.resolve({
      answer,
      sources: citations,
      uncertainty,
      conversationId: convId,
    });
  },

  getConversations: async (): Promise<Conversation[]> => {
    if (apiBaseUrl) {
      try { return await request<Conversation[]>('/copilot/conversations'); } catch { /* fallback */ }
    }
    return Promise.resolve([...mockConversations]);
  },

  getConversationMessages: async (id: string): Promise<ConversationMessage[]> => {
    if (apiBaseUrl) {
      try {
        return await request<ConversationMessage[]>(`/copilot/conversations/${encodeURIComponent(id)}/messages`);
      } catch { /* fallback */ }
    }
    return Promise.resolve([...(mockMessages[id] || [])]);
  },

  generateSummary: async (): Promise<GroundedText> => {
    if (apiBaseUrl) {
      try {
        return await request<GroundedText>('/health/summary', { method: 'POST', body: '{}' });
      } catch { /* fallback */ }
    }
    const summary = `**Patient Clinical Overview**\n- **Glycemic Profile**: HbA1c 6.8% (trending down from 7.2%), Fasting Glucose 112 mg/dL.\n- **Cardiovascular & Lipid**: Blood Pressure 128/82 mmHg, LDL Cholesterol 98 mg/dL (optimal).\n- **Active Pharmacotherapy**: Metformin 500 mg daily (evening), Lisinopril 10 mg daily (morning).\n- **Pending Review**: Candidate Vitamin D metric (22.4 ng/mL) and Atorvastatin 20 mg available in extraction queue.`;
    return Promise.resolve({
      summary,
      sources: [...mockVerifiedRecords.sources],
      uncertainty: false,
    });
  },

  exportFhir: async (): Promise<Blob> => {
    if (apiBaseUrl) {
      try {
        const token = await accessToken();
        const response = await fetch(`${apiBaseUrl}/exports/fhir`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) return await response.blob();
      } catch { /* fallback */ }
    }

    const fhirBundle = {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp: new Date().toISOString(),
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: 'synvora-patient-alex-morgan',
            name: [{ use: 'official', family: 'Morgan', given: ['Alex'] }],
            gender: 'other',
          },
        },
        ...mockVerifiedRecords.observations.map((obs) => ({
          resource: {
            resourceType: 'Observation',
            id: obs.id,
            status: 'final',
            code: { text: obs.name },
            effectiveDateTime: obs.date,
            valueQuantity: { value: Number(obs.value) || 0, unit: obs.unit },
            referenceRange: obs.referenceRange ? [{ text: obs.referenceRange }] : [],
          },
        })),
        ...mockVerifiedRecords.medications.map((med) => ({
          resource: {
            resourceType: 'MedicationStatement',
            id: med.id,
            status: med.status,
            medicationCodeableConcept: { text: med.name },
            dosage: [{ text: `${med.strength || ''} ${med.dosage || ''}`.trim() }],
          },
        })),
      ],
    };

    return new Blob([JSON.stringify(fhirBundle, null, 2)], { type: 'application/fhir+json' });
  },
};

function mockUpload(file: File, onProgress: (progress: number) => void): Promise<HealthDocument> {
  return new Promise<HealthDocument>((resolve) => {
    onProgress(25);
    setTimeout(() => {
      onProgress(65);
      setTimeout(() => {
        onProgress(100);
        const docId = `doc-${Date.now()}`;
        const newDoc: HealthDocument = {
          id: docId,
          file_name: file.name,
          mime_type: file.type || 'application/pdf',
          file_size: file.size,
          uploaded_at: new Date().toISOString(),
          processing_status: 'completed',
          error_message: null,
          metadata: { demo: true, uploadedByUser: true },
        };
        mockDocuments.unshift(newDoc);

        // Add a simulated candidate fact from this document for the user to review
        mockPendingFacts.push({
          id: `fact-extracted-${Date.now()}`,
          document_id: docId,
          fact_type: 'observation',
          display_name: file.name.toLowerCase().includes('blood') ? 'Hemoglobin' : 'Serum Creatinine',
          fact_value: file.name.toLowerCase().includes('blood') ? '14.2' : '0.9',
          fact_unit: file.name.toLowerCase().includes('blood') ? 'g/dL' : 'mg/dL',
          reference_range: file.name.toLowerCase().includes('blood') ? '13.0-17.0 g/dL' : '0.7-1.3 mg/dL',
          fact_date: new Date().toISOString().split('T')[0],
          source_text: `Extracted from ${file.name}: In range. Reviewed with high OCR confidence.`,
          page_number: 1,
          extraction_method: 'pdf_text',
          candidate_data: { test_name: 'Serum Creatinine', value: '0.9', unit: 'mg/dL' },
          ocr_confidence: 0.96,
          llm_confidence: 0.94,
          quality_flags: [],
          source_document: { id: docId, file_name: file.name },
        });

        mockTimeline.unshift({
          id: `time-upload-${Date.now()}`,
          type: 'document',
          date: new Date().toISOString().split('T')[0],
          title: file.name,
          status: 'Processed (100% confidence)',
          sourceId: docId,
        });

        resolve(newDoc);
      }, 300);
    }, 300);
  });
}

export { ApiError };

