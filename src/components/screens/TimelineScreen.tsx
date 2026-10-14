import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api, TimelineEntry, VerifiedHealthRecords } from '../../services/api';

type Filter = 'all' | TimelineEntry['type'];
type TrendResult = Awaited<ReturnType<typeof api.getTrends>>;

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? 'Date not available' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

export const TimelineScreen: React.FC = () => {
  const { setCurrentScreen } = useApp();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [records, setRecords] = useState<VerifiedHealthRecords | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendForId, setTrendForId] = useState('');
  const [trend, setTrend] = useState<TrendResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [timeline, verified] = await Promise.all([api.getTimeline(), api.getVerifiedRecords()]);
      setEntries(timeline);
      setRecords(verified);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Timeline could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visibleEntries = useMemo(() => entries.filter((entry) => filter === 'all' || entry.type === filter), [entries, filter]);
  const observations = new Map((records?.observations ?? []).map((record) => [record.factId, record]));
  const medications = new Map((records?.medications ?? []).map((record) => [record.factId, record]));
  const sources = new Map((records?.sources ?? []).map((source) => [source.factId, source]));

  async function showTrend(id: string, name: string) {
    setTrendForId(id);
    setTrend(null);
    setError('');
    try {
      setTrend(await api.getTrends(name));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Trend data could not be loaded.');
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

  const filters: Array<{ value: Filter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'document', label: 'Documents' },
    { value: 'observation', label: 'Observations' },
    { value: 'medication', label: 'Medications' },
  ];

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Health timeline</h1>
          <p className="mt-1 text-sm text-slate-600">Chronological records from your account. Only reviewed observations and medications are included.</p>
        </div>
        <button type="button" onClick={() => setCurrentScreen('upload')} className="min-h-10 rounded-md bg-teal-800 px-3 text-sm font-semibold text-white">Upload document</button>
      </header>

      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900"><span>{error}</span><button type="button" onClick={() => void load()} className="font-semibold underline">Refresh</button></div>}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter timeline">
        {filters.map((item) => <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)} className={`min-h-9 rounded-md border px-3 text-sm font-medium ${filter === item.value ? 'border-teal-800 bg-teal-800 text-white' : 'border-slate-300 bg-white text-slate-700'}`}>{item.label}</button>)}
      </div>

      {loading ? <p role="status" className="py-12 text-center text-sm text-slate-500">Loading your timeline…</p> : visibleEntries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm font-semibold text-slate-800">No records in this view</p>
          <p className="mt-1 text-sm text-slate-600">Upload a document and review extracted facts to build your timeline.</p>
        </div>
      ) : (
        <ol className="divide-y divide-slate-200 border-y border-slate-200">
          {visibleEntries.map((entry) => {
            const observation = entry.type === 'observation' && entry.sourceId ? observations.get(entry.sourceId) : undefined;
            const medication = entry.type === 'medication' && entry.sourceId ? medications.get(entry.sourceId) : undefined;
            const source = entry.sourceId ? sources.get(entry.sourceId) : undefined;
            const detail = observation
              ? `${observation.value ?? 'Value unavailable'}${observation.unit ? ` ${observation.unit}` : ''}${observation.referenceRange ? ` · reference: ${observation.referenceRange}` : ''}`
              : medication
                ? [medication.strength, medication.dosage, medication.frequency, medication.duration].filter(Boolean).join(' · ')
                : entry.status;
            return (
              <li key={`${entry.type}-${entry.id}`} className="grid gap-3 py-4 sm:grid-cols-[150px_1fr_auto] sm:items-start">
                <time dateTime={entry.date} className="text-sm text-slate-500">{formatDate(entry.date)}</time>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900">{entry.title}</h2>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] capitalize text-slate-600">{entry.type} · {entry.status}</span>
                  </div>
                  <p className="mt-1 break-words text-sm text-slate-700">{detail}</p>
                  {source && (
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                      <span className="text-slate-500">Source: {source.fileName}{source.pageNumber ? ` · page ${source.pageNumber}` : ''} · {source.extractionMethod || 'method not recorded'}</span>
                      <button type="button" onClick={() => void openDocument(source.documentId)} className="font-semibold text-teal-900 underline">Open source</button>
                    </div>
                  )}
                  {entry.type === 'observation' && <button type="button" onClick={() => void showTrend(entry.id, entry.title)} className="mt-2 text-xs font-semibold text-teal-900 underline">Compare compatible results</button>}
                  {trendForId === entry.id && trend && (
                    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                      {trend.status === 'success' ? (
                        <>
                          <h3 className="text-xs font-semibold text-slate-800">Same-unit results for {entry.title}</h3>
                          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700">
                            {trend.data.map((point) => <li key={point.sourceId}>{formatDate(point.date)}: {point.value} {point.unit}</li>)}
                          </ul>
                          {trend.data.length < 2 && <p className="mt-2 text-xs text-slate-500">At least two dated results are needed to compare change over time.</p>}
                        </>
                      ) : <p className="text-xs text-slate-600">{trend.status === 'incompatible_units' ? 'These results have different or missing units, so they are not combined.' : 'There is not enough compatible numeric data to compare.'}</p>}
                    </div>
                  )}
                </div>
                {entry.type === 'document' && <button type="button" onClick={() => void openDocument(entry.id)} className="min-h-9 justify-self-start rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700">Open private file</button>}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
