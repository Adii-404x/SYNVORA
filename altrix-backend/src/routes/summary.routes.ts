import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { summaryController } from '../controllers/summary.controller';

const router = Router();

router.post('/', authenticate, summaryController.generate);

export default router;