import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const bucketName = 'medical-documents';
const labDocumentId = '10000000-0000-4000-8000-000000000001';
const medicationDocumentId = '10000000-0000-4000-8000-000000000002';
const labRunId = '20000000-0000-4000-8000-000000000001';
const medicationRunId = '20000000-0000-4000-8000-000000000002';
const conversationId = '50000000-0000-4000-8000-000000000001';

const observations = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    name: 'HbA1c',
    value: '6.8',
    unit: '%',
    referenceRange: '4.0-5.6%',
    flag: 'H',
    date: '2026-09-15',
    evidence: 'HbA1c: 6.8% (reference range 4.0-5.6%) H',
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    name: 'Fasting glucose',
    value: '112',
    unit: 'mg/dL',
    referenceRange: '70-99 mg/dL',
    flag: 'H',
    date: '2026-09-15',
    evidence: 'Fasting glucose: 112 mg/dL (reference range 70-99 mg/dL) H',
  },
  {
    id: '30000000-0000-4000-8000-000000000003',
    name: 'LDL cholesterol',
    value: '98',
    unit: 'mg/dL',
    referenceRange: '0-100 mg/dL',
    flag: null,
    date: '2026-09-15',
    evidence: 'LDL cholesterol: 98 mg/dL (reference range 0-100 mg/dL)',
  },
];

const medications = [
  {
    id: '30000000-0000-4000-8000-000000000004',
    name: 'Metformin',
    strength: '500 mg',
    dosage: 'One tablet with the evening meal',
    frequency: 'Once daily',
    date: '2026-08-15',
    evidence: 'Metformin 500 mg - one tablet with the evening meal - once daily',
  },
  {
    id: '30000000-0000-4000-8000-000000000005',
    name: 'Lisinopril',
    strength: '10 mg',
    dosage: 'One tablet in the morning',
    frequency: 'Once daily',
    date: '2026-08-15',
    evidence: 'Lisinopril 10 mg - one tablet in the morning - once daily',
  },
];

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value || value.startsWith('your_') || value.startsWith('replace-')) {
    throw new Error(`Set ${name} in altrix-backend/.env before seeding demo data.`);
  }
  return value;
}

function buildDemoPdf(lines: string[]): Buffer {
  const escapePdfText = (value: string) => value
    .replace(/[^\x20-\x7e]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
  const text = [
    'BT',
    '/F1 18 Tf',
    '54 750 Td',
    `(${escapePdfText(lines[0])}) Tj`,
    '/F1 11 Tf',
    ...lines.slice(1).map((line) => `0 -28 Td (${escapePdfText(line)}) Tj`),
    'ET',
  ].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(text, 'ascii')} >>\nstream\n${text}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf, 'ascii'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'ascii');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'ascii');
}

function failIfError(error: { message: string } | null, action: string) {
  if (error) throw new Error(`${action}: ${error.message}`);
}

async function getOrCreateDemoUser(
  admin: ReturnType<typeof createClient>,
  email: string,
  password: string,
) {
  const { data: usersPage, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  failIfError(listError, 'Could not look up the demo account');
  const existing = usersPage.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (!existing) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { altrix_demo: true },
      user_metadata: { full_name: 'Alex Morgan' },
    });
    failIfError(error, 'Could not create the demo account');
    if (!data.user) throw new Error('Supabase did not return the created demo account.');
    return data.user.id;
  }

  const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    app_metadata: { ...existing.app_metadata, altrix_demo: true },
    user_metadata: { ...existing.user_metadata, full_name: 'Alex Morgan' },
  });
  failIfError(error, 'Could not update the demo account');
  if (!data.user) throw new Error('Supabase did not return the updated demo account.');
  return data.user.id;
}

async function ensurePrivateBucket(admin: ReturnType<typeof createClient>) {
  const { data: buckets, error } = await admin.storage.listBuckets();
  failIfError(error, 'Could not list Storage buckets');
  const bucket = buckets.find((item) => item.name === bucketName);
  if (bucket?.public) {
    throw new Error(`The ${bucketName} bucket is public. Make it private before using the demo.`);
  }
  if (!bucket) {
    const { error: createError } = await admin.storage.createBucket(bucketName, {
      public: false,
      fileSizeLimit: '10MB',
      allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    });
    failIfError(createError, `Could not create the private ${bucketName} bucket`);
  }
}

async function seedDemo() {
  const supabaseUrl = required('SUPABASE_URL');
  const secretKey = required('SUPABASE_SECRET_KEY');
  const email = required('DEMO_EMAIL');
  const password = required('DEMO_PASSWORD');
  const confirmedProjectRef = required('DEMO_PROJECT_REF_CONFIRM');
  const projectUrl = new URL(supabaseUrl);
  const projectRef = projectUrl.hostname.split('.')[0];

  if (projectUrl.protocol !== 'https:' || !projectUrl.hostname.endsWith('.supabase.co')) {
    throw new Error('Demo seeding requires a Supabase HTTPS project URL.');
  }
  if (projectRef !== confirmedProjectRef) {
    throw new Error('DEMO_PROJECT_REF_CONFIRM must exactly match the Supabase project ref in SUPABASE_URL.');
  }
  if (password.length < 12) {
    throw new Error('Use a demo-only password with at least 12 characters.');
  }
  if (secretKey.startsWith('sb_publishable_')) {
    throw new Error('SUPABASE_SECRET_KEY must be a server-only secret key, never a publishable key.');
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const userId = await getOrCreateDemoUser(admin, email, password);
  await ensurePrivateBucket(admin);

  const labPdf = buildDemoPdf([
    'SYNTHETIC DEMO REPORT - NOT A REAL PATIENT',
    'Fictional sample data for the Altrix Labs judge trial.',
    'Patient: Alex Morgan (fictional)',
    'Report date: 2026-09-15',
    ...observations.map((item) => item.evidence),
    'This document is not for clinical use.',
  ]);
  const medicationPdf = buildDemoPdf([
    'SYNTHETIC DEMO MEDICATION LIST - NOT A REAL PATIENT',
    'Fictional sample data for the Altrix Labs judge trial.',
    'Patient: Alex Morgan (fictional)',
    'Report date: 2026-08-15',
    ...medications.map((item) => item.evidence),
    'This document is not for clinical use.',
  ]);
  const documents = [
    {
      id: labDocumentId,
      file_name: 'SYNTHETIC-demo-lab-report.pdf',
      storage_path: `${userId}/${labDocumentId}.pdf`,
      mime_type: 'application/pdf',
      file_size: labPdf.length,
      uploaded_at: '2026-09-15T09:00:00.000Z',
      processing_status: 'completed',
      page_count: 1,
      extraction_method: 'pdf_text',
      extraction_quality_flags: [],
      metadata: { demo: true, fictional: true, document_type: 'Lab report', report_date: '2026-09-15' },
    },
    {
      id: medicationDocumentId,
      file_name: 'SYNTHETIC-demo-medication-list.pdf',
      storage_path: `${userId}/${medicationDocumentId}.pdf`,
      mime_type: 'application/pdf',
      file_size: medicationPdf.length,
      uploaded_at: '2026-08-15T09:00:00.000Z',
      processing_status: 'completed',
      page_count: 1,
      extraction_method: 'pdf_text',
      extraction_quality_flags: [],
      metadata: { demo: true, fictional: true, document_type: 'Medication list', report_date: '2026-08-15' },
    },
  ];

  for (const [path, body] of [
    [documents[0].storage_path, labPdf],
    [documents[1].storage_path, medicationPdf],
  ] as const) {
    const { error } = await admin.storage.from(bucketName).upload(path, body, {
      contentType: 'application/pdf',
      upsert: true,
    });
    failIfError(error, `Could not upload synthetic source ${path}`);
  }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: userId,
    full_name: 'Alex Morgan',
    date_of_birth: '1984-04-12',
    gender: 'unspecified',
  }, { onConflict: 'id' });
  failIfError(profileError, 'Could not seed the demo profile');

  const { error: documentError } = await admin.from('health_documents').upsert(
    documents.map((document) => ({ ...document, user_id: userId })),
    { onConflict: 'id' },
  );
  failIfError(documentError, 'Could not seed demo documents');

  const runs = [
    {
      id: labRunId,
      document_id: labDocumentId,
      model_used: 'synthetic-demo-data',
      status: 'completed',
      raw_response: { synthetic: true },
      page_count: 1,
      extraction_method: 'pdf_text',
      quality_flags: [],
    },
    {
      id: medicationRunId,
      document_id: medicationDocumentId,
      model_used: 'synthetic-demo-data',
      status: 'completed',
      raw_response: { synthetic: true },
      page_count: 1,
      extraction_method: 'pdf_text',
      quality_flags: [],
    },
  ];
  const { error: runError } = await admin.from('extraction_runs').upsert(runs, { onConflict: 'id' });
  failIfError(runError, 'Could not seed demo extraction runs');

  const facts = [
    ...observations.map((item) => ({
      id: item.id,
      user_id: userId,
      document_id: labDocumentId,
      run_id: labRunId,
      fact_type: 'observation',
      fact_value: item.value,
      fact_unit: item.unit,
      reference_range: item.referenceRange,
      display_name: item.name,
      fact_date: item.date,
      extraction_method: 'pdf_text',
      source_text: item.evidence,
      page_number: 1,
      confidence_score: 1,
      verification_status: 'confirmed',
      candidate_data: {
        test_name: item.name,
        value: item.value,
        unit: item.unit,
        reference_range: item.referenceRange,
        flag: item.flag,
        date: item.date,
        page_number: 1,
        source_text: item.evidence,
      },
      reviewed_by: userId,
      reviewed_at: '2026-09-15T09:30:00.000Z',
      review_corrections: {},
      ocr_confidence: null,
      llm_confidence: 1,
      source_boxes: [],
      quality_flags: [],
      dedupe_key: `demo-observation-${item.id}`,
    })),
    ...medications.map((item) => ({
      id: item.id,
      user_id: userId,
      document_id: medicationDocumentId,
      run_id: medicationRunId,
      fact_type: 'medication',
      fact_value: item.name,
      fact_unit: item.strength,
      reference_range: item.dosage,
      display_name: item.name,
      fact_date: item.date,
      extraction_method: 'pdf_text',
      source_text: item.evidence,
      page_number: 1,
      confidence_score: 1,
      verification_status: 'confirmed',
      candidate_data: {
        drug_name: item.name,
        strength: item.strength,
        dosage_instructions: item.dosage,
        frequency: item.frequency,
        duration: null,
        date: item.date,
        page_number: 1,
        source_text: item.evidence,
      },
      reviewed_by: userId,
      reviewed_at: '2026-08-15T09:30:00.000Z',
      review_corrections: {},
      ocr_confidence: null,
      llm_confidence: 1,
      source_boxes: [],
      quality_flags: [],
      dedupe_key: `demo-medication-${item.id}`,
    })),
  ];
  const { error: factError } = await admin.from('extracted_facts').upsert(facts, { onConflict: 'id' });
  failIfError(factError, 'Could not seed demo candidate evidence');

  const { error: observationError } = await admin.from('observations').upsert(
    observations.map((item) => ({
      id: item.id.replace('30000000', '40000000'),
      user_id: userId,
      fact_id: item.id,
      observation_date: item.date,
      display_name: item.name,
      value: Number(item.value),
      original_value: item.value,
      unit: item.unit,
      interpretation: item.flag,
      verified_by: userId,
      verified_at: '2026-09-15T09:30:00.000Z',
    })),
    { onConflict: 'id' },
  );
  failIfError(observationError, 'Could not seed verified demo observations');

  const { error: medicationError } = await admin.from('medications').upsert(
    medications.map((item) => ({
      id: item.id.replace('30000000', '40000000'),
      user_id: userId,
      fact_id: item.id,
      drug_name: item.name,
      dosage: item.dosage,
      frequency: item.frequency,
      start_date: item.date,
      status: 'active',
      verified_by: userId,
      verified_at: '2026-08-15T09:30:00.000Z',
    })),
    { onConflict: 'id' },
  );
  failIfError(medicationError, 'Could not seed verified demo medications');

  const { error: conversationError } = await admin.from('copilot_conversations').upsert({
    id: conversationId,
    user_id: userId,
    title: 'What does my sample lab report show?',
    started_at: '2026-09-16T09:00:00.000Z',
    updated_at: '2026-09-16T09:01:00.000Z',
  }, { onConflict: 'id' });
  failIfError(conversationError, 'Could not seed the demo copilot conversation');

  const citations = [{
    factId: observations[0].id,
    documentId: labDocumentId,
    fileName: documents[0].file_name,
    evidence: observations[0].evidence,
    pageNumber: 1,
  }];
  const { error: messageError } = await admin.from('copilot_messages').upsert([
    {
      id: '60000000-0000-4000-8000-000000000001',
      conversation_id: conversationId,
      role: 'user',
      content: 'What does my sample lab report show?',
      created_at: '2026-09-16T09:00:00.000Z',
    },
    {
      id: '60000000-0000-4000-8000-000000000002',
      conversation_id: conversationId,
      role: 'assistant',
      content: 'The fictional sample report marks HbA1c 6.8% as H (high) against its printed 4.0-5.6% reference range. This is synthetic demo data, not a diagnosis or treatment recommendation.',
      citations,
      created_at: '2026-09-16T09:01:00.000Z',
    },
  ], { onConflict: 'id' });
  failIfError(messageError, 'Could not seed demo copilot messages');

  console.log(`Seeded synthetic demo data for ${email}.`);
  console.log('The shared trial account password is not printed; configure it only in ignored local env files.');
}

seedDemo().catch((error: unknown) => {
  console.error('Demo seeding failed:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
});
