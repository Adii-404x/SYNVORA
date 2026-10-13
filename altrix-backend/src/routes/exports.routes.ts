import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { exportsController } from '../controllers/exports.controller';

const router = Router();

router.post('/fhir', authenticate, exportsController.exportFhir);

export default router;
