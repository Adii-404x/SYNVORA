import { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../utils/api-error';
import { verifiedRecordsService } from './verified-records.service';

export interface TrendPoint {
  date: string;
  value: number;
  unit: string;
  referenceRange: string | null;
  sourceId: string;
}

export class TrendsService {
  async getTestTrends(
    supabase: SupabaseClient,
    userId: string,
    testName: string,
    from?: string,
    to?: string,
  ) {
    try {
      const records = await verifiedRecordsService.getForUser(supabase, userId);
      const matching = records.observations.filter((observation) =>
        observation.name.trim().toLocaleLowerCase() === testName.trim().toLocaleLowerCase());
      const fromTime = from ? Date.parse(from) : undefined;
      const toTime = to ? Date.parse(to) : undefined;
      const inRange = matching.filter((observation) => {
        const timestamp = Date.parse(observation.date);
        return (fromTime === undefined || timestamp >= fromTime)
          && (toTime === undefined || timestamp <= toTime);
      });

      const numeric = inRange.filter((observation) => {
        return observation.value !== null && Number.isFinite(Number(observation.value));
      });
      if (numeric.length === 0) return { status: 'insufficient_data' as const, data: [] as TrendPoint[] };

      const units = new Set(numeric.map((observation) => observation.unit?.trim() ?? ''));
      if (units.size !== 1 || units.has('')) {
        return { status: 'incompatible_units' as const, data: [] as TrendPoint[] };
      }

      const unit = [...units][0];
      const data = numeric
        .map((observation): TrendPoint => ({
          date: observation.date,
          value: Number(observation.value),
          unit,
          referenceRange: observation.referenceRange,
          sourceId: observation.factId,
        }))
        .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

      return { status: 'success' as const, data };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Error processing health trends', true, error);
    }
  }
}

export const trendsService = new TrendsService();
