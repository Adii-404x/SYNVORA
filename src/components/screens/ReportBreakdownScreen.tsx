import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AiDisclaimerFooter } from '../common/AiDisclaimerFooter';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { APP_ASSETS } from '../../data/mockData';

export const ReportBreakdownScreen: React.FC = () => {
  const { lang, setLang, translations, setCurrentScreen, screenState, setScreenState } = useLanguage();

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (screenState === 'loading') {
    return (
      <div className="max-w-lg mx-auto py-6 px-4">
        <LoadingSkeleton type="detail" count={3} />
      </div>
    );
  }

  if (screenState === 'empty') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <EmptyState
          icon="description"
          title="No Lab Report Selected"
          subtitle="Select a diagnostic test from your timeline to see clinical breakdowns."
          actionLabel="View Timeline"
          onAction={() => setCurrentScreen('timeline')}
        />
      </div>
    );
  }

  if (screenState === 'error') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <ErrorState
          title="Could not parse lab metrics"
          subtitle="Your encrypted PDF is intact. Please tap below to retry."
          onRetry={() => setScreenState('normal')}
        />
      </div>
    );
  }

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const questions = [
    {
      id: 'q1',
      en: 'Should we adjust the timing of my evening Metformin or add pre-breakfast walking?',
      hi: 'क्या मुझे शाम की मेटफॉर्मिन दवा का समय बदलना चाहिए या सुबह की सैर बढ़ानी चाहिए?'
    },
    {
      id: 'q2',
      en: 'Do I need a repeat HbA1c test in 3 months to monitor my progress?',
      hi: 'क्या मुझे 3 महीने बाद दोबारा HbA1c की जांच करानी होगी?'
    },
    {
      id: 'q3',
      en: 'Given that my kidney function is healthy (0.9 mg/dL), are my current supplements adequate?',
      hi: 'किडनी के परिणाम (0.9 mg/dL) सामान्य हैं, क्या मेरा वर्तमान आहार और पानी की मात्रा पर्याप्त है?'
    }
  ];

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between pb-1">
        <button
          type="button"
          onClick={() => setCurrentScreen('home')}
          className="min-h-[44px] px-2 flex items-center gap-1 text-teal-800 hover:text-teal-900 font-bold text-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>{translations.backBtn}</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-emerald-50 p-0.5 rounded-full border border-emerald-200">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`min-h-[36px] px-2.5 rounded-full text-xs font-bold ${
                lang === 'en' ? 'bg-teal-700 text-white' : 'text-slate-600'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('hi')}
              className={`min-h-[36px] px-2.5 rounded-full text-xs font-bold ${
                lang === 'hi' ? 'bg-teal-700 text-white' : 'text-slate-600'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </div>

      {/* Document Header & Meta Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-16 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex flex-col items-center justify-center relative">
            <img
              src={APP_ASSETS.pdfThumbnail}
              alt="PDF thumbnail"
              className="w-full h-full object-cover opacity-90"
            />
            <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-slate-900/70 text-[9px] font-bold text-white">
              PDF
            </span>
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200/80 w-fit mb-1">
              <span className="material-symbols-outlined text-[12px]">verified</span>
              <span>Verified Diagnostic Lab Report</span>
            </div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight truncate">
              Comprehensive Diabetes & Lipid Profile
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Dr. Lal PathLabs • Ref #LL-94281
            </p>
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-medium">
              <span>2 Pages</span>
              <span>•</span>
              <span>Tested 12 Oct, 08:30 AM</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => triggerToast('Viewing official high-res PDF...')}
            className="min-h-[44px] px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200"
          >
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            <span>View Original</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentScreen('doctor_share')}
            className="min-h-[44px] px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">share</span>
            <span>Share to Doctor</span>
          </button>
        </div>
      </div>

      {/* AI Care Assist Bar & Bilingual Switcher */}
      <div className="bg-gradient-to-br from-teal-50 via-emerald-50/50 to-slate-50 rounded-2xl p-4 border border-teal-200/70 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[19px]">auto_awesome</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  Synvora AI Care Assist
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                  Audio Summary
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                {lang === 'hi' ? 'द्विभाषी आवाज में व्याख्या' : 'Bilingual physician read-aloud'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsPlayingAudio(!isPlayingAudio);
            triggerToast(
              !isPlayingAudio
                ? lang === 'hi'
                  ? 'ऑडियो व्याख्या शुरू हुई'
                  : 'Playing audio explanation in calm physician tone'
                : 'Audio paused'
            );
          }}
          className="w-full min-h-[48px] px-3.5 rounded-xl bg-white hover:bg-teal-50/50 text-slate-800 flex items-center justify-between border border-teal-200 shadow-xs transition-all active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">
                {isPlayingAudio ? 'pause' : 'play_arrow'}
              </span>
            </div>
            <div className="text-left truncate">
              <span className="text-xs font-bold text-slate-900 block truncate">
                {lang === 'hi' ? 'हिन्दी में व्याख्या सुनें (1:20)' : 'Listen to explanation in English (1:12)'}
              </span>
              <span className="text-[10px] text-teal-700 font-semibold block">
                {isPlayingAudio ? 'Playing... tap to pause' : 'Natural physician tone'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 pl-2">
            <span
              className={`w-1 h-3 bg-teal-600 rounded-full ${isPlayingAudio ? 'animate-pulse' : ''}`}
            ></span>
            <span
              className={`w-1 h-5 bg-teal-700 rounded-full ${isPlayingAudio ? 'animate-pulse' : ''}`}
            ></span>
            <span
              className={`w-1 h-3 bg-teal-500 rounded-full ${isPlayingAudio ? 'animate-pulse' : ''}`}
            ></span>
          </div>
        </button>
      </div>

      {/* 'In Simple Words' Plain Language Summary */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">spa</span>
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              {lang === 'hi' ? 'सरल शब्दों में समझें' : 'In Simple Words'}
            </h2>
          </div>
          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/70">
            Clinical Review
          </span>
        </div>

        <div className="space-y-2 text-xs text-slate-700 leading-relaxed font-normal">
          <p>
            {lang === 'hi'
              ? 'आपकी खाली पेट की शुगर (Fasting Glucose) और HbA1c सामान्य सीमा से थोड़ी अधिक है, जिसका अर्थ है कि पिछले कुछ हफ्तों में आपके शरीर में अतिरिक्त शर्करा रही है।'
              : 'Your fasting blood glucose and HbA1c are slightly higher than typical target ranges, indicating your body is holding extra sugar over recent weeks.'}
          </p>
          <p>
            {lang === 'hi'
              ? 'राहत की बात यह है कि आपकी किडनी और लिवर के सभी पैरामीटर बिल्कुल स्वस्थ और सुरक्षित सीमा में हैं। कोलेस्ट्रॉल भी संतुलित है।'
              : 'Importantly, your kidney and liver markers remain in normal, healthy ranges. Total cholesterol is well-balanced within standard thresholds.'}
          </p>
          <p className="text-slate-500">
            {lang === 'hi'
              ? 'चिंता की कोई आपातकालीन बात नहीं है। अपने डॉक्टर से एक सामान्य परामर्श लेकर भोजन व शाम की दवा का समय व्यवस्थित करें।'
              : 'No immediate emergency indicators are detected. A routine review with your doctor can help optimize your diet, activity, and any evening medication timing.'}
          </p>
        </div>

        <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200/80 flex items-center gap-2">
          <span className="material-symbols-outlined text-teal-700 text-[18px] shrink-0">
            health_and_safety
          </span>
          <p className="text-[11px] text-teal-950 font-semibold">
            {lang === 'hi'
              ? 'स्थिर स्वास्थ्य संकेत • अगली जांच 3 महीने में अनुशंसित'
              : 'Stable diagnostic trend • Next routine check suggested in 3 months'}
          </p>
        </div>
      </div>

      {/* 'Your Results' Lab Value Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            {lang === 'hi' ? 'आपके जांच परिणाम' : 'Your Results (4 Key Biomarkers)'}
          </h2>
        </div>

        {/* Biomarker 1: HbA1c */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Glycated Hemoglobin
              </span>
              <h3 className="text-sm font-bold text-slate-900">HbA1c</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
              Needs Review
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">7.2</span>
            <span className="text-xs text-slate-500 font-semibold">%</span>
            <span className="text-xs text-slate-500 ml-auto font-medium">Target: 4.0 – 5.6 %</span>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex relative my-1">
            <div className="h-full bg-emerald-300 w-[25%]"></div>
            <div className="h-full bg-emerald-500 w-[20%]"></div>
            <div className="h-full bg-rose-400 w-[55%]"></div>
          </div>
          <p className="text-[11px] text-slate-500">
            Indicates your average blood sugar levels over the past 3 months.
          </p>
        </div>

        {/* Biomarker 2: Fasting Blood Sugar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Metabolic Panel
              </span>
              <h3 className="text-sm font-bold text-slate-900">Fasting Blood Sugar</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
              Needs Review
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">138</span>
            <span className="text-xs text-slate-500 font-semibold">mg/dL</span>
            <span className="text-xs text-slate-500 ml-auto font-medium">Target: 70 – 100 mg/dL</span>
          </div>
        </div>

        {/* Biomarker 3: Serum Creatinine */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Kidney Function (KFT)
              </span>
              <h3 className="text-sm font-bold text-slate-900">Serum Creatinine</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Normal
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">0.9</span>
            <span className="text-xs text-slate-500 font-semibold">mg/dL</span>
            <span className="text-xs text-slate-500 ml-auto font-medium">Target: 0.6 – 1.2 mg/dL</span>
          </div>
        </div>
      </div>

      {/* 'Questions for Your Doctor' */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              {lang === 'hi' ? 'डॉक्टर से पूछने योग्य सवाल' : 'Questions for Your Doctor'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => triggerToast('All questions copied to clipboard')}
            className="text-xs font-bold text-teal-700 hover:text-teal-900"
          >
            Copy All
          </button>
        </div>

        <div className="space-y-2 pt-1">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 space-y-2 text-xs"
            >
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-slate-800 leading-snug font-medium">
                  {lang === 'hi' ? q.hi : q.en}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => triggerToast('Question copied')}
                  className="min-h-[32px] px-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-1 hover:bg-slate-50"
                >
                  <span className="material-symbols-outlined text-[13px]">content_copy</span>
                  <span>Copy</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerToast('Shared to clinician notes')}
                  className="min-h-[32px] px-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-semibold flex items-center gap-1 hover:bg-teal-100"
                >
                  <span className="material-symbols-outlined text-[13px]">send</span>
                  <span>Share</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Doctor Call Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={APP_ASSETS.drRajivAvatar}
            alt="Dr. Rajiv Sharma"
            className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-emerald-500/80"
          />
          <div className="flex flex-col min-w-0">
            <h3 className="text-xs font-bold text-slate-900 truncate">Dr. Rajiv Sharma</h3>
            <p className="text-[11px] text-slate-500 truncate">
              Primary Diabetologist • Fortis Clinic
            </p>
          </div>
        </div>

        <a
          href="tel:+919876543210"
          className="min-h-[44px] min-w-[44px] px-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">call</span>
          <span>Call Doctor</span>
        </a>
      </div>

      {/* MANDATORY AI CONTENT DISCLAIMER FOOTER */}
      <AiDisclaimerFooter />

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
