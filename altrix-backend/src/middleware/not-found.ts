import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, 'Route not found'));
};
