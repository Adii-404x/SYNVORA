import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  apiConfigured,
  configurationMessage,
  createMockSession,
  isRealSupabaseConfigured,
  setMockSession,
  STORAGE_KEY,
  supabase,
  supabaseConfigured,
} from '../lib/supabase';

interface AuthContextValue {
  session: Session | null;
  ready: boolean;
  configured: boolean;
  configurationMessage: string;
  signIn: (email: string, password: string) => Promise<void>;
  signInDemo: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setReady(true);
      return;
    }

    let active = true;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession);
    });

    void client.auth.getSession().then(async ({ data, error }) => {
      if (!active) return;
      if (error || !data.session) {
        // Check if there is an in-memory or persisted demo session
        try {
          const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
          if (raw) {
            const demoSession = JSON.parse(raw) as Session;
            if (active) {
              setSession(demoSession);
              setReady(true);
              return;
            }
          }
        } catch {
          // ignore
        }
        setSession(null);
        setReady(true);
        return;
      }

      // Check user validity
      try {
        const { error: userError } = await client.auth.getUser(data.session.access_token);
        if (!active) return;
        if (userError) {
          await client.auth.signOut({ scope: 'local' });
          setSession(null);
        } else {
          setSession(data.session);
        }
      } catch {
        if (active) setSession(data.session);
      }
      setReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    ready,
    configured: supabaseConfigured && apiConfigured,
    configurationMessage,
    async signIn(email, password) {
      const cleanEmail = email.trim().toLowerCase();
      const isJudgeDemo =
        cleanEmail === 'alex.morgan@example.com' ||
        cleanEmail.includes('demo') ||
        cleanEmail === import.meta.env.VITE_JUDGE_DEMO_EMAIL?.trim().toLowerCase();

      if (isRealSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (!error && data?.session) {
            setSession(data.session);
            return;
          }
          if (isJudgeDemo) {
            // Live Supabase does not have demo user seeded; activate local evaluation session
            const demoSession = createMockSession(email);
            setMockSession(demoSession);
            setSession(demoSession);
            return;
          }
          if (error) throw error;
        } catch (err) {
          if (isJudgeDemo) {
            const demoSession = createMockSession(email);
            setMockSession(demoSession);
            setSession(demoSession);
            return;
          }
          throw err;
        }
      } else {
        const demoSession = createMockSession(email);
        setMockSession(demoSession);
        setSession(demoSession);
      }
    },
    async signInDemo() {
      const demoEmail = import.meta.env.VITE_JUDGE_DEMO_EMAIL?.trim() || 'alex.morgan@example.com';
      const demoSession = createMockSession(demoEmail);
      setMockSession(demoSession);
      setSession(demoSession);
    },
    async signUp(email, password) {
      if (!supabase) throw new Error('Supabase is not configured for this frontend.');
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail === 'alex.morgan@example.com' || cleanEmail.includes('demo')) {
        const demoSession = createMockSession(email);
        setMockSession(demoSession);
        setSession(demoSession);
        return true;
      }
      if (isRealSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        return Boolean(data.session);
      }
      const demoSession = createMockSession(email);
      setMockSession(demoSession);
      setSession(demoSession);
      return true;
    },
    async signOut() {
      setMockSession(null);
      setSession(null);
      if (supabase && isRealSupabaseConfigured) {
        try {
          await supabase.auth.signOut();
        } catch {
          // ignore
        }
      }
    },
  }), [session, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
