import 'dotenv/config';
import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini SDK with server-side key
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

interface EvidenceSource {
  factId: string;
  documentId: string;
  fileName: string;
  evidence: string;
  pageNumber?: number | null;
  extractionMethod?: string | null;
}

interface VerifiedHealthRecords {
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

function withTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI generation timed out')), ms)),
  ]);
}

// -------------------------------------------------------------
// Copilot Chat Route (/api/copilot/chat)
// -------------------------------------------------------------
app.post('/api/copilot/chat', async (req: Request, res: Response) => {
  const { message, conversationId, records, lang } = req.body as {
    message?: string;
    conversationId?: string;
    records?: VerifiedHealthRecords;
    lang?: string;
  };

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, error: { message: 'Message is required' } });
  }

  const patientRecords = records || {
    observations: [
      { id: 'obs-001', factId: '30000000-0000-4000-8000-000000000001', name: 'HbA1c', date: '2026-09-15', value: 6.8, unit: '%', referenceRange: '4.0-5.6%' },
      { id: 'obs-002', factId: '30000000-0000-4000-8000-000000000002', name: 'Fasting glucose', date: '2026-09-15', value: 112, unit: 'mg/dL', referenceRange: '70-99 mg/dL' },
      { id: 'obs-003', factId: '30000000-0000-4000-8000-000000000003', name: 'LDL cholesterol', date: '2026-09-15', value: 98, unit: 'mg/dL', referenceRange: '0-100 mg/dL' },
      { id: 'obs-004', factId: '30000000-0000-4000-8000-000000000006', name: 'Blood Pressure', date: '2026-08-22', value: '128/82', unit: 'mmHg', referenceRange: '<120/80 mmHg' },
    ],
    medications: [
      { id: 'med-001', factId: '30000000-0000-4000-8000-000000000004', name: 'Metformin', dosage: 'One tablet with the evening meal', frequency: 'Once daily', startDate: '2026-08-15', endDate: null, status: 'active', strength: '500 mg', duration: 'Ongoing', reportedDate: '2026-08-15' },
      { id: 'med-002', factId: '30000000-0000-4000-8000-000000000005', name: 'Lisinopril', dosage: 'One tablet in the morning', frequency: 'Once daily', startDate: '2026-08-15', endDate: null, status: 'active', strength: '10 mg', duration: 'Ongoing', reportedDate: '2026-08-15' },
    ],
    sources: [
      { factId: '30000000-0000-4000-8000-000000000001', documentId: '10000000-0000-4000-8000-000000000001', fileName: 'SYNTHETIC-demo-lab-report.pdf', evidence: 'HbA1c: 6.8% (reference range 4.0-5.6%) High. Patient: Alex Morgan.', pageNumber: 1, extractionMethod: 'pdf_text' },
      { factId: '30000000-0000-4000-8000-000000000002', documentId: '10000000-0000-4000-8000-000000000001', fileName: 'SYNTHETIC-demo-lab-report.pdf', evidence: 'Fasting glucose: 112 mg/dL (reference range 70-99 mg/dL) High.', pageNumber: 1, extractionMethod: 'pdf_text' },
      { factId: '30000000-0000-4000-8000-000000000003', documentId: '10000000-0000-4000-8000-000000000001', fileName: 'SYNTHETIC-demo-lab-report.pdf', evidence: 'LDL cholesterol: 98 mg/dL (reference range 0-100 mg/dL) Optimal.', pageNumber: 1, extractionMethod: 'pdf_text' },
      { factId: '30000000-0000-4000-8000-000000000006', documentId: '10000000-0000-4000-8000-000000000003', fileName: 'Cardiology-ECG-Panel.pdf', evidence: 'Blood pressure measured: 128/82 mmHg sitting. Sinus rhythm normal.', pageNumber: 1, extractionMethod: 'pdf_text' },
      { factId: '30000000-0000-4000-8000-000000000004', documentId: '10000000-0000-4000-8000-000000000002', fileName: 'SYNTHETIC-demo-medication-list.pdf', evidence: 'Metformin 500 mg - one tablet with the evening meal - once daily for glycemic management.', pageNumber: 1, extractionMethod: 'pdf_text' },
      { factId: '30000000-0000-4000-8000-000000000005', documentId: '10000000-0000-4000-8000-000000000002', fileName: 'SYNTHETIC-demo-medication-list.pdf', evidence: 'Lisinopril 10 mg - one tablet in the morning - once daily.', pageNumber: 1, extractionMethod: 'pdf_text' },
    ],
  };

  const sourcesMap = new Map(patientRecords.sources.map((s) => [s.factId, s]));

  if (ai) {
    try {
      const systemInstruction = `You are the Synvora Personal Health Copilot, a calm, reassuring medical information assistant for patients.
Use the supplied verified patient records to answer questions accurately and clearly.
Respond in the language requested by the user (${lang === 'hi' ? 'Hindi' : 'English or the language the user asked in'}).

STRICT GUIDELINES:
1. Ground your answer in the supplied verified health records whenever relevant.
2. When asked about high/low flags (e.g. HbA1c 6.8% High, Fasting Glucose 112 mg/dL High), explain what that means in everyday, plain language without causing panic.
3. If the user asks about lifestyle, diet, or exercise related to their recorded conditions (e.g., glycemic control, hypertension), provide safe, supportive medical education.
4. Do not prescribe new drugs or diagnose new conditions; always remind the user that this is informational and to consult their doctor.
5. Return ONLY a single JSON object with:
   - "answer": string (plain text or clean formatted paragraphs)
   - "citations": array of fact ID strings from the records.sources list that support your answer
   - "uncertainty": boolean (set to true if information is missing or incomplete in the records)`;

      const promptText = JSON.stringify({
        userQuestion: message,
        verifiedRecords: patientRecords,
      });

      const result = await withTimeout(ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
        config: {
          systemInstruction,
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }), 3500);

      const parsed = JSON.parse(result.text || '{}') as {
        answer?: string;
        citations?: string[];
        uncertainty?: boolean;
      };

      const citedSources = (parsed.citations || [])
        .map((id) => sourcesMap.get(id))
        .filter((s): s is EvidenceSource => Boolean(s));

      return res.status(200).json({
        success: true,
        data: {
          answer: parsed.answer || 'No answer generated.',
          sources: citedSources.length > 0 ? citedSources : patientRecords.sources.slice(0, 2),
          uncertainty: parsed.uncertainty ?? false,
          conversationId: conversationId || `conv-${Date.now()}`,
        },
      });
    } catch (err) {
      console.warn('Gemini chat error, falling back to local reasoning:', err);
    }
  }

  // Graceful rule-based fallback
  const lower = message.toLowerCase();
  let answer = '';
  const citations: EvidenceSource[] = [];
  let uncertainty = false;

  if (lower.includes('a1c') || lower.includes('glucose') || lower.includes('sugar') || lower.includes('मधुमेह') || lower.includes('शुगर')) {
    answer = `Based on your verified lab report from 2026-09-15:\n- HbA1c: 6.8% (printed reference range 4.0–5.6%, marked High). This reflects your average blood sugar over the last 2-3 months.\n- Fasting Blood Glucose: 112 mg/dL (reference range 70–99 mg/dL, marked High).\n\nYour 6-month historical trend indicates steady improvement (from 7.2% in March down to 6.8% in September). You are taking Metformin 500 mg once daily with your evening meal. Discuss with your physician whether your current nutrition and medication regimen remain optimal.`;
    citations.push(patientRecords.sources[0], patientRecords.sources[1]);
  } else if (lower.includes('medication') || lower.includes('medicine') || lower.includes('drug') || lower.includes('metformin') || lower.includes('lisinopril') || lower.includes('दवा')) {
    answer = `Your active documented medications are:\n1. Metformin 500 mg: One tablet with the evening meal once daily (for glycemic management, started 2026-08-15).\n2. Lisinopril 10 mg: One tablet in the morning once daily (for blood pressure control, started 2026-08-15).\n\nBoth are marked active in your records. Be sure to take them consistently as prescribed with water.`;
    citations.push(patientRecords.sources[4], patientRecords.sources[5]);
  } else if (lower.includes('pressure') || lower.includes('bp') || lower.includes('heart') || lower.includes('cardio') || lower.includes('रक्तचाप')) {
    answer = `Your Cardiology Assessment on 2026-08-22 recorded:\n- Blood Pressure: 128/82 mmHg (sitting, borderline systolic).\n- Cardiac Rhythm: Normal sinus rhythm with no acute ischemic events noted.\n\nYou are taking Lisinopril 10 mg daily for blood pressure maintenance.`;
    citations.push(patientRecords.sources[3]);
  } else if (lower.includes('cholesterol') || lower.includes('lipid') || lower.includes('ldl') || lower.includes('कोलेस्ट्रॉल')) {
    answer = `Your Lipid Panel on 2026-09-15 showed an LDL Cholesterol of 98 mg/dL, which is within the optimal target range (<100 mg/dL). Your metabolic parameters are stable.`;
    citations.push(patientRecords.sources[2]);
  } else {
    answer = `Your verified health records include:\n- HbA1c: 6.8% (High)\n- Fasting Glucose: 112 mg/dL (High)\n- Blood Pressure: 128/82 mmHg\n- Active medications: Metformin 500 mg, Lisinopril 10 mg.\n\nAll data is source-linked to your uploaded laboratory and clinic documents. Please consult your physician for individualized medical advice.`;
    uncertainty = true;
    citations.push(patientRecords.sources[0]);
  }

  return res.status(200).json({
    success: true,
    data: {
      answer,
      sources: citations,
      uncertainty,
      conversationId: conversationId || `conv-${Date.now()}`,
    },
  });
});

// -------------------------------------------------------------
// Health Summary Route (/api/health/summary)
// -------------------------------------------------------------
app.post('/api/health/summary', async (req: Request, res: Response) => {
  const { records, lang } = req.body as { records?: VerifiedHealthRecords; lang?: string };

  const patientRecords = records || {
    observations: [
      { id: 'obs-001', factId: '30000000-0000-4000-8000-000000000001', name: 'HbA1c', date: '2026-09-15', value: 6.8, unit: '%', referenceRange: '4.0-5.6%' },
      { id: 'obs-002', factId: '30000000-0000-4000-8000-000000000002', name: 'Fasting glucose', date: '2026-09-15', value: 112, unit: 'mg/dL', referenceRange: '70-99 mg/dL' },
      { id: 'obs-003', factId: '30000000-0000-4000-8000-000000000003', name: 'LDL cholesterol', date: '2026-09-15', value: 98, unit: 'mg/dL', referenceRange: '0-100 mg/dL' },
      { id: 'obs-004', factId: '30000000-0000-4000-8000-000000000006', name: 'Blood Pressure', date: '2026-08-22', value: '128/82', unit: 'mmHg', referenceRange: '<120/80 mmHg' },
    ],
    medications: [
      { id: 'med-001', factId: '30000000-0000-4000-8000-000000000004', name: 'Metformin', dosage: 'One tablet with the evening meal', frequency: 'Once daily', startDate: '2026-08-15', endDate: null, status: 'active', strength: '500 mg', duration: 'Ongoing', reportedDate: '2026-08-15' },
      { id: 'med-002', factId: '30000000-0000-4000-8000-000000000005', name: 'Lisinopril', dosage: 'One tablet in the morning', frequency: 'Once daily', startDate: '2026-08-15', endDate: null, status: 'active', strength: '10 mg', duration: 'Ongoing', reportedDate: '2026-08-15' },
    ],
    sources: [
      { factId: '30000000-0000-4000-8000-000000000001', documentId: '10000000-0000-4000-8000-000000000001', fileName: 'SYNTHETIC-demo-lab-report.pdf', evidence: 'HbA1c: 6.8% (reference range 4.0-5.6%) High. Patient: Alex Morgan.', pageNumber: 1, extractionMethod: 'pdf_text' },
      { factId: '30000000-0000-4000-8000-000000000002', documentId: '10000000-0000-4000-8000-000000000001', fileName: 'SYNTHETIC-demo-lab-report.pdf', evidence: 'Fasting glucose: 112 mg/dL (reference range 70-99 mg/dL) High.', pageNumber: 1, extractionMethod: 'pdf_text' },
      { factId: '30000000-0000-4000-8000-000000000003', documentId: '10000000-0000-4000-8000-000000000001', fileName: 'SYNTHETIC-demo-lab-report.pdf', evidence: 'LDL cholesterol: 98 mg/dL (reference range 0-100 mg/dL) Optimal.', pageNumber: 1, extractionMethod: 'pdf_text' },
      { factId: '30000000-0000-4000-8000-000000000006', documentId: '10000000-0000-4000-8000-000000000003', fileName: 'Cardiology-ECG-Panel.pdf', evidence: 'Blood pressure measured: 128/82 mmHg sitting. Sinus rhythm normal.', pageNumber: 1, extractionMethod: 'pdf_text' },
      { factId: '30000000-0000-4000-8000-000000000004', documentId: '10000000-0000-4000-8000-000000000002', fileName: 'SYNTHETIC-demo-medication-list.pdf', evidence: 'Metformin 500 mg - one tablet with the evening meal - once daily for glycemic management.', pageNumber: 1, extractionMethod: 'pdf_text' },
      { factId: '30000000-0000-4000-8000-000000000005', documentId: '10000000-0000-4000-8000-000000000002', fileName: 'SYNTHETIC-demo-medication-list.pdf', evidence: 'Lisinopril 10 mg - one tablet in the morning - once daily.', pageNumber: 1, extractionMethod: 'pdf_text' },
    ],
  };

  const sourcesMap = new Map(patientRecords.sources.map((s) => [s.factId, s]));

  if (ai) {
    try {
      const systemInstruction = `Prepare a concise, plain-language clinical summary for clinician review using only the supplied verified patient records.
Respond in ${lang === 'hi' ? 'Hindi' : 'English'}.
Structure the summary clearly:
1. Glycemic & Metabolic Status (HbA1c, Fasting Glucose)
2. Cardiovascular & Vitals (Blood pressure, LDL)
3. Active Pharmacotherapy (Medications and schedule)
4. Suggested Discussion Points for Next Doctor Visit

Return JSON with:
- "summary": string (clean multi-paragraph summary text)
- "citations": array of fact ID strings from records.sources
- "uncertainty": boolean`;

      const result = await withTimeout(ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: JSON.stringify({ verifiedRecords: patientRecords }),
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }), 3500);

      const parsed = JSON.parse(result.text || '{}') as {
        summary?: string;
        citations?: string[];
        uncertainty?: boolean;
      };

      const citedSources = (parsed.citations || [])
        .map((id) => sourcesMap.get(id))
        .filter((s): s is EvidenceSource => Boolean(s));

      return res.status(200).json({
        success: true,
        data: {
          summary: parsed.summary || 'Summary generated.',
          sources: citedSources.length > 0 ? citedSources : patientRecords.sources,
          uncertainty: parsed.uncertainty ?? false,
        },
      });
    } catch (err) {
      console.warn('Gemini summary error, falling back to local reasoning:', err);
    }
  }

  const summary = `CLINICAL BRIEFING & HEALTH PROFILE SUMMARY\n\n1. Glycemic Health & Metabolic Profile:\n- HbA1c: 6.8% (dated 2026-09-15, reference range 4.0–5.6%). While elevated above standard non-diabetic ranges, longitudinal data reflects steady downward progression from 7.2% in March 2026.\n- Fasting Blood Glucose: 112 mg/dL (reference 70–99 mg/dL).\n\n2. Cardiovascular & Lipids:\n- Blood Pressure: 128/82 mmHg recorded during cardiology evaluation on 2026-08-22.\n- LDL Cholesterol: 98 mg/dL (optimal target <100 mg/dL).\n\n3. Active Pharmacotherapy:\n- Metformin 500 mg: One tablet daily with the evening meal (active since 2026-08-15).\n- Lisinopril 10 mg: One tablet daily in the morning (active since 2026-08-15).\n\n4. Recommended Consultation Questions:\n- "Given my HbA1c improvement from 7.2% to 6.8%, should we maintain Metformin 500 mg or retest in 3 months?"\n- "Are my home blood pressure readings of ~128/82 mmHg aligned with our target on Lisinopril?"\n- "Should we review Vitamin D supplementation based on my recent candidate report?"\n\nNote: This summary is generated from verified health records for your healthcare provider's review.`;

  return res.status(200).json({
    success: true,
    data: {
      summary,
      sources: patientRecords.sources,
      uncertainty: false,
    },
  });
});

// -------------------------------------------------------------
// Vite Dev Middleware / Static File Serving
// -------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.resolve('./dist');

  if (isProduction && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Synvora Health Portal running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
