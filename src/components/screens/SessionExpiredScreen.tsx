import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { APP_ASSETS } from '../../data/mockData';

export const SessionExpiredScreen: React.FC = () => {
  const { lang, translations, unlockSession, screenState, setScreenState } = useLanguage();
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [useOtpMode, setUseOtpMode] = useState(false);
  const [otpVal, setOtpVal] = useState(['4', '8', '9', '2']);

  if (screenState === 'loading') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <LoadingSkeleton type="detail" count={2} />
      </div>
    );
  }

  if (screenState === 'empty') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <EmptyState
          icon="lock_open"
          title="Session Already Active"
          subtitle="Your medical session is currently unlocked."
          actionLabel="Return to Records"
          onAction={unlockSession}
        />
      </div>
    );
  }

  if (screenState === 'error') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <ErrorState
          title="Authentication service unreachable"
          subtitle="Please check your connection to unlock your records."
          onRetry={() => setScreenState('normal')}
        />
      </div>
    );
  }

  const handleQuickUnlock = () => {
    setIsUnlocking(true);
    setTimeout(() => {
      setIsUnlocking(false);
      unlockSession();
    }, 700);
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="bg-white rounded-2xl p-7 border border-slate-200/90 shadow-lg text-center space-y-5 animate-in zoom-in-95 duration-200">
        {/* Soft lock avatar with Sunita profile */}
        <div className="relative w-20 h-20 mx-auto">
          <img
            src={APP_ASSETS.sunitaAvatar}
            alt="Sunita Sharma"
            className="w-20 h-20 rounded-full object-cover ring-4 ring-teal-100 filter grayscale-30"
          />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[18px]">lock</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold">
            <span className="material-symbols-outlined text-[14px]">timer</span>
            <span>2-Minute Safe Inactivity Lock</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
            {translations.sessionExpiredTitle}
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {translations.sessionExpiredDesc}
          </p>
        </div>

        {/* Patient card reminder */}
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 text-left flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-900">Sunita Sharma</span>
            <span className="text-[11px] text-slate-500">ABDM: 91-8274-****-4421</span>
          </div>
          <span className="text-[11px] font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-md">
            Encrypted
          </span>
        </div>

        {/* Unlock Methods */}
        {!useOtpMode ? (
          <div className="space-y-3 pt-2">
            <button
              type="button"
              disabled={isUnlocking}
              onClick={handleQuickUnlock}
              className="w-full min-h-[48px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md shadow-teal-700/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isUnlocking ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">
                    progress_activity
                  </span>
                  <span>Verifying biometric key...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">fingerprint</span>
                  <span>{translations.quickUnlockBtn}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setUseOtpMode(true)}
              className="w-full min-h-[44px] rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
            >
              <span className="material-symbols-outlined text-[16px]">sms</span>
              <span>{translations.usePinBtn}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="flex justify-center gap-2">
              {otpVal.map((digit, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const next = [...otpVal];
                    next[i] = e.target.value.slice(-1);
                    setOtpVal(next);
                  }}
                  className="w-11 h-12 rounded-xl border border-slate-300 text-center font-bold text-lg text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-700"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleQuickUnlock}
              className="w-full min-h-[48px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md cursor-pointer"
            >
              Confirm and Unlock
            </button>

            <button
              type="button"
              onClick={() => setUseOtpMode(false)}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Back to Biometric Unlock
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 text-center leading-relaxed">
        {lang === 'hi'
          ? 'आपके स्वास्थ्य डेटा की सुरक्षा हमारी सर्वोच्च प्राथमिकता है।'
          : 'Patient privacy safeguards automatically lock inactive sessions to protect sensitive lab telemetry.'}
      </p>
    </div>
  );
};
