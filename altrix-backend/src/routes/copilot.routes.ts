import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { copilotController } from '../controllers/copilot.controller';
import { chatSchema } from '../schemas/copilot.schema';

const router = Router();

router.post('/chat', authenticate, validate(chatSchema), copilotController.chat);

export default router;
