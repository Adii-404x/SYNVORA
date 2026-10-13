import { z } from 'zod';

export const trendsQuerySchema = z.object({
  query: z.object({
    testName: z.string().min(1),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),
});