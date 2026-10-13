import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';

const requestCounts = new Map<string, { count: number; resetTime: number }>();

const createLimiter = (windowMs: number, max: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = requestCounts.get(ip);

    if (!record || now > record.resetTime) {
      requestCounts.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (record.count >= max) {
      return next(new ApiError(429, 'Too many requests, please try again later'));
    }

    record.count++;
    next();
  };
};

export const apiLimiter = createLimiter(15 * 60 * 1000, 100);
export const authLimiter = createLimiter(60 * 60 * 1000, 10);