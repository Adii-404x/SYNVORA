import { Request, Response, NextFunction } from 'express';
import { getAuthContext } from '../utils/auth-context';
import { ApiError } from '../utils/api-error';

export class ConversationsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, supabase } = getAuthContext(req);
      const { data, error } = await supabase
        .from('copilot_conversations')
        .select('id, title, started_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error) throw new ApiError(500, 'Failed to retrieve conversations');
      return res.status(200).json({ success: true, data: data ?? [] });
    } catch (error) {
      next(error);
    }
  }

  async messages(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, supabase } = getAuthContext(req);
      const { conversationId } = req.params;
      const { data: conversation, error: conversationError } = await supabase
        .from('copilot_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .maybeSingle();
      if (conversationError) throw new ApiError(500, 'Failed to retrieve conversation');
      if (!conversation) throw new ApiError(404, 'Conversation not found');

      const { data, error } = await supabase
        .from('copilot_messages')
        .select('id, role, content, citations, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw new ApiError(500, 'Failed to retrieve conversation messages');
      return res.status(200).json({ success: true, data: (data ?? []).reverse() });
    } catch (error) {
      next(error);
    }
  }
}

export const conversationsController = new ConversationsController();
