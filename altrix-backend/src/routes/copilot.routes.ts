import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { copilotController } from '../controllers/copilot.controller';

const router = Router();

router.post('/chat', authenticate, copilotController.chat);

export default router;