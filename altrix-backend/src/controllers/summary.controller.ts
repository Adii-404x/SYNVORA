import { Request, Response, NextFunction } from 'express';
import { summaryService } from '../services/summary.service';
import { getAuthContext } from '../utils/auth-context';

export class SummaryController {
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, supabase } = getAuthContext(req);
      const result = await summaryService.generateSummary(userId, supabase);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const summaryController = new SummaryController();
