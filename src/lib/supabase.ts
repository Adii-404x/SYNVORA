import { createClient } from '@supabase/supabase-js';

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

export const supabaseConfigured = isConfigured();
export const apiConfigured = (() => {
  if (!apiBaseUrl) return false;
  try {
    const url = new URL(apiBaseUrl);
    return ['http:', 'https:'].includes(url.protocol) && url.pathname.replace(/\/$/, '').endsWith('/api');
  } catch {
    return false;
  }
})();
export const configurationMessage = !supabaseConfigured
  ? import.meta.env.PROD
    ? 'This deployment is missing its Supabase settings. In Vercel, open Project Settings → Environment Variables and set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY for Production, then redeploy.'
    : 'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.'
  : !apiConfigured
    ? import.meta.env.PROD
      ? 'This deployment is missing its API URL. In Vercel, set VITE_API_BASE_URL to your hosted backend URL ending in /api, then redeploy.'
      : 'Set VITE_API_BASE_URL to the backend API origin ending in /api.'
    : '';
export const supabase = supabaseConfigured
  ? createClient(supabaseUrl!, publishableKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;
