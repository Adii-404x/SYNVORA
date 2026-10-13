import { Router } from 'express';
import { factsController } from '../controllers/facts.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { confirmFactSchema, rejectFactSchema } from '../schemas/fact.schema';

const router = Router();

router.get('/pending', authenticate, factsController.listPending);
router.post('/:factId/confirm', authenticate, validate(confirmFactSchema), factsController.confirm);
router.post('/:factId/reject', authenticate, validate(rejectFactSchema), factsController.reject);

export default router;
