import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err instanceof ApiError ? err.message : 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
    },
  });
};