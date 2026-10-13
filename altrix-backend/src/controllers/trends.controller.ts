import { Request, Response, NextFunction } from 'express';
import { trendsService } from '../services/trends.service';
import { getAuthContext } from '../utils/auth-context';
import { trendsQuerySchema } from '../schemas/trends.schema';

export class TrendsController {
  async getTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, supabase } = getAuthContext(req);
      const { query } = trendsQuerySchema.parse({ query: req.query });
      const result = await trendsService.getTestTrends(supabase, userId, query.testName, query.from, query.to);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const trendsController = new TrendsController();
