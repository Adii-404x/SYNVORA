import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { INITIAL_RECORDS } from '../../data/mockData';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';

export const TimelineScreen: React.FC = () => {
  const { lang, setCurrentScreen, screenState, setScreenState } = useLanguage();

  const [activeFilter, setActiveFilter] = useState<'All' | 'Lab Reports' | 'Prescriptions' | 'Diagnostics'>('All');
  const [expandedId, setExpandedId] = useState<string | null>(INITIAL_RECORDS[0].id);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (screenState === 'loading') {
    return (
      <div className="max-w-lg mx-auto py-6 px-4">
        <LoadingSkeleton type="cards" count={3} />
      </div>
    );
  }

  if (screenState === 'empty') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <EmptyState
          icon="history_edu"
          title="Timeline is Empty"
          subtitle="No medical documents are on record yet."
          actionLabel="Upload First Report"
          onAction={() => setCurrentScreen('upload')}
        />
      </div>
    );
  }

  if (screenState === 'error') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <ErrorState
          title="Could not sync timeline"
          subtitle="Your encrypted records remain safe in local vault."
          onRetry={() => setScreenState('normal')}
        />
      </div>
    );
  }

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filtered = INITIAL_RECORDS.filter((rec) => {
    if (activeFilter === 'Lab Reports') return rec.type === 'Lab Report';
    if (activeFilter === 'Prescriptions') return rec.type === 'Prescription';
    if (activeFilter === 'Diagnostics') return rec.type === 'Diagnostic';
    return true;
  });

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* Search & ABHA Locker Strip */}
      <div className="flex items-center justify-between gap-3 bg-white border border-slate-200/80 px-4 py-3 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-ping"></div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-900 truncate">ABHA Health Locker</span>
            <span className="text-[11px] text-slate-500 font-mono truncate">
              ABDM ID: 91-8274-1029-4421
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0">
          <span className="material-symbols-outlined text-[14px]">sync</span>
          <span>Live Synced</span>
        </div>
      </div>

      {/* Interactive Parameter Metric Spark Trend */}
      <section className="bg-white border border-teal-200/70 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <span className="material-symbols-outlined text-[18px]">vital_signs</span>
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Longitudinal Biomarker
              </h2>
              <p className="text-[11px] text-slate-500">9-month trajectory vs reference range (4.0 - 5.6%)</p>
            </div>
          </div>
          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
            HbA1c Trend
          </span>
        </div>

        {/* 3 Test Spark Columns */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-slate-400">Feb 2024</span>
            <div className="flex items-baseline gap-0.5 my-1">
              <span className="text-lg font-bold text-slate-800">6.7</span>
              <span className="text-[10px] text-slate-500">%</span>
            </div>
            <span className="text-[10px] font-semibold text-teal-800">Borderline</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-slate-400">Jun 2024</span>
            <div className="flex items-baseline gap-0.5 my-1">
              <span className="text-lg font-bold text-slate-800">6.9</span>
              <span className="text-[10px] text-slate-500">%</span>
            </div>
            <span className="text-[10px] font-semibold text-amber-700">Moderate</span>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-rose-800">Oct 2024</span>
            <div className="flex items-baseline gap-0.5 my-1">
              <span className="text-lg font-bold text-rose-800">7.2</span>
              <span className="text-[10px] text-rose-600">%</span>
            </div>
            <span className="text-[10px] font-bold text-rose-800">Elevated ↗</span>
          </div>
        </div>
      </section>

      {/* Filter Chips Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {(['All', 'Lab Reports', 'Prescriptions', 'Diagnostics'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveFilter(cat)}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === cat
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Vertical Timeline Records */}
      <div className="space-y-3">
        {filtered.map((record) => {
          const isExpanded = expandedId === record.id;

          return (
            <article
              key={record.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3 transition-all hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 shrink-0">
                    <span className="material-symbols-outlined text-[20px]">
                      {record.type === 'Lab Report'
                        ? 'science'
                        : record.type === 'Prescription'
                        ? 'prescriptions'
                        : 'monitor_heart'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 truncate">{record.title}</h3>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {record.date} • {record.provider}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    record.status === 'Normal'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : record.status === 'Needs review'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-sky-50 text-sky-800 border border-sky-200'
                  }`}
                >
                  {record.status}
                </span>
              </div>

              {/* Summary description */}
              <p className="text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 leading-relaxed font-medium">
                {record.summary}
              </p>

              {/* Accordion detail */}
              {isExpanded && (
                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200/60 text-xs text-slate-700 space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Average Glucose (eAG):</span>
                    <span className="font-bold text-slate-900">160 mg/dL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Clinical Verification:</span>
                    <span className="font-bold text-teal-800">Doctor Reviewed</span>
                  </div>
                </div>
              )}

              {/* Bottom Actions Row */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                  className="min-h-[40px] px-2 flex items-center gap-1 text-teal-700 hover:text-teal-900 text-xs font-semibold cursor-pointer"
                >
                  <span>{isExpanded ? 'Hide details' : 'View parameters'}</span>
                  <span
                    className={`material-symbols-outlined text-[16px] transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  >
                    keyboard_arrow_down
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('doctor_share')}
                    className="min-h-[38px] px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">share</span>
                    <span>Share</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerToast('Downloading verified clinical PDF...')}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                    title="Download original PDF"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* End of Stream Reassurance Banner (Healthcare Standards - NO HIPAA Compliant text) */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[22px]">shield_lock</span>
        </div>
        <div className="flex flex-col min-w-0">
          <h2 className="text-xs font-bold text-slate-900">FHIR HL7 & ABDM Encrypted Vault</h2>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            All historical health telemetry is end-to-end encrypted under healthcare privacy standards.
          </p>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-3 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 z-50 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
