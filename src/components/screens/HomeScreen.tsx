import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AiDisclaimerFooter } from '../common/AiDisclaimerFooter';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { INITIAL_RECORDS } from '../../data/mockData';

export const HomeScreen: React.FC = () => {
  const { lang, translations, setCurrentScreen, screenState, setScreenState } = useLanguage();
  const [medTaken, setMedTaken] = useState(false);
  const [signalVisible, setSignalVisible] = useState(true);
  const [signalFeedback, setSignalFeedback] = useState<string | null>(null);

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
          icon="folder_open"
          title="No Health Records Yet"
          subtitle="Add your first lab report or prescription to start tracking your biomarkers."
          actionLabel="Add Record"
          onAction={() => setCurrentScreen('upload')}
        />
      </div>
    );
  }

  if (screenState === 'error') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <ErrorState
          title="Could not refresh dashboard"
          subtitle="Your encrypted records are safely saved offline."
          onRetry={() => setScreenState('normal')}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* Welcome Greeting */}
      <section className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/80 border border-emerald-300/60 w-fit mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="text-[10px] text-emerald-900 font-extrabold uppercase tracking-wider">
              {translations.tagline}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>{translations.greeting}</span>
            <span className="text-xl">🙏</span>
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
            <span className="material-symbols-outlined text-[15px] text-teal-700">
              calendar_today
            </span>
            <span>{lang === 'hi' ? 'आज, 24 अक्टूबर • सोमवार' : 'Today, 24 Oct • Mon'}</span>
          </p>
        </div>

        <div className="bg-teal-50 border border-teal-200/80 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span className="text-xs font-bold text-teal-900">{translations.syncActive}</span>
        </div>
      </section>

      {/* Medication Reminder Micro Card */}
      <section className="bg-white rounded-2xl p-4 shadow-xs border-2 border-emerald-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-sm shadow-teal-700/25">
            <span className="material-symbols-outlined text-[24px]">medication</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-extrabold uppercase tracking-wide">
                {lang === 'hi' ? 'सुबह की खुराक' : 'Morning Dose'}
              </span>
              <span className="text-emerald-500 font-bold">•</span>
              <span className="text-xs font-bold text-teal-900">8:30 AM</span>
            </div>
            <h2 className="text-sm font-bold text-slate-900 truncate">Metformin 500mg</h2>
            <p className="text-xs text-slate-500">
              {lang === 'hi' ? 'नाश्ते के साथ 1 गोली लें' : 'Take 1 tablet with breakfast'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMedTaken(!medTaken)}
          className={`min-w-[48px] min-h-[48px] px-3.5 rounded-xl border-2 transition-all flex items-center justify-center gap-1.5 font-bold text-xs cursor-pointer active:scale-95 ${
            medTaken
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
              : 'bg-emerald-50 hover:bg-emerald-100/90 text-teal-900 border-emerald-300'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] text-teal-700">
            {medTaken ? 'check_circle' : 'check_box_outline_blank'}
          </span>
          <span>{medTaken ? (lang === 'hi' ? 'पूर्ण' : 'Taken') : (lang === 'hi' ? 'ली गई' : 'Mark Taken')}</span>
        </button>
      </section>

      {/* Primary Action Card: Upload Health Records */}
      <section className="bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 rounded-2xl p-5 shadow-lg text-white space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-teal-100">
              <span className="material-symbols-outlined text-[14px]">document_scanner</span>
              <span>Quick Add Records</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-snug">
              {lang === 'hi' ? 'पर्ची या लैब रिपोर्ट जोड़ें' : 'Add prescription or lab test'}
            </h2>
            <p className="text-xs text-teal-100 leading-normal">
              {lang === 'hi'
                ? '💡 बस फोटो खींचें या फाइल चुनें। हम अपने आप सुरक्षित सहेज लेंगे।'
                : '💡 Just snap a photo or pick a document. We organize it automatically in Hindi & English.'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shrink-0">
            <span className="material-symbols-outlined text-[28px]">add_a_photo</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setCurrentScreen('upload')}
            className="min-h-[48px] px-3 py-2.5 rounded-xl bg-white text-teal-950 hover:bg-teal-50 active:scale-[0.98] transition-all shadow-md font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border-2 border-white"
          >
            <span className="material-symbols-outlined text-[22px] text-teal-700">
              photo_camera
            </span>
            <div className="text-left">
              <div className="font-bold leading-tight">{lang === 'hi' ? 'फोटो लें' : 'Take Photo'}</div>
              <div className="text-[10px] text-teal-800 font-semibold">{lang === 'hi' ? 'कैमरा' : 'Camera'}</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentScreen('upload')}
            className="min-h-[48px] px-3 py-2.5 rounded-xl bg-teal-900/60 hover:bg-teal-900/80 border-2 border-teal-300/60 text-white backdrop-blur-md active:scale-[0.98] transition-all font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px] text-teal-200">
              upload_file
            </span>
            <div className="text-left">
              <div className="font-bold leading-tight">{lang === 'hi' ? 'फाइल चुनें' : 'Upload File'}</div>
              <div className="text-[10px] text-teal-200 font-semibold">{lang === 'hi' ? 'गैलरी' : 'PDF / Gallery'}</div>
            </div>
          </button>
        </div>
      </section>

      {/* Health Signal Card: Minimal clinical insight card with MANDATORY AI DISCLAIMER */}
      {signalVisible && (
        <section className="bg-white rounded-2xl p-5 shadow-xs border-2 border-amber-200 hover:border-amber-300 space-y-3.5 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                HbA1c Pattern Signal
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold">
              3 Tests Trend
            </span>
          </div>

          <p className="text-sm text-slate-800 leading-relaxed font-medium">
            Your last three HbA1c readings are slightly above the usual range (
            <span className="font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
              7.2%
            </span>
            ). Worth discussing with your doctor.
          </p>

          <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-teal-800 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-teal-700">flag</span>
                <span>Target: &lt;6.5%</span>
              </span>
              <span className="text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                Latest: 7.2% (Oct 22)
              </span>
            </div>

            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex relative">
              <div className="bg-teal-500 h-full w-[55%]"></div>
              <div className="bg-amber-400 h-full w-[25%]"></div>
              <div className="bg-rose-500 h-full w-[20%]"></div>
              <div
                className="absolute top-0 bottom-0 w-2 bg-slate-900 rounded-full shadow-xs"
                style={{ left: '72%' }}
              ></div>
            </div>

            <div className="flex justify-between text-[11px] text-slate-600 font-semibold pt-0.5">
              <span>May: 6.8%</span>
              <span>Aug: 7.0%</span>
              <span className="text-amber-950 font-bold">Oct: 7.2%</span>
            </div>
          </div>

          {/* AI Content Disclaimer on Signal */}
          <AiDisclaimerFooter variant="inline" />

          <div className="flex items-center justify-between pt-1 gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSignalFeedback('helpful')}
                className={`min-h-[44px] px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  signalFeedback === 'helpful'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-teal-700">
                  thumb_up
                </span>
                <span>Helpful</span>
              </button>

              <button
                type="button"
                onClick={() => setSignalFeedback('not-relevant')}
                className={`min-h-[44px] px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  signalFeedback === 'not-relevant'
                    ? 'bg-slate-200 text-slate-800 border-slate-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-slate-400">
                  thumb_down
                </span>
                <span>Not relevant</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSignalVisible(false)}
              className="min-h-[44px] px-2.5 rounded-lg text-slate-400 hover:text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">visibility_off</span>
              <span>Hide</span>
            </button>
          </div>
        </section>
      )}

      {/* Recently Added Health Records */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recently Added
            </h2>
            <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px] font-bold">
              3
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCurrentScreen('timeline')}
            className="text-xs text-teal-700 hover:text-teal-800 font-bold hover:underline"
          >
            View all records
          </button>
        </div>

        <div className="space-y-2.5">
          {INITIAL_RECORDS.slice(0, 3).map((rec) => (
            <article
              key={rec.id}
              onClick={() => setCurrentScreen('report_detail')}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-teal-300 shadow-xs flex flex-col space-y-2 transition-all cursor-pointer group active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                    <span className="material-symbols-outlined text-[22px]">
                      {rec.type === 'Lab Report'
                        ? 'biotech'
                        : rec.type === 'Prescription'
                        ? 'prescriptions'
                        : 'monitor_heart'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 truncate leading-tight group-hover:text-teal-800">
                      {rec.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {rec.provider}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    rec.status === 'Normal'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : rec.status === 'Needs review'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-sky-50 text-sky-800 border border-sky-200'
                  }`}
                >
                  {rec.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <span>{rec.date} • {rec.type}</span>
                <span className="text-teal-700 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  <span>View report</span>
                  <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Care Guidance Reassurance */}
      <section className="bg-teal-50/70 rounded-2xl p-4 border border-teal-200/80 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">share</span>
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="text-xs font-bold text-teal-950">
              Need to share reports for consultation?
            </h3>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Generate a time-limited 7-day link with optional PIN for Dr. Rajiv Sharma.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCurrentScreen('doctor_share')}
          className="min-h-[40px] px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
        >
          Share
        </button>
      </section>

      {/* Mandatory AI Content Disclaimer Footer */}
      <AiDisclaimerFooter />
    </div>
  );
};
