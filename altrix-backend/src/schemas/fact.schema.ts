import { z } from 'zod';

const factIdParams = z.object({
  factId: z.string().uuid(),
});

export const confirmFactSchema = z.object({
  params: factIdParams,
  body: z.object({
    observationDate: z.iso.date().optional(),
  }).strict().optional(),
});

export const rejectFactSchema = z.object({
  params: factIdParams,
  body: z.object({}).strict().optional(),
});
