import { z } from 'zod';

export const trendsQuerySchema = z.object({
  query: z.object({
    testName: z.string().trim().min(1).max(120),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }).refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: 'from must not be after to',
  }),
});
