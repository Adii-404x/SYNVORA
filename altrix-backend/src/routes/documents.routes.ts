import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate';
import { documentsController } from '../controllers/documents.controller';
import { validate } from '../middleware/validate';
import { documentIdSchema } from '../schemas/document.schema';
import { supportedDocumentMimeTypes } from '../utils/document-file';
import { ApiError } from '../utils/api-error';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!supportedDocumentMimeTypes.includes(file.mimetype)) {
      return callback(new ApiError(415, 'Only PDF, JPEG, PNG, and WebP documents are supported'));
    }
    callback(null, true);
  },
});

router.post('/', authenticate, upload.single('file'), documentsController.upload);
router.get('/', authenticate, documentsController.list);
router.get('/:documentId', authenticate, validate(documentIdSchema), documentsController.getById);
router.post('/:documentId/extract', authenticate, validate(documentIdSchema), documentsController.extract);

export default router;
