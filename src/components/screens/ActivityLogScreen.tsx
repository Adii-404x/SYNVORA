import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { INITIAL_ACTIVITY_LOGS } from '../../data/mockData';
import { ActivityLogItem } from '../../types';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';

export const ActivityLogScreen: React.FC = () => {
  const { lang, translations, setCurrentScreen, screenState, setScreenState } = useLanguage();
  const [logs, setLogs] = useState<ActivityLogItem[]>(INITIAL_ACTIVITY_LOGS);
  const [filter, setFilter] = useState<'all' | 'doctor' | 'family' | 'system'>('all');
  const [showSecureModal, setShowSecureModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (screenState === 'loading') {
    return (
      <div className="max-w-lg mx-auto py-6 px-4">
        <LoadingSkeleton type="list" count={4} />
      </div>
    );
  }

  if (screenState === 'empty') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <EmptyState
          icon="manage_search"
          title="No Recent Activity"
          subtitle="There have been no recent views or shares of your health records."
          actionLabel="Go to Privacy Hub"
          onAction={() => setCurrentScreen('privacy_hub')}
        />
      </div>
    );
  }

  if (screenState === 'error') {
    return (
      <div className="max-w-lg mx-auto py-10 px-4">
        <ErrorState
          title="Could not load activity log"
          subtitle="Audit records are safely preserved in our encrypted database."
          onRetry={() => setScreenState('normal')}
        />
      </div>
    );
  }

  const filteredLogs = logs.filter((item) => {
    if (filter === 'doctor') return item.actorRole.includes('Doctor') || item.actorRole.includes('Consultant');
    if (filter === 'family') return item.actorRole.includes('Family') || item.actorRole.includes('Self');
    if (filter === 'system') return item.actorRole.includes('System');
    return true;
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSecureAccount = () => {
    // Revoke external authorizations
    setLogs(prev =>
      prev.map(l => (l.status === 'PIN Verified' || l.status === 'Authorized' ? { ...l, status: 'Revoked' } : l))
    );
    setShowSecureModal(false);
    triggerToast(translations.accountSecuredToast);
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* Top Header with Back Button and "Not you? Secure my account" link */}
      <div className="flex items-center justify-between pb-1">
        <button
          type="button"
          onClick={() => setCurrentScreen('privacy_hub')}
          className="min-h-[44px] px-2 flex items-center gap-1 text-teal-800 hover:text-teal-900 font-bold text-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>{translations.backBtn}</span>
        </button>

        {/* Gentle "Not you? Secure my account" link */}
        <button
          type="button"
          onClick={() => setShowSecureModal(true)}
          className="min-h-[44px] px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-[16px] text-amber-700">lock_reset</span>
          <span>{translations.notYouLink}</span>
        </button>
      </div>

      {/* Screen Title & Subtitle */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {translations.activityTitle}
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          {translations.activitySubtitle}
        </p>
      </div>

      {/* Filter Tabs (Interactive clean filter controls) */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: lang === 'hi' ? 'सभी गतिविधियां' : 'All Activity' },
          { id: 'doctor', label: lang === 'hi' ? 'डॉक्टर परामर्श' : 'Doctor Access' },
          { id: 'family', label: lang === 'hi' ? 'परिवार' : 'Family & Self' },
          { id: 'system', label: lang === 'hi' ? 'सुरक्षा नियम' : 'System' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as typeof filter)}
            className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filter === tab.id
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity Log - Simple, Human List (NOT a dense table) */}
      <div className="space-y-3 pt-1">
        {filteredLogs.map((log) => {
          const isDoc = log.actorRole.includes('Doctor') || log.actorRole.includes('Consultant');
          const isSys = log.actorRole.includes('System');

          return (
            <article
              key={log.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2.5 transition-all hover:border-slate-300"
            >
              {/* Row 1: Actor & Status Pill */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isDoc
                        ? 'bg-teal-50 text-teal-800 border border-teal-200/60'
                        : isSys
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isDoc ? 'stethoscope' : isSys ? 'settings_suggest' : 'person'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {log.actor}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate">{log.actorRole}</span>
                  </div>
                </div>

                {/* Status Pill */}
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 flex items-center gap-1 ${
                    log.status === 'Authorized'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/70'
                      : log.status === 'PIN Verified'
                      ? 'bg-teal-50 text-teal-800 border border-teal-200/70'
                      : log.status === 'Revoked'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200/70'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      log.status === 'Authorized'
                        ? 'bg-emerald-600'
                        : log.status === 'PIN Verified'
                        ? 'bg-teal-600'
                        : log.status === 'Revoked'
                        ? 'bg-rose-500'
                        : 'bg-slate-400'
                    }`}
                  ></span>
                  <span>{log.status}</span>
                </span>
              </div>

              {/* Action and record */}
              <div className="text-xs text-slate-800 font-medium pl-1 leading-snug">
                {log.action}: <strong className="text-slate-900">{log.recordTitle}</strong>
              </div>

              {/* Row 2: Date, Time & Device Info with unboxed typographic separators */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">
                    schedule
                  </span>
                  <span>{log.timestamp}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">
                    devices
                  </span>
                  <span className="truncate">{log.device}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Reassurance note */}
      <div className="text-center pt-2">
        <p className="text-[11px] text-slate-400">
          {lang === 'hi'
            ? 'गतिविधि रिकॉर्ड्स स्थायी रूप से 180 दिनों तक रखे जाते हैं।'
            : 'Access logs are tamper-evident and preserved for 180 days under health privacy rules.'}
        </p>
      </div>

      {/* "Not you? Secure my account" Modal Sheet */}
      {showSecureModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden -mt-2 mb-2"></div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">shield_person</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {translations.secureAccountModalTitle}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {lang === 'hi' ? 'त्वरित सुरक्षा उपाय' : 'Immediate Access Protection'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSecureModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {translations.secureAccountModalDesc}
            </p>

            <div className="space-y-2 pt-1">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2.5 text-xs text-slate-700">
                <span className="material-symbols-outlined text-teal-700 text-[18px]">check</span>
                <span>{translations.revokeAllLinksBtn}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2.5 text-xs text-slate-700">
                <span className="material-symbols-outlined text-teal-700 text-[18px]">check</span>
                <span>{translations.logOutOtherDevicesBtn}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2.5 text-xs text-slate-700">
                <span className="material-symbols-outlined text-teal-700 text-[18px]">check</span>
                <span>{translations.requireOtpNextTimeBtn}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSecureAccount}
                className="w-full min-h-[48px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md shadow-teal-700/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">security</span>
                <span>{lang === 'hi' ? 'मेरा खाता तुरंत सुरक्षित करें' : 'Secure My Account Now'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSecureModal(false)}
                className="w-full min-h-[44px] rounded-xl bg-transparent text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                {translations.cancelBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Confirmation Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-3 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom duration-200">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
