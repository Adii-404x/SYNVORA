import { NextFunction, Request, Response } from 'express';
import { factsService } from '../services/facts.service';
import { getAuthContext } from '../utils/auth-context';
import { ApiError } from '../utils/api-error';

function getFactId(req: Request): string {
  const factId = req.params.factId;
  if (typeof factId !== 'string') throw new ApiError(400, 'Invalid candidate fact identifier');
  return factId;
}

export class FactsController {
  async listPending(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, supabase } = getAuthContext(req);
      const data = await factsService.listPending(supabase, userId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const { supabase } = getAuthContext(req);
      const result = await factsService.review(
        supabase,
        getFactId(req),
        'confirm',
        typeof req.body?.observationDate === 'string' ? req.body.observationDate : undefined,
      );
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const { supabase } = getAuthContext(req);
      const result = await factsService.review(supabase, getFactId(req), 'reject');
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const factsController = new FactsController();
