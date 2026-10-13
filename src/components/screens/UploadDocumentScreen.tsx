import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { api, CandidateFact, HealthDocument } from '../../services/api';

const acceptedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const maxFileSize = 10 * 1024 * 1024;

function dateInputValue(value: unknown) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
}

function candidateDate(fact: CandidateFact) {
  return dateInputValue(fact.fact_date) || dateInputValue(fact.candidate_data?.date);
}

export const UploadDocumentScreen: React.FC = () => {
  const { setCurrentScreen } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [facts, setFacts] = useState<CandidateFact[]>([]);
  const [documents, setDocuments] = useState<HealthDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedName, setSelectedName] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [activeDocument, setActiveDocument] = useState<HealthDocument | null>(null);
  const [dateCorrections, setDateCorrections] = useState<Record<string, string>>({});
  const [busyFact, setBusyFact] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadReviewData = useCallback(async () => {
    setLoading(true);
    try {
      const [pending, ownedDocuments] = await Promise.all([api.getPendingFacts(), api.getDocuments()]);
      setFacts(pending);
      setDocuments(ownedDocuments);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Review data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadReviewData(); }, [loadReviewData]);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedName(file.name);
    setError('');
    setNotice('');
    setActiveDocument(null);
    if (!acceptedTypes.has(file.type)) {
      setError('Choose a PDF, JPEG, PNG, or WebP file.');
      event.target.value = '';
      return;
    }
    if (file.size <= 0 || file.size > maxFileSize) {
      setError('The file must be smaller than 10 MB.');
      event.target.value = '';
      return;
    }

    setUploadProgress(0);
    setProcessing(false);
    try {
      const document = await api.uploadDocument(file, setUploadProgress);
      setActiveDocument(document);
      setUploadProgress(null);
      setProcessing(true);
      await api.extractDocument(document.id);
      setActiveDocument({ ...document, processing_status: 'completed', error_message: null });
      setNotice('Extraction finished. Candidate facts are shown below for your review.');
      await loadReviewData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The document could not be processed.');
      await loadReviewData();
    } finally {
      setUploadProgress(null);
      setProcessing(false);
      event.target.value = '';
    }
  }

  async function retry(document: HealthDocument) {
    setActiveDocument(document);
    setError('');
    setNotice('');
    setProcessing(true);
    try {
      await api.extractDocument(document.id);
      setActiveDocument({ ...document, processing_status: 'completed', error_message: null });
      setNotice('Extraction finished. Review any pending candidate facts below.');
      await loadReviewData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Extraction could not be retried.');
      await loadReviewData();
    } finally {
      setProcessing(false);
    }
  }

  async function openDocument(id: string) {
    const popup = window.open('about:blank', '_blank');
    if (!popup) { setError('Allow pop-ups to open a private document preview.'); return; }
    popup.opener = null;
    try {
      const { url } = await api.getDocumentUrl(id);
      popup.location.replace(url);
    } catch (cause) {
      popup.close();
      setError(cause instanceof Error ? cause.message : 'Document preview could not be opened.');
    }
  }

  async function review(fact: CandidateFact, decision: 'confirm' | 'reject') {
    const observationDate = dateCorrections[fact.id] ?? candidateDate(fact);
    if (decision === 'confirm' && fact.fact_type === 'observation' && !observationDate) {
      setError('This observation has no usable date. Enter the date printed on the source report before confirming it.');
      return;
    }
    setBusyFact(fact.id);
    setError('');
    try {
      if (decision === 'confirm') await api.confirmFact(fact.id, observationDate || undefined);
      else await api.rejectFact(fact.id);
      setNotice(decision === 'confirm' ? 'Candidate confirmed and added to verified records.' : 'Candidate rejected.');
      setFacts((current) => current.filter((item) => item.id !== fact.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The review decision could not be saved.');
    } finally {
      setBusyFact(null);
    }
  }

  const currentStatus = activeDocument?.processing_status;
  const pendingDocuments = documents.filter((document) => ['pending', 'failed'].includes(document.processing_status));

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Documents and fact review</h1>
        <p className="mt-1 text-sm text-slate-600">Upload a report, then review each extracted candidate against its original evidence.</p>
      </header>

      {error && <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</div>}

      <section className="border-y border-slate-200 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Upload medical document</h2>
            <p className="mt-1 text-sm text-slate-600">PDF, JPEG, PNG, or WebP · 10 MB maximum</p>
          </div>
          <input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => void handleFile(event)} className="block max-w-full text-sm text-slate-700 file:mr-3 file:min-h-10 file:rounded-md file:border-0 file:bg-teal-800 file:px-4 file:text-sm file:font-semibold file:text-white" disabled={uploadProgress !== null || processing} />
        </div>
        {selectedName && <p className="mt-3 truncate text-sm text-slate-700">{selectedName}</p>}
        {uploadProgress !== null && (
          <div className="mt-3" aria-live="polite">
            <div className="flex justify-between text-xs text-slate-600"><span>Uploading</span><span>{uploadProgress}%</span></div>
            <progress className="mt-1 h-2 w-full accent-teal-800" max={100} value={uploadProgress}>{uploadProgress}%</progress>
          </div>
        )}
        {processing && <p role="status" className="mt-3 text-sm text-slate-700">Extracting page text and candidate facts. This may take a few minutes for scanned documents.</p>}
        {activeDocument && !processing && currentStatus && <p className="mt-3 text-xs text-slate-600">Processing status: {currentStatus}</p>}
      </section>

      {pendingDocuments.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Documents to process or retry</h2>
          <ul className="divide-y divide-slate-200 border-y border-slate-200">
            {pendingDocuments.map((document) => (
              <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{document.file_name}</p><p className="text-xs text-slate-500">{document.processing_status}{document.error_message ? ` · ${document.error_message}` : ''}</p></div>
                <button type="button" disabled={processing} onClick={() => void retry(document)} className="min-h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold disabled:opacity-50">{document.processing_status === 'failed' ? 'Retry extraction' : 'Process now'}</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Pending candidate facts</h2>
            <p className="mt-1 text-sm text-slate-600">Confirmation creates a verified record; rejection does not. Nothing is promoted automatically.</p>
          </div>
          <button type="button" onClick={() => void loadReviewData()} className="min-h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold">Refresh</button>
        </div>
        {loading ? <p role="status" className="py-8 text-center text-sm text-slate-500">Loading candidates…</p> : facts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-600">No pending candidates. Process a document to review extracted details.</p>
        ) : (
          <ul className="divide-y divide-slate-200 border-y border-slate-200">
            {facts.map((fact) => {
              const payload = fact.candidate_data ?? {};
              const isObservation = fact.fact_type === 'observation';
              const date = dateCorrections[fact.id] ?? candidateDate(fact);
              const medicationDetails = [payload.strength, payload.dosage_instructions, payload.frequency, payload.duration]
                .filter((value): value is string => typeof value === 'string' && value.length > 0);
              return (
                <li key={fact.id} className="py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase text-teal-900">{fact.fact_type} candidate</p>
                      <h3 className="mt-1 text-base font-semibold text-slate-900">{fact.display_name || fact.fact_value}</h3>
                      <p className="mt-1 text-sm text-slate-800">Reported value: {fact.fact_value}{fact.fact_unit ? ` ${fact.fact_unit}` : ''}</p>
                      {fact.reference_range && <p className="mt-1 text-sm text-slate-600">Printed reference/instructions: {fact.reference_range}</p>}
                      {medicationDetails.length > 0 && <p className="mt-1 text-sm text-slate-600">{medicationDetails.join(' · ')}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>Source: {fact.source_document.file_name}{fact.page_number ? ` · page ${fact.page_number}` : ''}{fact.extraction_method ? ` · ${fact.extraction_method}` : ''}</span>
                        <button type="button" onClick={() => void openDocument(fact.document_id)} className="font-semibold text-teal-900 underline">Open original</button>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>OCR confidence: {fact.ocr_confidence === null ? 'unknown' : `${fact.ocr_confidence}%`}</p>
                      <p>Extraction confidence: {fact.llm_confidence === null ? 'unknown' : `${Math.round(fact.llm_confidence * 100)}%`}</p>
                      <p>Clinical review: pending</p>
                    </div>
                  </div>

                  <blockquote className="mt-3 whitespace-pre-wrap border-l-2 border-teal-700 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">{fact.source_text}</blockquote>
                  {fact.quality_flags.length > 0 && <p className="mt-2 text-xs text-amber-800">Needs attention: {fact.quality_flags.join(', ')}</p>}

                  {isObservation && (
                    <label className="mt-3 block max-w-xs text-xs font-semibold text-slate-700">
                      Observation date from source report
                      <input type="date" value={date} onChange={(event) => setDateCorrections((current) => ({ ...current, [fact.id]: event.target.value }))} className="mt-1 block min-h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-normal" />
                      {!date && <span className="mt-1 block font-normal text-amber-800">No date was extracted. Confirm only after entering the date shown in the source.</span>}
                    </label>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" disabled={busyFact === fact.id} onClick={() => void review(fact, 'confirm')} className="min-h-10 rounded-md bg-teal-800 px-4 text-sm font-semibold text-white disabled:opacity-50">{busyFact === fact.id ? 'Saving…' : 'Confirm'}</button>
                    <button type="button" disabled={busyFact === fact.id} onClick={() => void review(fact, 'reject')} className="min-h-10 rounded-md border border-rose-300 px-4 text-sm font-semibold text-rose-800 disabled:opacity-50">Reject</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">Extraction can be incomplete or inaccurate. Compare candidate details with the source. Medication instructions are shown as extracted and are not treatment advice.</p>
    </section>
  );
};
