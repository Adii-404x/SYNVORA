import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ScreenId, ScreenState } from '../../types';

export const GlobalSwitcher: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    screenState,
    setScreenState,
    triggerAutoLock,
    autoLockEnabled,
    setAutoLockEnabled,
    maskSensitiveByDefault,
    setMaskSensitiveByDefault
  } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);

  const screens: { id: ScreenId; label: string; badge?: string }[] = [
    { id: 'consent_onboarding', label: '1. Onboarding Consent', badge: 'Req #1' },
    { id: 'privacy_hub', label: '2. Privacy & Security Hub', badge: 'Req #2' },
    { id: 'secure_signin', label: '3. Secure Sign-In & OTP', badge: 'Req #3' },
    { id: 'activity_log', label: '4. Activity & Access Log', badge: 'Req #4' },
    { id: 'doctor_share', label: '5. Doctor Share & PIN', badge: 'Req #5' },
    { id: 'family_access', label: '6. Family Access & Roles', badge: 'Req #6' },
    { id: 'data_download_delete', label: '7. Data Download & Delete', badge: 'Req #7' },
    { id: 'upload', label: '8a. Upload & Privacy Banner', badge: 'Req #8' },
    { id: 'session_expired', label: '8b. Session Expired Screen', badge: 'Req #8' },
    { id: 'home', label: 'Home Dashboard', badge: 'Portal' },
    { id: 'timeline', label: 'Health Timeline', badge: 'Records' },
    { id: 'report_detail', label: 'Lab Report Breakdown', badge: 'AI Insights' }
  ];

  const states: ScreenState[] = ['normal', 'loading', 'empty', 'error'];

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 z-50">
      {/* Floating Pill Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="min-h-[44px] px-3.5 py-2 rounded-full bg-teal-800 text-white font-bold text-xs shadow-lg shadow-teal-900/25 flex items-center gap-2 hover:bg-teal-900 transition-transform active:scale-95 border border-teal-600/50 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]">tune</span>
        <span>Review Privacy Screens & States</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
      </button>

      {/* Floating Drawer / Modal */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-700 text-[20px]">
                security
              </span>
              <h2 className="text-sm font-bold text-slate-800">Screen & State Inspector</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Test Screen States */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Screen State (Empty, Skeleton, Error)
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl">
              {states.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setScreenState(st)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    screenState === st
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Fast Jumps to All 8 Required Screens */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Jump to Screen
            </label>
            <div className="space-y-1 max-h-56 overflow-y-auto no-scrollbar pr-1">
              {screens.map((sc) => {
                const isActive = currentScreen === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      setCurrentScreen(sc.id);
                      setIsOpen(false);
                    }}
                    className={`w-full min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'bg-teal-50 text-teal-900 border border-teal-300'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate text-left">{sc.label}</span>
                    {sc.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0 ml-1">
                        {sc.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Security Simulator Toggles */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-700 font-medium">Mask Sensitive Diagnoses</span>
              <button
                type="button"
                onClick={() => setMaskSensitiveByDefault(!maskSensitiveByDefault)}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                  maskSensitiveByDefault ? 'bg-teal-700' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform top-1 absolute ${
                    maskSensitiveByDefault ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-700 font-medium">Auto-lock timer</span>
              <button
                type="button"
                onClick={() => setAutoLockEnabled(!autoLockEnabled)}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                  autoLockEnabled ? 'bg-teal-700' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform top-1 absolute ${
                    autoLockEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerAutoLock();
                setIsOpen(false);
              }}
              className="w-full min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">lock</span>
              <span>Test Session Timeout Lock Now</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
