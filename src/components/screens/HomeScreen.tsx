import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { api, CandidateFact, HealthDocument, VerifiedHealthRecords } from '../../services/api';

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? 'Date not available' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

export const HomeScreen: React.FC = () => {
  const { setCurrentScreen } = useLanguage();
  const [documents, setDocuments] = useState<HealthDocument[]>([]);
  const [pending, setPending] = useState<CandidateFact[]>([]);
  const [records, setRecords] = useState<VerifiedHealthRecords | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextDocuments, nextPending, nextRecords] = await Promise.all([
        api.getDocuments(), api.getPendingFacts(), api.getVerifiedRecords(),
      ]);
      setDocuments(nextDocuments);
      setPending(nextPending);
      setRecords(nextRecords);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your health data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function retryExtraction(document: HealthDocument) {
    setRetrying(document.id);
    setError('');
    try {
      await api.extractDocument(document.id);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Document processing could not be retried.');
    } finally {
      setRetrying(null);
    }
  }

  const latest = documents.slice(0, 5);
  const observations = records?.observations.slice(0, 5) ?? [];

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Health records</h1>
          <p className="mt-1 text-sm text-slate-600">Documents, reviewed facts, and source-linked answers in one place.</p>
        </div>
        <button type="button" onClick={() => setCurrentScreen('upload')} className="min-h-11 rounded-md bg-teal-800 px-4 text-sm font-semibold text-white hover:bg-teal-900">Upload document</button>
      </header>

      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900"><span>{error}</span><button type="button" onClick={() => void load()} className="font-semibold underline">Retry</button></div>}
      {loading ? <div role="status" className="py-12 text-center text-sm text-slate-500">Loading your records…</div> : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Documents', documents.length],
              ['Needs review', pending.length],
              ['Verified observations', records?.observations.length ?? 0],
              ['Documented medicines', records?.medications.length ?? 0],
            ].map(([label, count]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{count}</p>
              </div>
            ))}
          </div>

          {pending.length > 0 && (
            <section className="border-y border-amber-200 bg-amber-50/60 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Candidate facts need your review</h2>
                  <p className="mt-1 text-sm text-slate-600">They are not part of verified records until you confirm them.</p>
                </div>
                <button type="button" onClick={() => setCurrentScreen('upload')} className="min-h-10 rounded-md border border-amber-400 bg-white px-3 text-sm font-semibold text-amber-950">Review {pending.length}</button>
              </div>
            </section>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-900">Recent documents</h2>
                <button type="button" onClick={() => setCurrentScreen('timeline')} className="text-sm font-semibold text-teal-900 underline">Timeline</button>
              </div>
              {latest.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-600">No documents yet. Upload a PDF or a clear image of a report.</p> : (
                <ul className="divide-y divide-slate-200 border-y border-slate-200">
                  {latest.map((document) => (
                    <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{document.file_name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{formatDate(document.uploaded_at)} · {document.processing_status}</p>
                      </div>
                      {document.processing_status === 'failed' && (
                        <button type="button" disabled={retrying === document.id} onClick={() => void retryExtraction(document)} className="min-h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold disabled:opacity-50">{retrying === document.id ? 'Retrying…' : 'Retry extraction'}</button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-900">Recently verified observations</h2>
                <button type="button" onClick={() => setCurrentScreen('summary')} className="text-sm font-semibold text-teal-900 underline">Prepare summary</button>
              </div>
              {observations.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-600">Verified observations will appear here after you review extracted candidates.</p> : (
                <ul className="divide-y divide-slate-200 border-y border-slate-200">
                  {observations.map((observation) => (
                    <li key={observation.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{observation.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{formatDate(observation.date)}</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-slate-800">{observation.value ?? 'Value unavailable'}{observation.unit ? ` ${observation.unit}` : ''}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="border-t border-slate-200 pt-5">
            <h2 className="text-base font-semibold text-slate-900">Ask about your records</h2>
            <p className="mt-1 text-sm text-slate-600">The copilot uses verified, source-linked information and tells you when evidence is missing.</p>
            <button type="button" onClick={() => setCurrentScreen('copilot')} className="mt-3 min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">Open copilot</button>
          </section>
        </>
      )}
    </section>
  );
};
