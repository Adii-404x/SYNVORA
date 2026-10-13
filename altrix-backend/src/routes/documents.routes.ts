import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate';
import { documentsController } from '../controllers/documents.controller';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/', authenticate, upload.single('file'), documentsController.upload);
router.get('/', authenticate, documentsController.list);
router.get('/:documentId', authenticate, documentsController.getById);
router.post('/:documentId/extract', authenticate, documentsController.extract);

export default router;