import { supabaseAdmin } from '../integrations/supabase/client';
import { ApiError } from '../utils/api-error';

export interface TrendPoint {
  date: string;
  value: number;
  unit: string;
  referenceRange: string | null;
  sourceId: string;
}

export class TrendsService {
  async getTestTrends(userId: string, testName: string, from?: string, to?: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('observations')
        .select('observation_date, value, unit, interpretation, fact_id')
        .eq('user_id', userId)
        .ilike('display_name', `%${testName}%`)
        .order('observation_date', { ascending: true });

      if (error) throw new ApiError(500, 'Failed to retrieve trend data', true, error);

      // We only use observations where value is a valid number
      const points: TrendPoint[] = (data || [])
        .filter(obs => obs.value !== null && !isNaN(Number(obs.value)))
        .map(obs => ({
          date: obs.observation_date,
          value: Number(obs.value),
          unit: obs.unit || 'unknown',
          referenceRange: obs.interpretation || null,
          sourceId: obs.fact_id,
        }));

      if (points.length === 0) {
        return { status: 'insufficient_data', data: [] };
      }

      return { status: 'success', data: points };
    } catch (error) {
      throw new ApiError(500, 'Error processing health trends', true, error);
    }
  }
}

export const trendsService = new TrendsService();