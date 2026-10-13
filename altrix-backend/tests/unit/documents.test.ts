import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentsController } from '../../src/controllers/documents.controller';
import { storageService } from '../../src/integrations/supabase/storage';
import { extractionService } from '../../src/services/documents/extraction.service';

vi.mock('../../src/integrations/supabase/storage');
vi.mock('../../src/services/documents/extraction.service');
vi.mock('../../src/services/audit.service');

const document = {
  id: 'doc-123',
  user_id: 'user-123',
  storage_path: 'user-123/test.pdf',
  mime_type: 'application/pdf',
  metadata: {},
};

const queryResult = { data: null, error: null };
const query: any = {};
for (const method of ['insert', 'select', 'update', 'eq', 'neq', 'order']) {
  query[method] = vi.fn(() => query);
}
query.single = vi.fn();
query.maybeSingle = vi.fn();
query.then = (resolve: (value: typeof queryResult) => unknown, reject: (reason: unknown) => unknown) =>
  Promise.resolve(queryResult).then(resolve, reject);

const supabase = { from: vi.fn(() => query) };

describe('DocumentsController', () => {
  let controller: DocumentsController;
  const mockReq = {
    userId: 'user-123',
    supabase,
    params: { documentId: 'doc-123' },
    file: {
      originalname: 'test.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('%PDF-1.7 synthetic test document'),
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
    query.single.mockResolvedValue({ data: document, error: null });
    query.maybeSingle.mockResolvedValue({ data: document, error: null });
    vi.mocked(storageService.createMedicalDocumentUrl).mockResolvedValue('https://signed.example/short-lived');
  });

  it('uploads through the authenticated client and records owner-scoped metadata', async () => {
    vi.mocked(storageService.uploadMedicalDocument).mockResolvedValue({ path: document.storage_path });

    await controller.upload(mockReq, mockRes, mockNext);

    expect(storageService.uploadMedicalDocument).toHaveBeenCalledWith(
      supabase,
      'user-123',
      'test.pdf',
      'application/pdf',
      expect.any(Buffer),
    );
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'user-123' }));
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('rejects an upload without a file', async () => {
    await controller.upload({ ...mockReq, file: undefined }, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('rejects spoofed file content before storage', async () => {
    const spoofed = { ...mockReq.file, buffer: Buffer.from('<html>not a PDF</html>') };
    await controller.upload({ ...mockReq, file: spoofed }, mockRes, mockNext);
    expect(storageService.uploadMedicalDocument).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 415 }));
  });

  it('creates a short-lived source URL only after an owner-scoped document lookup', async () => {
    await controller.getSignedUrl(mockReq, mockRes, mockNext);

    expect(query.eq).toHaveBeenCalledWith('id', 'doc-123');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(storageService.createMedicalDocumentUrl).toHaveBeenCalledWith(supabase, document.storage_path);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: { url: 'https://signed.example/short-lived', expiresIn: 60 },
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('does not sign a document that is not owned by the authenticated user', async () => {
    query.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await controller.getSignedUrl(mockReq, mockRes, mockNext);

    expect(storageService.createMedicalDocumentUrl).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });

  it('extracts only after loading the document under the authenticated user', async () => {
    vi.mocked(extractionService.processDocument).mockResolvedValue({
      text: 'extracted text',
      pages: [],
      pageCount: 0,
      extractionMethod: 'pdf_text',
      qualityFlags: [],
      facts: {
        metadata: { document_type: null, report_date: null, facility: null, patient_name: null },
        observations: [],
        medications: [],
      },
    });

    await controller.extract(mockReq, mockRes, mockNext);

    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(query.neq).toHaveBeenCalledWith('processing_status', 'processing');
    expect(extractionService.processDocument).toHaveBeenCalledWith(
      'doc-123', 'user-123', document.storage_path, document.mime_type, supabase,
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('marks an owned document failed when extraction fails', async () => {
    vi.mocked(extractionService.processDocument).mockRejectedValue(new Error('OCR failed'));

    await controller.extract(mockReq, mockRes, mockNext);

    expect(query.update).toHaveBeenCalledWith({ processing_status: 'failed' });
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('does not disturb an already-running extraction when a duplicate request is rejected', async () => {
    query.maybeSingle
      .mockResolvedValueOnce({ data: document, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    await controller.extract(mockReq, mockRes, mockNext);

    expect(extractionService.processDocument).not.toHaveBeenCalled();
    expect(query.update).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }));
  });

  it('does not start extraction when the authenticated owner cannot load the document', async () => {
    query.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await controller.extract(mockReq, mockRes, mockNext);

    expect(extractionService.processDocument).not.toHaveBeenCalled();
    expect(query.update).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });
});
