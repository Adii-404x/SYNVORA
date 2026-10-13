import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const malformedJson = err?.type === 'entity.parse.failed';
  const uploadTooLarge = err?.code === 'LIMIT_FILE_SIZE';
  const unexpectedUploadField = err?.code === 'LIMIT_UNEXPECTED_FILE';
  const statusCode = malformedJson || unexpectedUploadField ? 400
    : uploadTooLarge ? 413
      : err instanceof ApiError ? err.statusCode : 500;
  const message = malformedJson ? 'Malformed JSON request body'
    : uploadTooLarge ? 'Uploaded file exceeds the 10 MB limit'
      : unexpectedUploadField ? 'Unexpected upload field'
        : err instanceof ApiError ? err.message : 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
    },
  });
};
