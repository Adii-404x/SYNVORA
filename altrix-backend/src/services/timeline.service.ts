import { supabaseAdmin } from '../integrations/supabase/client';
import { ApiError } from '../utils/api-error';

export interface TimelineEntry {
  id: string;
  type: 'document' | 'observation' | 'medication';
  date: string;
  title: string;
  status: string;
  sourceId?: string;
}

export class TimelineService {
  async getTimeline(userId: string, filters: { from?: string, to?: string, type?: string, limit: number, cursor?: string }) {
    try {
      const entries: TimelineEntry[] = [];

      // 1. Fetch Documents
      let docQuery = supabaseAdmin
        .from('health_documents')
        .select('id, uploaded_at as date, file_name as title, processing_status as status')
        .eq('user_id', userId);
      
      if (filters.type && filters.type !== 'document') docQuery = docQuery.eq('id', '00000000-0000-0000-0000-000000000000'); // Effectively filter out
      if (filters.from) docQuery = docQuery.gte('uploaded_at', filters.from);
      if (filters.to) docQuery = docQuery.lte('uploaded_at', filters.to);
      
      const { data: docs } = await docQuery;
      docs?.forEach(d => entries.push({ id: d.id, type: 'document', date: d.date, title: d.title, status: d.status }));

      // 2. Fetch Observations
      let obsQuery = supabaseAdmin
        .from('observations')
        .select('id, observation_date as date, display_name as title, verified_at as status, fact_id as sourceId')
        .eq('user_id', userId);
      
      if (filters.type && filters.type !== 'observation') obsQuery = obsQuery.eq('id', '00000000-0000-0000-0000-000000000000');
      if (filters.from) obsQuery = obsQuery.gte('observation_date', filters.from);
      if (filters.to) obsQuery = obsQuery.lte('observation_date', filters.to);
      
      const { data: obs } = await obsQuery;
      obs?.forEach(o => entries.push({ id: o.id, type: 'observation', date: o.date, title: o.title, status: 'verified', sourceId: o.sourceId }));

      // 3. Fetch Medications
      let medQuery = supabaseAdmin
        .from('medications')
        .select('id, start_date as date, drug_name as title, verified_at as status, fact_id as sourceId')
        .eq('user_id', userId);
      
      if (filters.type && filters.type !== 'medication') medQuery = medQuery.eq('id', '00000000-0000-0000-0000-000000000000');
      if (filters.from) medQuery = medQuery.gte('start_date', filters.from);
      if (filters.to) medQuery = medQuery.lte('start_date', filters.to);
      
      const { data: meds } = await medQuery;
      meds?.forEach(m => entries.push({ id: m.id, type: 'medication', date: m.date, title: m.title, status: 'verified', sourceId: m.sourceId }));

      // Sort chronologically descending
      return entries
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, filters.limit);
    } catch (error) {
      throw new ApiError(500, 'Failed to generate health timeline', true, error);
    }
  }
}

export const timelineService = new TimelineService();