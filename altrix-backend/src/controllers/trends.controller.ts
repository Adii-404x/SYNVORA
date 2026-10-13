import { Request, Response, NextFunction } from 'express';
import { trendsService } from '../services/trends.service';
import { ApiError } from '../utils/api-error';

export class TrendsController {
  async getTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const { testName } = req.query;

      if (!testName) throw new ApiError(400, 'Test name is required');

      const result = await trendsService.getTestTrends(userId, testName as string);

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