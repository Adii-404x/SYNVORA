import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentsController } from '../../src/controllers/documents.controller';
import { storageService } from '../../src/integrations/supabase/storage';
import { supabaseAdmin } from '../../src/integrations/supabase/client';
import { extractionService } from '../../src/services/documents/extraction.service';

vi.mock('../../src/integrations/supabase/storage');
vi.mock('../../src/integrations/supabase/client');
vi.mock('../../src/services/documents/extraction.service');
vi.mock('../../src/services/audit.service');

describe('DocumentsController', () => {
  let controller: DocumentsController;
  const mockReq = {
    userId: 'user-123',
    params: { documentId: 'doc-123' },
    file: {
      originalname: 'test.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('fake pdf content'),
    },
  } as any;
  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as any;
  const mockNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new DocumentsController();
  });

  it('should upload a document successfully', async () => {
    (storageService.uploadMedicalDocument as any).mockResolvedValue({ path: 'user-123/test.pdf' });
    (supabaseAdmin.from as any).mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'doc-123' }, error: null }),
    });

    await controller.upload(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should fail upload if no file provided', async () => {
    const reqNoFile = { ...mockReq, file: undefined };
    await controller.upload(reqNoFile, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should extract data from document successfully', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'doc-123', storage_path: 'path/to/doc', mime_type: 'application/pdf' }, error: null }),
      update: vi.fn().mockReturnThis(),
    };
    (supabaseAdmin.from as any).mockReturnValue(mockQuery);
    
    (extractionService.processDocument as any).mockResolvedValue({
      text: 'extracted text',
      facts: { metadata: {}, observations: [], medications: [] },
    });

    await controller.extract(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should handle extraction failure', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'doc-123' }, error: null }),
      update: vi.fn().mockReturnThis(),
    };
    (supabaseAdmin.from as any).mockReturnValue(mockQuery);
    (extractionService.processDocument as any).mockRejectedValue(new Error('OCR failed'));

    await controller.extract(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});