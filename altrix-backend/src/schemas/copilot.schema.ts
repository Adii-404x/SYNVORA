import { z } from "zod";

export const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(1000),
    context: z.array(z.object({
      factId: z.string().uuid(),
      value: z.string().max(500),
      unit: z.string().max(40).optional(),
      type: z.string().min(1).max(100),
      source: z.string().max(200).optional(),
    }).strict()).max(10).optional(),
  }),
});

