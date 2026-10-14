import { createClient, Session, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

function isConfigured() {
  if (!supabaseUrl || !publishableKey || supabaseUrl.includes('your-project-ref')) return false;
  try {
    return ['http:', 'https:'].includes(new URL(supabaseUrl).protocol);
  } catch {
    return false;
  }
}

export const isRealSupabaseConfigured = isConfigured();
export const supabaseConfigured = true; // Enabled via in-memory mock fallback in sandbox
export const apiConfigured = true;

export const configurationMessage = !isRealSupabaseConfigured
  ? 'Running in local preview mode with synthetic patient records.'
  : '';

// In-memory mock client for preview mode
const listeners = new Set<(event: string, session: Session | null) => void>();

export const DEMO_USER_ID = 'usr-demo-synvora-001';
export const STORAGE_KEY = 'synvora_demo_session';

export function createMockSession(email = 'alex.morgan@example.com', fullName = 'Alex Morgan'): Session {
  const user: User = {
    id: DEMO_USER_ID,
    app_metadata: { provider: 'email', altrix_demo: true },
    user_metadata: { full_name: fullName },
    aud: 'authenticated',
    confirmation_sent_at: new Date().toISOString(),
    recovery_sent_at: undefined,
    email_change_sent_at: undefined,
    new_email: undefined,
    invited_at: undefined,
    action_link: undefined,
    email,
    phone: '',
    created_at: '2026-09-15T09:00:00.000Z',
    confirmed_at: '2026-09-15T09:00:00.000Z',
    last_sign_in_at: new Date().toISOString(),
    role: 'authenticated',
    updated_at: new Date().toISOString(),
    identities: [],
    is_anonymous: false,
    factors: [],
  };

  return {
    access_token: 'mock-jwt-token-synvora-preview',
    token_type: 'bearer',
    expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    refresh_token: 'mock-refresh-token-preview',
    user,
  };
}

let inMemorySession: Session | null = (() => {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw) return JSON.parse(raw) as Session;
  } catch {
    // fallback to demo session
  }
  return createMockSession('alex.morgan@example.com');
})();

export function setMockSession(session: Session | null, event = 'SIGNED_IN') {
  inMemorySession = session;
  try {
    if (typeof window !== 'undefined') {
      if (session) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch {
    // ignore storage error
  }
  listeners.forEach((callback) => callback(event, inMemorySession));
}

const mockSupabase = {
  auth: {
    async getSession() {
      return { data: { session: inMemorySession }, error: null };
    },
    async getUser() {
      return { data: { user: inMemorySession?.user ?? null }, error: null };
    },
    onAuthStateChange(callback: (event: string, session: Session | null) => void) {
      listeners.add(callback);
      // Notify immediately with current state
      setTimeout(() => callback('INITIAL_SESSION', inMemorySession), 0);
      return {
        data: {
          subscription: {
            unsubscribe: () => listeners.delete(callback),
          },
        },
      };
    },
    async signInWithPassword({ email }: { email: string; password?: string }) {
      const session = createMockSession(email);
      setMockSession(session, 'SIGNED_IN');
      return { data: { session, user: session.user }, error: null };
    },
    async signUp({ email }: { email: string; password?: string; options?: unknown }) {
      const session = createMockSession(email);
      setMockSession(session, 'SIGNED_IN');
      return { data: { session, user: session.user }, error: null };
    },
    async signOut() {
      setMockSession(null, 'SIGNED_OUT');
      return { error: null };
    },
  },
  from() {
    return {
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      upsert: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    };
  },
  storage: {
    from() {
      return {
        getPublicUrl: (path: string) => ({ data: { publicUrl: path } }),
        createSignedUrl: (path: string) => Promise.resolve({ data: { signedUrl: path }, error: null }),
      };
    },
  },
};

export const supabase = isRealSupabaseConfigured
  ? createClient(supabaseUrl!, publishableKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : (mockSupabase as unknown as ReturnType<typeof createClient>);

