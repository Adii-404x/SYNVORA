import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { healthRecordsController } from '../controllers/health-records.controller';

const router = Router();

router.get('/', authenticate, healthRecordsController.getVerifiedRecords);

export default router;
