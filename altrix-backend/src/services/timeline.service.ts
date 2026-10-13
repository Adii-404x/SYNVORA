import { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../utils/api-error';
import { verifiedRecordsService } from './verified-records.service';

export interface TimelineEntry {
  id: string;
  type: 'document' | 'observation' | 'medication';
  date: string;
  title: string;
  status: string;
  sourceId?: string;
}

interface TimelineFilters {
  from?: string;
  to?: string;
  type?: 'document' | 'observation' | 'medication';
  limit: number;
  cursor?: string;
}

interface DocumentRow {
  id: string;
  uploaded_at: string;
  file_name: string;
  processing_status: string;
}

export class TimelineService {
  async getTimeline(supabase: SupabaseClient, userId: string, filters: TimelineFilters) {
    try {
      const entries: TimelineEntry[] = [];

      if (!filters.type || filters.type === 'document') {
        let query = supabase
          .from('health_documents')
          .select('id, uploaded_at, file_name, processing_status')
          .eq('user_id', userId);
        if (filters.from) query = query.gte('uploaded_at', filters.from);
        if (filters.to) query = query.lte('uploaded_at', filters.to);
        const { data, error } = await query;
        if (error) throw new ApiError(500, 'Failed to retrieve timeline documents');
        for (const document of (data ?? []) as DocumentRow[]) {
          entries.push({
            id: document.id,
            type: 'document',
            date: document.uploaded_at,
            title: document.file_name,
            status: document.processing_status,
          });
        }
      }

      if (!filters.type || filters.type === 'observation' || filters.type === 'medication') {
        const records = await verifiedRecordsService.getForUser(supabase, userId);
        if (!filters.type || filters.type === 'observation') {
          for (const observation of records.observations) {
            entries.push({
              id: observation.id,
              type: 'observation',
              date: observation.date,
              title: observation.name,
              status: 'verified',
              sourceId: observation.factId,
            });
          }
        }
        if (!filters.type || filters.type === 'medication') {
          for (const medication of records.medications) {
            if (!medication.startDate) continue;
            entries.push({
              id: medication.id,
              type: 'medication',
              date: medication.startDate,
              title: medication.name,
              status: 'verified',
              sourceId: medication.factId,
            });
          }
        }
      }

      const from = filters.from ? Date.parse(filters.from) : undefined;
      const to = filters.to ? Date.parse(filters.to) : undefined;
      const cursor = filters.cursor ? Date.parse(filters.cursor) : undefined;

      return entries
        .filter((entry) => {
          const timestamp = Date.parse(entry.date);
          return (from === undefined || timestamp >= from)
            && (to === undefined || timestamp <= to)
            && (cursor === undefined || timestamp < cursor);
        })
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
        .slice(0, filters.limit);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to generate health timeline', true, error);
    }
  }
}

export const timelineService = new TimelineService();
