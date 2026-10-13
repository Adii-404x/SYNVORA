import { z } from "zod";

export const chatSchema = z.object({
  body: z.object({
    message: z.string().trim().min(1).max(1000),
    conversationId: z.string().uuid().optional(),
  }).strict(),
});

export const groundedAnswerSchema = z.object({
  answer: z.string().trim().min(1).max(4000),
  citations: z.array(z.string().uuid()).max(50),
  uncertainty: z.boolean(),
}).strict();

