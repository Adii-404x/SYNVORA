import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { MaskedValue } from '../common/MaskedValue';
import { AiDisclaimerFooter } from '../common/AiDisclaimerFooter';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { APP_ASSETS } from '../../data/mockData';

export const UploadDocumentScreen: React.FC = () => {
  const { lang, translations, setCurrentScreen, screenState, setScreenState } = useLanguage();

  const [frequencyValue, setFrequencyValue] = useState('Twice daily (BD)');
  const [frequencyVerified, setFrequencyVerified] = useState(false);
  const [saveCorrectionsConsent, setSaveCorrectionsConsent] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (screenState === 'loading') {
    return (
      <div className="max-w-lg mx-auto py-6 px-4">
        <LoadingSkeleton type="detail" count={2} />
      </div>
    );
  }

  if (screenState === 'empty') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <EmptyState
          icon="upload_file"
          title="No Document Selected"
          subtitle="Snap a photo of your prescription or select a lab report PDF."
          actionLabel="Take Photo / Choose File"
          onAction={() => setScreenState('normal')}
        />
      </div>
    );
  }

  if (screenState === 'error') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <ErrorState
          title="Could not process document OCR"
          subtitle="The image may be too blurry or dark. Your original file remains untouched."
          onRetry={() => setScreenState('normal')}
        />
      </div>
    );
  }

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConfirmFrequency = () => {
    setFrequencyVerified(true);
    triggerToast('Dosage frequency verified as Twice daily (BD)');
  };

  const handleSaveToRecords = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      triggerToast('Prescription secured to Sunita’s health timeline!');
      setTimeout(() => {
        setCurrentScreen('timeline');
      }, 900);
    }, 1000);
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* 1. MANDATORY PRIVACY BANNER: Small lock icon with 'Your records are private and encrypted' */}
      <div className="w-full bg-teal-50/80 border border-teal-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[18px]">lock</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-teal-950 truncate">
              {translations.uploadPrivacyBanner}
            </span>
            <span className="text-[11px] text-teal-800/80 truncate">
              {translations.uploadPrivacyBannerSub}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCurrentScreen('privacy_hub')}
          className="text-[11px] font-bold text-teal-800 hover:text-teal-900 underline shrink-0 px-1"
        >
          {lang === 'hi' ? 'सेटिंग्स' : 'Manage'}
        </button>
      </div>

      {/* Stepper Pipeline Indicator */}
      <div className="w-full bg-white rounded-xl p-3 shadow-xs border border-slate-200/70 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-[70px]">
          <div className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-[12px]">
            ✓
          </div>
          <span className="text-xs font-bold text-teal-800">Uploaded</span>
        </div>
        <div className="h-[2px] w-4 bg-teal-200 shrink-0"></div>
        <div className="flex items-center gap-1.5 min-w-[75px]">
          <div className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-[12px]">
            ✓
          </div>
          <span className="text-xs font-bold text-teal-800">OCR Read</span>
        </div>
        <div className="h-[2px] w-4 bg-teal-200 shrink-0"></div>
        <div className="flex items-center gap-1.5 min-w-[85px]">
          <div className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-[12px]">
            ✓
          </div>
          <span className="text-xs font-bold text-teal-800">Understood</span>
        </div>
        <div className="h-[2px] w-4 bg-teal-200 shrink-0"></div>
        <div className="flex items-center gap-1.5 min-w-[75px]">
          <div className="w-5 h-5 rounded-full bg-teal-800 text-white flex items-center justify-center text-[11px] font-bold ring-2 ring-teal-400/40">
            4
          </div>
          <span className="text-xs font-bold text-teal-900">Review</span>
        </div>
      </div>

      {/* Reassuring Greeting Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-start gap-3 relative overflow-hidden">
        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 border border-teal-200/60 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[22px]">health_and_safety</span>
        </div>
        <div className="flex flex-col min-w-0">
          <h1 className="text-sm font-bold text-slate-900">
            Review Sunita's Prescription
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            We processed 5 key details. Please quickly verify the flagged items before storing in her health timeline.
          </p>
        </div>
      </div>

      {/* Prescription Preview Card with Bounding Boxes */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-teal-700 text-[18px]">
              document_scanner
            </span>
            <span className="text-xs font-bold text-slate-900">Original Document OCR</span>
          </div>
          <span className="text-[11px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded-full">
            Tap to zoom
          </span>
        </div>

        {/* Scanned Image with OCR Anchors */}
        <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-100 shadow-inner group">
          <img
            src={APP_ASSETS.prescriptionPhoto}
            alt="Prescription preview"
            className="w-full h-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-slate-900/10 pointer-events-none"></div>

          {/* High Match Medicine */}
          <div className="absolute top-[28%] left-[8%] w-[42%] h-[18%] bg-teal-500/30 rounded-lg flex items-start p-1 backdrop-blur-[1px]">
            <span className="bg-teal-700 text-white text-[9px] font-bold px-1 rounded shadow-xs">
              Rx: 96%
            </span>
          </div>

          {/* Low Confidence Frequency Flag */}
          <div className="absolute top-[50%] left-[12%] w-[48%] h-[20%] bg-amber-500/30 rounded-lg flex items-start justify-between p-1 ring-2 ring-amber-500 animate-pulse">
            <span className="bg-amber-600 text-white text-[9px] font-bold px-1 rounded shadow-xs">
              Needs Review 74%
            </span>
            <span className="material-symbols-outlined text-amber-700 text-[12px]">
              priority_high
            </span>
          </div>

          {/* Doctor Stamp */}
          <div className="absolute bottom-[8%] right-[6%] w-[38%] h-[26%] bg-teal-600/30 rounded-lg flex items-end justify-end p-1">
            <span className="bg-teal-800 text-white text-[9px] font-bold px-1 rounded">
              Dr. Rajesh 98%
            </span>
          </div>
        </div>
      </div>

      {/* DEMO OF MASKED SENSITIVE DETAILS (Blur with 'Tap to show') */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-700 text-[20px]">
              visibility_lock
            </span>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Protected Patient Identifiers
            </span>
          </div>
          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full">
            Masked
          </span>
        </div>

        {/* Masked Sensitive Diagnosis */}
        <MaskedValue
          label="Clinical Diagnosis (Private)"
          value="Type 2 Diabetes Mellitus with borderline volatility"
          maskedPlaceholder="•••••••• •••••••• ••••••••••"
        />

        {/* Masked ABHA Number */}
        <MaskedValue
          label="Ayushman Bharat Health Account (ABDM ID)"
          value="91-8274-1029-4421"
          maskedPlaceholder="91-••••-••••-4421"
        />
      </div>

      {/* Extracted Parameters Review */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Extracted Parameters (5 Items)
          </span>
          <span className="text-xs font-semibold text-amber-800">
            {frequencyVerified ? 'All 5 Verified' : '1 Attention Required'}
          </span>
        </div>

        {/* Field 1: Dosage Frequency (Needs Review Focus) */}
        <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Dosage Frequency
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                frequencyVerified
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-900 border border-amber-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  frequencyVerified ? 'bg-emerald-600' : 'bg-amber-600'
                }`}
              ></span>
              <span>{frequencyVerified ? 'Verified by User' : 'Needs review · 74%'}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={frequencyValue}
              onChange={(e) => setFrequencyValue(e.target.value)}
              className="w-full min-h-[48px] px-3.5 rounded-xl bg-slate-50 border border-slate-300 font-semibold text-sm text-slate-900 focus:outline-none focus:border-teal-700 focus:bg-white"
            />
            <button
              type="button"
              onClick={handleConfirmFrequency}
              className={`min-h-[48px] px-3.5 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                frequencyVerified
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-teal-700 hover:bg-teal-800 text-white shadow-xs'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {frequencyVerified ? 'done_all' : 'check'}
              </span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            Suggested correction based on Dr. Mehta's past prescription history: BD (Twice daily).
          </p>
        </div>

        {/* Field 2: Medicine Name */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Medicine Name
            </span>
            <span className="text-sm font-bold text-slate-900 truncate">Metformin 500mg</span>
            <span className="text-[11px] text-slate-500">Oral Tablet • Antidiabetic</span>
          </div>
          <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60 shrink-0">
            96% Match
          </span>
        </div>

        {/* Field 3: Prescribing Doctor */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center font-bold text-xs shrink-0">
              RM
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate">
                Dr. Rajesh Mehta, MD
              </span>
              <span className="text-[11px] text-slate-500 truncate">
                Endocrinologist • Regency Care
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60 shrink-0">
            98% Match
          </span>
        </div>
      </div>

      {/* Accuracy Consent Switch */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-start gap-3">
        <input
          type="checkbox"
          id="accuracySwitch"
          checked={saveCorrectionsConsent}
          onChange={(e) => setSaveCorrectionsConsent(e.target.checked)}
          className="mt-1 w-5 h-5 rounded text-teal-700 focus:ring-teal-600 accent-teal-700 shrink-0 cursor-pointer"
        />
        <label htmlFor="accuracySwitch" className="flex flex-col min-w-0 cursor-pointer">
          <span className="text-xs font-bold text-slate-900">
            Save corrections to help improve extraction accuracy for Sunita's records
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            Helps Altrix Lab adapt to Dr. Rajesh Mehta's prescription format for faster future scans.
          </span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSaveToRecords}
          className="w-full min-h-[48px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md shadow-teal-700/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSaving ? (
            <>
              <span className="material-symbols-outlined text-[20px] animate-spin">
                progress_activity
              </span>
              <span>Securing to Sunita's Timeline...</span>
            </>
          ) : savedSuccess ? (
            <>
              <span className="material-symbols-outlined text-[20px]">task_alt</span>
              <span>Saved Successfully!</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">verified</span>
              <span>Confirm and save to records</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCurrentScreen('home')}
          className="w-full min-h-[44px] text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          Re-upload or take another photo
        </button>
      </div>

      {/* MANDATORY AI DISCLAIMER FOOTER */}
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
