import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { APP_ASSETS } from '../../data/mockData';

export const Header: React.FC = () => {
  const {
    lang,
    setLang,
    seniorMode,
    toggleSeniorMode,
    setCurrentScreen,
    triggerAutoLock,
    autoLockCountdown,
    autoLockEnabled
  } = useLanguage();

  return (
    <header className="sticky top-0 w-full z-40 bg-[#FAF8FF]/90 backdrop-blur-xl border-b border-emerald-100/70 shadow-xs">
      <div className="max-w-6xl mx-auto h-16 px-4 flex items-center justify-between gap-3">
        {/* Brand Lockup */}
        <div
          onClick={() => setCurrentScreen('home')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <img
            src={APP_ASSETS.logo}
            alt="Altrix Lab Logo"
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <div className="flex flex-col">
            <span className="text-base font-extrabold text-teal-800 leading-none tracking-tight">
              Altrix Lab
            </span>
            <span className="text-[11px] font-medium text-slate-500 mt-0.5">
              {lang === 'hi' ? 'रोगी स्वास्थ्य पोर्टल' : 'Patient Health Portal'}
            </span>
          </div>
        </div>

        {/* Right actions: Senior A+, Lang toggle EN/HI, Auto-lock indicator, Profile */}
        <div className="flex items-center gap-2">
          {/* Auto-lock countdown pill (interactive test trigger) */}
          {autoLockEnabled && (
            <button
              type="button"
              onClick={triggerAutoLock}
              title="Click to trigger auto-lock immediately"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-[11px] font-semibold hover:bg-teal-100 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px] text-teal-700">lock_clock</span>
              <span>
                {Math.floor(autoLockCountdown / 60)}:{(autoLockCountdown % 60).toString().padStart(2, '0')}
              </span>
            </button>
          )}

          {/* Senior Font Resizer A+ */}
          <button
            type="button"
            onClick={toggleSeniorMode}
            aria-label="Increase text size"
            className={`min-h-[44px] min-w-[44px] px-2.5 py-1 rounded-full flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
              seniorMode
                ? 'bg-teal-700 text-white font-bold shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/70 text-teal-900 font-semibold'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">text_fields</span>
            <span className="text-xs font-bold">A+</span>
          </button>

          {/* Bilingual Switcher EN / हिन्दी */}
          <div className="flex items-center bg-emerald-50/80 p-0.5 rounded-full border border-emerald-200/70">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`min-h-[40px] px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                lang === 'en'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-teal-800'
              }`}
            >
              EN
            </button>
            <span className="text-emerald-300 px-0.5 text-xs font-bold">/</span>
            <button
              type="button"
              onClick={() => setLang('hi')}
              className={`min-h-[40px] px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                lang === 'hi'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-teal-800'
              }`}
            >
              हिन्दी
            </button>
          </div>

          {/* Profile Switcher & Health Locker */}
          <button
            type="button"
            onClick={() => setCurrentScreen('privacy_hub')}
            aria-label="Patient Profile and Privacy Hub"
            className="min-h-[44px] pl-1 pr-3 py-1 flex items-center gap-2 rounded-full bg-white border border-emerald-100 hover:border-emerald-300 shadow-xs transition-all max-w-[160px] cursor-pointer"
          >
            <div className="relative shrink-0">
              <img
                src={APP_ASSETS.sunitaAvatar}
                alt="Sunita Sharma"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/80"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
            </div>
            <div className="hidden sm:flex flex-col items-start min-w-0 text-left">
              <span className="text-xs font-bold text-slate-800 truncate leading-tight w-20">
                Sunita S.
              </span>
              <span className="text-[10px] text-teal-700 font-semibold leading-none">
                52y • Self
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
