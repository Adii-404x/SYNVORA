import { Request, Response, NextFunction } from 'express';
import { copilotService } from '../services/copilot.service';
import { getAuthContext } from '../utils/auth-context';

export class CopilotController {
  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, supabase } = getAuthContext(req);
      const { message, conversationId } = req.body;

      const result = await copilotService.groundedChat(userId, supabase, message, conversationId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const copilotController = new CopilotController();
