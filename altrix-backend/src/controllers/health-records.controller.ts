import { NextFunction, Request, Response } from 'express';
import { verifiedRecordsService } from '../services/verified-records.service';
import { getAuthContext } from '../utils/auth-context';

export class HealthRecordsController {
  async getVerifiedRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, supabase } = getAuthContext(req);
      const records = await verifiedRecordsService.getForUser(supabase, userId);
      return res.status(200).json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  }
}

export const healthRecordsController = new HealthRecordsController();
