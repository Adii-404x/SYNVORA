import { Request } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      supabase?: SupabaseClient;
    }
  }
}