import { Request, Response, NextFunction } from 'express';
import { summaryService } from '../services/summary.service';
import { ApiError } from '../utils/api-error';

export class SummaryController {
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const result = await summaryService.generateSummary(userId);

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