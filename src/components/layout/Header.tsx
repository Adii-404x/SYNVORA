import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const Header: React.FC = () => {
  const { seniorMode, toggleSeniorMode, setCurrentScreen } = useApp();
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
          <img src="/synvora-app-icon.jpeg" alt="" className="size-8 shrink-0 rounded-md object-cover" />
          <span className="min-w-0">
            <strong className="block truncate text-sm font-bold text-teal-900">Synvora</strong>
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
