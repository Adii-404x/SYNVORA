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

async function accessToken() {
  if (!supabase || !apiBaseUrl) throw new ApiError('Frontend API or Supabase configuration is missing.', 0);
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new ApiError('Your session has expired. Sign in again.', 401);
  return data.session.access_token;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('The health API is unavailable. Check the connection and try again.', 0);
  }

  const payload = await response.json().catch(() => null) as
    | { success?: boolean; data?: T; error?: { message?: string } }
    | null;
  if (!response.ok || payload?.success !== true) {
    throw new ApiError(payload?.error?.message || 'The request could not be completed.', response.status);
  }
  return payload.data as T;
}

function uploadWithProgress(file: File, onProgress: (progress: number) => void) {
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
    xhr.onerror = () => reject(new ApiError('Upload failed. Check the connection and retry.', 0));
    xhr.ontimeout = () => reject(new ApiError('Upload timed out. Retry when the connection is stable.', 0));
    xhr.onload = () => {
      let payload: { success?: boolean; data?: HealthDocument; error?: { message?: string } } | null = null;
      try { payload = JSON.parse(xhr.responseText); } catch { /* handled as a safe API error */ }
      if (xhr.status < 200 || xhr.status >= 300 || payload?.success !== true || !payload.data) {
        reject(new ApiError(payload?.error?.message || 'The upload could not be saved.', xhr.status));
        return;
      }
      resolve(payload.data);
    };
    xhr.send(body);
  }));
}

export const api = {
  getDocuments: () => request<HealthDocument[]>('/documents'),
  getVerifiedRecords: () => request<VerifiedHealthRecords>('/health/records'),
  uploadDocument: uploadWithProgress,
  extractDocument: (id: string) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 330_000);
    return request<{ documentId: string; status: string }>(
      `/documents/${encodeURIComponent(id)}/extract`, { method: 'POST', signal: controller.signal },
    ).finally(() => window.clearTimeout(timeout));
  },
  getPendingFacts: () => request<CandidateFact[]>('/facts/pending'),
  confirmFact: (id: string, observationDate?: string) => request<{ idempotent: boolean }>(
    `/facts/${encodeURIComponent(id)}/confirm`, {
      method: 'POST',
      body: JSON.stringify(observationDate ? { observationDate } : {}),
    },
  ),
  rejectFact: (id: string) => request<{ idempotent: boolean }>(
    `/facts/${encodeURIComponent(id)}/reject`, { method: 'POST', body: '{}' },
  ),
  getTimeline: () => request<TimelineEntry[]>('/health/timeline?limit=100'),
  getDocumentUrl: (id: string) => request<{ url: string; expiresIn: number }>(
    `/documents/${encodeURIComponent(id)}/url`,
  ),
  getTrends: async (testName: string) => {
    const token = await accessToken();
    const query = new URLSearchParams({ testName });
    let response: Response;
    try {
      response = await fetch(`${apiBaseUrl}/health/trends?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      throw new ApiError('The health API is unavailable. Check the connection and try again.', 0);
    }
    const payload = await response.json().catch(() => null) as
      | { success?: boolean; status?: string; data?: Array<{ date: string; value: number; unit: string; referenceRange: string | null; sourceId: string }>; error?: { message?: string } }
      | null;
    if (!response.ok || payload?.success !== true) {
      throw new ApiError(payload?.error?.message || 'Trend data could not be loaded.', response.status);
    }
    return { status: payload.status || 'insufficient_data', data: payload.data || [] };
  },
  askCopilot: (message: string, conversationId?: string) => request<GroundedText>('/copilot/chat', {
    method: 'POST',
    body: JSON.stringify({ message, ...(conversationId ? { conversationId } : {}) }),
  }),
  getConversations: () => request<Conversation[]>('/copilot/conversations'),
  getConversationMessages: (id: string) => request<ConversationMessage[]>(
    `/copilot/conversations/${encodeURIComponent(id)}/messages`,
  ),
  generateSummary: () => request<GroundedText>('/health/summary', { method: 'POST', body: '{}' }),
  exportFhir: async () => {
    const token = await accessToken();
    const response = await fetch(`${apiBaseUrl}/exports/fhir`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new ApiError(payload?.error?.message || 'FHIR export could not be created.', response.status);
    }
    return response.blob();
  },
};

export { ApiError };
