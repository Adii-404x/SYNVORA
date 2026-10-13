import { Request, Response, NextFunction } from 'express';
import { copilotService } from '../services/copilot.service';
import { ApiError } from '../utils/api-error';

export class CopilotController {
  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const { message, conversationId } = req.body;

      if (!message) throw new ApiError(400, 'Message is required');

      const result = await copilotService.groundedChat(userId, message, conversationId);

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