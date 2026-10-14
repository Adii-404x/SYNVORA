import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';

export const ConsentScreen: React.FC = () => {
  const { lang, setLang, translations, setCurrentScreen, screenState, setScreenState } =
    useLanguage();

  const [requiredConsent, setRequiredConsent] = useState(true);
  const [optionalAccuracyConsent, setOptionalAccuracyConsent] = useState(false);
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);

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
          icon="verified_user"
          title="No Pending Consents"
          subtitle="All necessary privacy and document processing agreements are up to date."
          actionLabel="Go to Home"
          onAction={() => setCurrentScreen('home')}
        />
      </div>
    );
  }

  if (screenState === 'error') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <ErrorState
          title="Could not load consent terms"
          subtitle="Please check your connection. Your privacy settings remain safe."
          onRetry={() => setScreenState('normal')}
        />
      </div>
    );
  }

  const handleAgree = () => {
    if (!requiredConsent) return;
    setCurrentScreen('home');
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Top Bar with Language Toggle */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <img src="/synvora-app-icon.jpeg" alt="" className="h-8 w-8 rounded-md object-cover" />
          <span className="text-sm font-extrabold text-teal-800">Synvora</span>
        </div>

        {/* Language toggle English | हिन्दी */}
        <div className="flex items-center bg-emerald-50/80 p-0.5 rounded-full border border-emerald-200/80 shadow-xs">
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`min-h-[44px] px-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
              lang === 'en' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-teal-900'
            }`}
          >
            English
          </button>
          <span className="text-emerald-300 px-1 text-xs font-bold">/</span>
          <button
            type="button"
            onClick={() => setLang('hi')}
            className={`min-h-[44px] px-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
              lang === 'hi' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-teal-900'
            }`}
          >
            हिन्दी
          </button>
        </div>
      </div>

      {/* Main Consent Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold mb-1">
            <span className="material-symbols-outlined text-[16px]">shield</span>
            <span>{translations.consentBadge}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
            {translations.consentTitle}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            {translations.consentSubtitle}
          </p>
        </div>

        {/* Three short plain-language lines about data collected, why, and who can see it */}
        <div className="space-y-3.5 pt-1">
          {/* Point 1: What is collected */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-100/80 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[20px]">folder_shared</span>
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-xs font-bold text-slate-800">
                1. {translations.consentPoint1Title}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {translations.consentPoint1Desc}
              </p>
            </div>
          </div>

          {/* Point 2: Why it is collected */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-100/80 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[20px]">insights</span>
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-xs font-bold text-slate-800">
                2. {translations.consentPoint2Title}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {translations.consentPoint2Desc}
              </p>
            </div>
          </div>

          {/* Point 3: Who can see it */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-100/80 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-xs font-bold text-slate-800">
                3. {translations.consentPoint3Title}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {translations.consentPoint3Desc}
              </p>
            </div>
          </div>
        </div>

        {/* Separate Checkboxes */}
        <div className="pt-2 space-y-3.5 border-t border-slate-100">
          {/* (a) Required Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={requiredConsent}
              onChange={(e) => setRequiredConsent(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-slate-300 text-teal-700 focus:ring-teal-600 accent-teal-700 shrink-0 cursor-pointer"
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {translations.consentRequiredLabel}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800">
                  {lang === 'hi' ? 'आवश्यक' : 'Required'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                {translations.consentRequiredDesc}
              </span>
            </div>
          </label>

          {/* (b) Optional Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={optionalAccuracyConsent}
              onChange={(e) => setOptionalAccuracyConsent(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-slate-300 text-teal-700 focus:ring-teal-600 accent-teal-700 shrink-0 cursor-pointer"
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {translations.consentOptionalLabel}
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                  {lang === 'hi' ? 'वैकल्पिक' : 'Optional'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                {translations.consentOptionalDesc}
              </span>
            </div>
          </label>
        </div>

        {/* Buttons: "I agree" and "Learn more" */}
        <div className="pt-3 space-y-2.5">
          <button
            type="button"
            disabled={!requiredConsent}
            onClick={handleAgree}
            className={`w-full min-h-[48px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              requiredConsent
                ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-md shadow-teal-700/20 active:scale-[0.99]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>{translations.consentAgreeBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLearnMoreModal(true)}
            className="w-full min-h-[48px] rounded-xl bg-transparent hover:bg-teal-50/80 text-teal-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-teal-200/70"
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            <span>{translations.consentLearnMoreBtn}</span>
          </button>
        </div>
      </div>

      {/* Reassurance footer note */}
      <p className="text-[11px] text-slate-500 text-center leading-relaxed">
        {lang === 'hi'
          ? 'आप इन अनुमतियों को किसी भी समय सेटिंग्स > गोपनीयता केंद्र से बदल या रद्द कर सकते हैं।'
          : 'You can modify or withdraw these consent preferences anytime in Settings > Privacy Hub.'}
      </p>

      {/* Learn More Modal Sheet */}
      {showLearnMoreModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden -mt-2 mb-2"></div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">policy</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'hi' ? 'डेटा सुरक्षा और आपके अधिकार' : 'Data Privacy & Patient Rights'}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {lang === 'hi' ? 'भारतीय डेटा संरक्षण दिशानिर्देश' : 'Digital Health Data Principles'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLearnMoreModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed pt-1">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 block">
                  {lang === 'hi' ? '1. एन्क्रिप्शन और भंडारण' : '1. End-to-End Vault Storage'}
                </span>
                <p>
                  {lang === 'hi'
                    ? 'आपकी सभी फाइलें ट्रांजिट (TLS 1.3) और रेस्ट (AES-256) दोनों में एन्क्रिप्टेड रहती हैं। किसी भी तीसरे पक्ष का अप्रत्यक्ष प्रवेश संभव नहीं है।'
                    : 'All documents are encrypted during transfer (TLS 1.3) and in storage (AES-256). No third-party or advertising tracking can access your vault.'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 block">
                  {lang === 'hi' ? '2. डॉक्टर परामर्श लिंक पर आपका नियंत्रण' : '2. Complete Access Revocation'}
                </span>
                <p>
                  {lang === 'hi'
                    ? 'जब आप डॉक्टर के साथ लिंक साझा करते हैं, तो वह 24 घंटे, 7 दिन या 30 दिन बाद अपने आप समाप्त हो जाता है। आप चाहें तो एक क्लिक में तुरंत लिंक रद्द कर सकते हैं।'
                    : 'Doctor share links are temporary (24 hours, 7 days, or 30 days) and protected with optional PINs. You can revoke any active link with one tap.'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 block">
                  {lang === 'hi' ? '3. डेटा मिटाने और डाउनलोड करने का अधिकार' : '3. Right to Erase & Portability'}
                </span>
                <p>
                  {lang === 'hi'
                    ? 'आप कभी भी अपना पूरा डेटा डाउनलोड कर सकते हैं या अपने खाते को हमेशा के लिए मिटा सकते हैं। हटाने के बाद सर्वर पर कोई बैकअप प्रति नहीं रखी जाती।'
                    : 'You can export all test data or permanently delete your account at any time. Erased records are irrevocably deleted from all active servers.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowLearnMoreModal(false)}
              className="w-full min-h-[48px] rounded-xl bg-teal-700 text-white font-bold text-sm shadow-xs hover:bg-teal-800 transition-colors cursor-pointer"
            >
              {lang === 'hi' ? 'समझ आ गया' : 'Understood, return to consent'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
