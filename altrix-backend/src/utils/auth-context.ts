import { Request } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from './api-error';

export function getAuthContext(req: Request): { userId: string; supabase: SupabaseClient } {
  if (!req.userId || !req.supabase) {
    throw new ApiError(401, 'User not authenticated');
  }

  return { userId: req.userId, supabase: req.supabase };
}
