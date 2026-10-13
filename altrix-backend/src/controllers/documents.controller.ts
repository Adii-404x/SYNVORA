import { Request, Response, NextFunction } from 'express';
import { storageService } from '../integrations/supabase/storage';
import { supabaseAdmin } from '../integrations/supabase/client';
import { extractionService } from '../services/documents/extraction.service';
import { auditService } from '../services/audit.service';
import { ApiError } from '../utils/api-error';
import { HealthDocument } from '../types';

export class DocumentsController {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) {
        throw new ApiError(400, 'No file uploaded');
      }

      const userId = req.userId;
      if (!userId) throw new ApiError(401, 'User not authenticated');
      
      // 1. Upload to Supabase Storage
      const { path: storagePath } = await storageService.uploadMedicalDocument(
        userId,
        file.originalname,
        file.mimetype,
        file.buffer
      );

      // 2. Create database record
      const { data, error } = await supabaseAdmin
        .from('health_documents')
        .insert({
          user_id: userId,
          file_name: file.originalname,
          storage_path: storagePath,
          mime_type: file.mimetype,
          file_size: file.size,
          processing_status: 'pending',
        })
        .select()
        .single();

      if (error) throw new ApiError(500, 'Failed to save document metadata', true, error);

      // 3. HIPAA Audit Log
      await auditService.logAction({
        userId,
        action: 'DOCUMENT_UPLOADED',
        entityType: 'health_document',
        entityId: data.id,
      });

      return res.status(201).json({
        success: true,
        data: data as HealthDocument,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) throw new ApiError(401, 'User not authenticated');

      const { data, error } = await supabaseAdmin
        .from('health_documents')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (error) throw new ApiError(500, 'Failed to fetch documents', true, error);

      return res.status(200).json({
        success: true,
        data: data as HealthDocument[],
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId } = req.params;
      const userId = req.userId;
      if (!userId) throw new ApiError(401, 'User not authenticated');

      const { data, error } = await supabaseAdmin
        .from('health_documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        throw new ApiError(404, 'Document not found');
      }

      return res.status(200).json({
        success: true,
        data: data as HealthDocument,
      });
    } catch (error) {
      next(error);
    }
  }

  async extract(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId } = req.params;
      const userId = req.userId;
      if (!userId) throw new ApiError(401, 'User not authenticated');

      // 1. Verify document ownership and existence
      const { data: doc, error: docError } = await supabaseAdmin
        .from('health_documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (docError || !doc) {
        throw new ApiError(404, 'Document not found');
      }

      // 2. Update status to processing
      await supabaseAdmin
        .from('health_documents')
        .update({ processing_status: 'processing' })
        .eq('id', documentId);

      // 3. Run the Extraction Pipeline (OCR -> LLM -> DB)
      const result = await extractionService.processDocument(
        documentId,
        userId,
        doc.storage_path,
        doc.mime_type
      );

      // 4. Mark as completed and save extracted text to metadata
      const { error: updateError } = await supabaseAdmin
        .from('health_documents')
        .update({ 
          processing_status: 'completed',
          metadata: { ...doc.metadata, extracted_text: result.text }
        })
        .eq('id', documentId);

      if (updateError) throw new ApiError(500, 'Failed to update document status');

      return res.status(200).json({
        success: true,
        data: {
          documentId,
          status: 'completed',
          facts: result.facts,
        },
      });
    } catch (error) {
      // 5. Resilience: Mark as failed in DB on error
      if (req.params.documentId) {
        try {
          await supabaseAdmin
            .from('health_documents')
            .update({ processing_status: 'failed' })
            .eq('id', req.params.documentId);
        } catch (updateErr) {
          console.error('Failed to mark document as failed:', updateErr);
        }
      }
      next(error);
    }
  }
}

export const documentsController = new DocumentsController();