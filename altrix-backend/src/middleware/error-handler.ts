import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const malformedJson = err?.type === 'entity.parse.failed';
  const statusCode = malformedJson ? 400 : err instanceof ApiError ? err.statusCode : 500;
  const message = malformedJson ? 'Malformed JSON request body' : err instanceof ApiError ? err.message : 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
    },
  });
};
