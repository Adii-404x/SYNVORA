import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export const SignInScreen: React.FC = () => {
  const { configured, configurationMessage, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

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
        <div className="text-center mb-7">
          <span aria-hidden="true" className="mx-auto mb-4 grid size-12 place-items-center rounded-lg bg-teal-800 text-xl font-bold text-white">A</span>
          <h1 className="text-2xl font-bold text-slate-900">{isSignUp ? 'Create your account' : 'Sign in to Altrix Labs'}</h1>
          <p className="text-sm text-slate-600 mt-2">Your health records stay scoped to your authenticated account.</p>
        </div>

        {!configured && (
          <div role="alert" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            {configurationMessage}
          </div>
        )}
        {error && <div role="alert" className="mb-5 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}
        {notice && <div role="status" className="mb-5 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</div>}

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
          {isSignUp ? 'Already registered?' : 'New to Altrix Labs?'}{' '}
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
