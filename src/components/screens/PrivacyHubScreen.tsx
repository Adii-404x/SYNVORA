import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';

export const PrivacyHubScreen: React.FC = () => {
  const {
    translations,
    setCurrentScreen,
    screenState,
    setScreenState,
    autoLockEnabled,
    setAutoLockEnabled,
    biometricsEnabled,
    setBiometricsEnabled,
    maskSensitiveByDefault,
    setMaskSensitiveByDefault,
    triggerAutoLock
  } = useLanguage();

  if (screenState === 'loading') {
    return (
      <div className="max-w-lg mx-auto py-6 px-4">
        <LoadingSkeleton type="hub" count={5} />
      </div>
    );
  }

  if (screenState === 'empty') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <EmptyState
          icon="shield_lock"
          title="Privacy Hub Initialized"
          subtitle="No external sharing links or third-party connections are active. Your records are entirely private."
          actionLabel="View Activity Log"
          onAction={() => setCurrentScreen('activity_log')}
        />
      </div>
    );
  }

  if (screenState === 'error') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <ErrorState
          title="Could not load privacy preferences"
          subtitle="Your encrypted records remain secure. Please try refreshing."
          onRetry={() => setScreenState('normal')}
        />
      </div>
    );
  }

  const hubCards = [
    {
      id: 'family_access' as const,
      title: translations.hubCard1Title,
      description: translations.hubCard1Desc,
      icon: 'groups',
      badge: '4 Active',
      color: 'bg-teal-50 text-teal-800 border-teal-200/80'
    },
    {
      id: 'doctor_share' as const,
      title: translations.hubCard2Title,
      description: translations.hubCard2Desc,
      icon: 'link',
      badge: '1 Link',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
    },
    {
      id: 'activity_log' as const,
      title: translations.hubCard3Title,
      description: translations.hubCard3Desc,
      icon: 'history',
      badge: 'Real-time',
      color: 'bg-sky-50 text-sky-800 border-sky-200/80'
    },
    {
      id: 'data_download_delete' as const,
      title: translations.hubCard4Title,
      description: translations.hubCard4Desc,
      icon: 'download',
      badge: 'FHIR / PDF',
      color: 'bg-teal-50 text-teal-800 border-teal-200/80'
    },
    {
      id: 'data_download_delete' as const,
      title: translations.hubCard5Title,
      description: translations.hubCard5Desc,
      icon: 'delete_forever',
      badge: 'Irreversible',
      color: 'bg-rose-50 text-rose-800 border-rose-200/80',
      isDestructive: true
    }
  ];

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-4 space-y-5">
      {/* Reassurance Banner */}
      <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 rounded-2xl p-5 text-white shadow-lg space-y-3 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-teal-100">
              <span className="material-symbols-outlined text-[15px]">verified_user</span>
              <span>Patient Privacy Shield</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-snug">
              {translations.hubTitle}
            </h1>
            <p className="text-xs text-teal-100 leading-relaxed max-w-sm">
              {translations.hubReassurance}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shrink-0">
            <span className="material-symbols-outlined text-[28px]">lock</span>
          </div>
        </div>
      </div>

      {/* Five Primary Hub Cards with Icon, One-Line Description and Arrow */}
      <div className="space-y-3">
        {hubCards.map((card, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentScreen(card.id)}
            className={`w-full text-left bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-xs active:scale-[0.99] group ${
              card.isDestructive
                ? 'border-rose-200/70 hover:border-rose-300 hover:shadow-rose-500/5'
                : 'border-slate-200/80 hover:border-teal-300 hover:shadow-teal-500/5'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 shadow-xs ${card.color}`}
                >
                  <span className="material-symbols-outlined text-[22px]">{card.icon}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <h2
                      className={`text-sm font-bold truncate leading-tight ${
                        card.isDestructive ? 'text-rose-900' : 'text-slate-900 group-hover:text-teal-800'
                      }`}
                    >
                      {card.title}
                    </h2>
                    {card.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          card.isDestructive
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-teal-50 text-teal-800 border border-teal-200/60'
                        }`}
                      >
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5 font-normal">
                    {card.description}
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-teal-700 group-hover:translate-x-1 transition-all text-[20px] shrink-0">
                chevron_right
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Security Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
          <span className="material-symbols-outlined text-teal-700 text-[20px]">tune</span>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {translations.quickSecurityControls}
          </h2>
        </div>

        {/* Setting 1: Auto-lock after 2 minutes */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-xs font-bold text-slate-900">{translations.autoLockTitle}</span>
            <span className="text-[11px] text-slate-500 mt-0.5 leading-normal">
              {translations.autoLockDesc}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAutoLockEnabled(!autoLockEnabled)}
            className={`min-w-[48px] h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              autoLockEnabled ? 'bg-teal-700' : 'bg-slate-300'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform top-1 absolute ${
                autoLockEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Setting 2: Biometric unlock */}
        <div className="flex items-start justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-xs font-bold text-slate-900">{translations.biometricTitle}</span>
            <span className="text-[11px] text-slate-500 mt-0.5 leading-normal">
              {translations.biometricDesc}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setBiometricsEnabled(!biometricsEnabled)}
            className={`min-w-[48px] h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              biometricsEnabled ? 'bg-teal-700' : 'bg-slate-300'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform top-1 absolute ${
                biometricsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Setting 3: Mask sensitive diagnoses by default */}
        <div className="flex items-start justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-xs font-bold text-slate-900">{translations.maskSensitiveTitle}</span>
            <span className="text-[11px] text-slate-500 mt-0.5 leading-normal">
              {translations.maskSensitiveDesc}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMaskSensitiveByDefault(!maskSensitiveByDefault)}
            className={`min-w-[48px] h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              maskSensitiveByDefault ? 'bg-teal-700' : 'bg-slate-300'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform top-1 absolute ${
                maskSensitiveByDefault ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Manual Lock Now Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={triggerAutoLock}
            className="w-full min-h-[44px] rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-teal-700">lock</span>
            <span>Lock Screen Immediately</span>
          </button>
        </div>
      </div>

      {/* Calm data protection notice */}
      <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200/60 flex items-start gap-3">
        <span className="material-symbols-outlined text-teal-700 text-[20px] shrink-0 mt-0.5">
          privacy_tip
        </span>
        <p className="text-xs text-slate-600 leading-relaxed">
          Synvora follows Indian Digital Health guidelines (ABDM) and international health record privacy principles. Your data is stored in encrypted facilities located in India.
        </p>
      </div>
    </div>
  );
};
