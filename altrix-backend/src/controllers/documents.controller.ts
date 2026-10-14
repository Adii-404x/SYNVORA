import { NextFunction, Request, Response } from 'express';
import { storageService } from '../integrations/supabase/storage';
import { extractionService } from '../services/documents/extraction.service';
import { auditService } from '../services/audit.service';
import { ApiError } from '../utils/api-error';
import { getAuthContext } from '../utils/auth-context';
import { HealthDocument } from '../types';
import { isSupportedDocumentFile } from '../utils/document-file';

function getDocumentId(req: Request): string {
  const documentId = req.params.documentId;
  if (typeof documentId !== 'string') throw new ApiError(400, 'Invalid document identifier');
  return documentId;
}

export class DocumentsController {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) throw new ApiError(400, 'No file uploaded');
      if (!isSupportedDocumentFile(file.mimetype, file.buffer)) {
        throw new ApiError(415, 'Document content does not match a supported PDF or image format');
      }

      const { userId, supabase } = getAuthContext(req);
      const { path: storagePath } = await storageService.uploadMedicalDocument(
        supabase,
        userId,
        file.originalname,
        file.mimetype,
        file.buffer,
      );

      const { data, error } = await supabase
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

      if (error || !data) {
        try {
          await storageService.deleteMedicalDocument(supabase, storagePath);
        } catch {
          console.error('Failed to clean up an unrecorded document upload.');
        }
        throw new ApiError(500, 'Failed to save document metadata', true, error);
      }

      await auditService.logAction({
        userId,
        action: 'DOCUMENT_UPLOADED',
        entityType: 'health_document',
        entityId: data.id,
      });

      return res.status(201).json({ success: true, data: data as HealthDocument });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, supabase } = getAuthContext(req);
      const { data, error } = await supabase
        .from('health_documents')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (error) throw new ApiError(500, 'Failed to fetch documents', true, error);
      return res.status(200).json({ success: true, data: data as HealthDocument[] });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, supabase } = getAuthContext(req);
      const { data, error } = await supabase
        .from('health_documents')
        .select('*')
        .eq('id', getDocumentId(req))
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) throw new ApiError(404, 'Document not found');
      return res.status(200).json({ success: true, data: data as HealthDocument });
    } catch (error) {
      next(error);
    }
  }

  async getSignedUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, supabase } = getAuthContext(req);
      const { data, error } = await supabase
        .from('health_documents')
        .select('storage_path')
        .eq('id', getDocumentId(req))
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw new ApiError(500, 'Failed to retrieve document');
      if (!data) throw new ApiError(404, 'Document not found');
      let url: string;
      try {
        url = await storageService.createMedicalDocumentUrl(supabase, data.storage_path);
      } catch {
        throw new ApiError(503, 'Document preview is temporarily unavailable');
      }
      return res.status(200).json({ success: true, data: { url, expiresIn: 60 } });
    } catch (error) {
      next(error);
    }
  }

  async extract(req: Request, res: Response, next: NextFunction) {
    let documentId: string | undefined;
    let userId: string | undefined;
    let processingClaimed = false;

    try {
      documentId = getDocumentId(req);
      const auth = getAuthContext(req);
      userId = auth.userId;
      const { supabase } = auth;
      const { data: document, error: documentError } = await supabase
        .from('health_documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', userId)
        .maybeSingle();

      if (documentError || !document) throw new ApiError(404, 'Document not found');

      const { data: claimed, error: statusError } = await supabase
        .from('health_documents')
        .update({ processing_status: 'processing', error_message: null })
        .eq('id', documentId)
        .eq('user_id', userId)
        .neq('processing_status', 'processing')
        .select('id')
        .maybeSingle();
      if (statusError) throw new ApiError(500, 'Failed to update document status', true, statusError);
      if (!claimed) throw new ApiError(409, 'Document extraction is already in progress');
      processingClaimed = true;

      const result = await extractionService.processDocument(
        documentId,
        userId,
        document.storage_path,
        document.mime_type,
        supabase,
      );

      const { error: updateError } = await supabase
        .from('health_documents')
        .update({
          processing_status: 'completed',
          error_message: null,
          metadata: {
            ...(document.metadata ?? {}),
            extracted_text: result.text,
            document_type: result.facts.metadata.document_type,
            report_date: result.facts.metadata.report_date,
            facility: result.facts.metadata.facility,
            patient_name: result.facts.metadata.patient_name,
            extraction_method: result.extractionMethod,
            page_count: result.pageCount,
            extraction_quality_flags: result.qualityFlags,
            extracted_pages: result.pages.map((page) => ({
              page_number: page.pageNumber,
              text: page.text,
              embedded_text: page.embeddedText ?? null,
              extraction_method: page.method,
              ocr_confidence: page.ocrConfidence,
              quality_flags: page.qualityFlags,
              blocks: page.blocks,
            })),
          },
          page_count: result.pageCount,
          extraction_method: result.extractionMethod,
          extraction_quality_flags: result.qualityFlags,
        })
        .eq('id', documentId)
        .eq('user_id', userId);

      if (updateError) throw new ApiError(500, 'Failed to update document status', true, updateError);

          return res.status(200).json({
        success: true,
        data: {
          documentId,
          status: 'completed',
          extractionMethod: result.extractionMethod,
          pageCount: result.pageCount,
          qualityFlags: result.qualityFlags,
          facts: result.facts,
        },
      });
    } catch (error) {
      if (processingClaimed && userId && req.supabase && documentId) {
        try {
          await req.supabase
            .from('health_documents')
            .update({ processing_status: 'failed' })
            .eq('id', documentId)
            .eq('user_id', userId);
        } catch {
          console.error('Failed to update the document processing status.');
        }
      }
      next(error);
    }
  }
}

export const documentsController = new DocumentsController();
