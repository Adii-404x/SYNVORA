import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate';
import { documentsController } from '../controllers/documents.controller';
import { validate } from '../middleware/validate';
import { documentIdSchema } from '../schemas/document.schema';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/', authenticate, upload.single('file'), documentsController.upload);
router.get('/', authenticate, documentsController.list);
router.get('/:documentId', authenticate, validate(documentIdSchema), documentsController.getById);
router.post('/:documentId/extract', authenticate, validate(documentIdSchema), documentsController.extract);

export default router;
