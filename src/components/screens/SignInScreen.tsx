import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export const SignInScreen: React.FC = () => {
  const { configured, configurationMessage, signIn, signInDemo, signUp } = useAuth();
  const judgeDemoEmail = import.meta.env.VITE_JUDGE_DEMO_EMAIL?.trim() || 'alex.morgan@example.com';
  const judgeDemoPassword = import.meta.env.VITE_JUDGE_DEMO_PASSWORD?.trim() || 'DemoTrial2026!';
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function handleDemoSignIn() {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await signInDemo();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Demo sign in could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (isSignUp) {
        const hasSession = await signUp(email.trim(), password);
        setNotice(hasSession
          ? 'Your account is ready.'
          : 'Check your email to confirm your account, then sign in.');
      } else {
        await signIn(email.trim(), password);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Authentication could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="text-center mb-6">
          <img src="/synvora-app-icon.jpeg" alt="" className="mx-auto mb-4 size-16 rounded-xl object-cover shadow-xs" />
          <h1 className="text-2xl font-bold text-slate-900">{isSignUp ? 'Create your account' : 'Sign in to Synvora'}</h1>
          <p className="text-sm text-slate-600 mt-1.5">Your private health records and source-grounded care copilot.</p>
        </div>

        {configurationMessage && (
          <div role="status" className="mb-4 rounded-xl border border-teal-200 bg-teal-50/80 p-3 text-xs text-teal-950 flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-700 text-[18px]">verified_user</span>
            <span>{configurationMessage}</span>
          </div>
        )}
        {error && <div role="alert" className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}
        {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</div>}

        {!isSignUp && (
          <div className="mb-5 rounded-xl border-2 border-teal-600/30 bg-gradient-to-b from-teal-50/70 to-emerald-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-900">
                <span className="material-symbols-outlined text-[16px] text-teal-700">stars</span>
                Evaluation & Demo Mode
              </span>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-full">One-click</span>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleDemoSignIn()}
              className="w-full min-h-11 rounded-lg bg-teal-800 px-4 text-sm font-bold text-white hover:bg-teal-900 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">play_circle</span>
              <span>{busy ? 'Authenticating…' : 'One-Click Demo Sign In (Alex Morgan)'}</span>
            </button>
            <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-teal-200/50">
              <span className="truncate text-slate-500 font-mono text-[11px]">alex.morgan@example.com</span>
              <button
                type="button"
                onClick={() => {
                  setEmail(judgeDemoEmail);
                  setPassword(judgeDemoPassword);
                  setError('');
                }}
                className="font-medium text-teal-800 hover:text-teal-950 underline underline-offset-2 ml-2 shrink-0"
              >
                Autofill
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold text-slate-800">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full min-h-12 rounded-lg border border-slate-300 bg-white px-3 text-base font-normal text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-800">
            Password
            <input
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
              minLength={isSignUp ? 8 : 1}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full min-h-12 rounded-lg border border-slate-300 bg-white px-3 text-base font-normal text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
            {isSignUp && <span className="mt-1 block text-xs font-normal text-slate-500">Use at least 8 characters.</span>}
          </label>
          <button
            type="submit"
            disabled={!configured || busy}
            className="w-full min-h-12 rounded-lg bg-teal-800 px-4 font-semibold text-white hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          {isSignUp ? 'Already registered?' : 'New to Synvora?'}{' '}
          <button
            type="button"
            onClick={() => { setIsSignUp((value) => !value); setError(''); setNotice(''); }}
            className="font-semibold text-teal-800 underline underline-offset-2"
          >
            {isSignUp ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </section>
    </main>
  );
};
