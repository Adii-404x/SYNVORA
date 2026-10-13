import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { conversationsController } from '../controllers/conversations.controller';

const router = Router();
const conversationParamsSchema = z.object({
  params: z.object({ conversationId: z.string().uuid() }),
});

router.get('/', authenticate, conversationsController.list);
router.get('/:conversationId/messages', authenticate, validate(conversationParamsSchema), conversationsController.messages);

export default router;
