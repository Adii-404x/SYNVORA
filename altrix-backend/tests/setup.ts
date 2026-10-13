import { vi } from 'vitest';

vi.mock('../src/config/env', () => ({
  env: {
    SUPABASE_URL: 'https://mock.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'mock-pub-key',
    SUPABASE_SERVICE_ROLE_KEY: 'mock-service-key',
    OLLAMA_BASE_URL: 'http://localhost:11434',
    OLLAMA_MODEL: 'gemma2',
  }
}));