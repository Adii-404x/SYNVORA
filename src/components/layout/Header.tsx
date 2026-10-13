import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export const Header: React.FC = () => {
  const { lang, setLang, seniorMode, toggleSeniorMode, setCurrentScreen } = useLanguage();
  const { session, signOut } = useAuth();
  const [signOutError, setSignOutError] = useState('');

  async function handleSignOut() {
    setSignOutError('');
    try {
      await signOut();
    } catch {
      setSignOutError('Sign out could not be completed. Try again.');
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <button type="button" onClick={() => setCurrentScreen('home')} className="flex min-w-0 items-center gap-2.5 text-left">
          <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-md bg-teal-800 text-sm font-bold text-white">A</span>
          <span className="min-w-0">
            <strong className="block truncate text-sm font-bold text-teal-900">Altrix Labs</strong>
            <span className="block truncate text-[11px] text-slate-500">Personal Health Copilot</span>
          </span>
        </button>

        {session && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleSeniorMode}
              aria-pressed={seniorMode}
              aria-label="Toggle larger text"
              className={`min-h-10 min-w-10 rounded-md border px-2 text-sm font-semibold ${seniorMode ? 'border-teal-800 bg-teal-800 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
            >A+</button>
            <div className="hidden sm:flex items-center rounded-md border border-slate-300 p-0.5" role="group" aria-label="Language">
              {(['en', 'hi'] as const).map((language) => (
                <button
                  key={language}
                  type="button"
                  aria-pressed={lang === language}
                  onClick={() => setLang(language)}
                  className={`min-h-8 rounded px-2 text-xs font-semibold ${lang === language ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
                >{language.toUpperCase()}</button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="min-h-10 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >Sign out</button>
          </div>
        )}
      </div>
      {signOutError && <p role="alert" className="px-4 pb-2 text-right text-xs text-rose-700">{signOutError}</p>}
    </header>
  );
};
