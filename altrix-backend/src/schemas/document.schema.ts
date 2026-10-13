import { z } from 'zod';

export const uploadDocumentSchema = z.object({
  body: z.any(), // Multer handles the file, we validate metadata if any
  file: z.object({
    originalname: z.string(),
    mimetype: z.string(),
    size: z.number(),
    buffer: z.any(),
  }),
});

export const documentIdSchema = z.object({
  params: z.object({
    documentId: z.string().uuid(),
  }),
});

export const documentQuerySchema = z.object({
  query: z.object({
    status: z.string().optional(),
  }),
});