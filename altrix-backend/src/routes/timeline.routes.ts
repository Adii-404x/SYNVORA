import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { timelineController } from '../controllers/timeline.controller';
import { timelineQuerySchema } from '../schemas/timeline.schema';

const router = Router();

router.get('/', authenticate, validate(timelineQuerySchema), timelineController.getTimeline);

export default router;