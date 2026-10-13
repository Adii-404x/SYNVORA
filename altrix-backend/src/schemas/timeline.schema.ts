import { z } from 'zod';

export const timelineQuerySchema = z.object({
  query: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    type: z.enum(['document', 'observation', 'medication']).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().datetime().optional(),
  }).refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: 'from must not be after to',
  }),
});
