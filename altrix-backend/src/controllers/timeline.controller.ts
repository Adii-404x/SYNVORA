import { Request, Response, NextFunction } from 'express';
import { timelineService } from '../services/timeline.service';
import { getAuthContext } from '../utils/auth-context';
import { timelineQuerySchema } from '../schemas/timeline.schema';

export class TimelineController {
  async getTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, supabase } = getAuthContext(req);
      const filters = timelineQuerySchema.parse({ query: req.query }).query;
      const timeline = await timelineService.getTimeline(supabase, userId, filters);

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
