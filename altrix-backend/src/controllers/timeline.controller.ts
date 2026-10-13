import { Request, Response, NextFunction } from 'express';
import { timelineService } from '../services/timeline.service';
import { ApiError } from '../utils/api-error';

export class TimelineController {
  async getTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const filters = req.query as any;
      
      const timeline = await timelineService.getTimeline(userId, {
        from: filters.from,
        to: filters.to,
        type: filters.type,
        limit: parseInt(filters.limit as string) || 20,
        cursor: filters.cursor,
      });

      return res.status(200).json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const timelineController = new TimelineController();