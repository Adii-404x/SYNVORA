import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { trendsController } from '../controllers/trends.controller';
import { trendsQuerySchema } from '../schemas/trends.schema';

const router = Router();

router.get('/', authenticate, validate(trendsQuerySchema), trendsController.getTrends);

export default router;