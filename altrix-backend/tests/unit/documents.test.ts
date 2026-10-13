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
for (const method of ['insert', 'select', 'update', 'eq', 'order']) {
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

  it('extracts only after loading the document under the authenticated user', async () => {
    vi.mocked(extractionService.processDocument).mockResolvedValue({
      text: 'extracted text',
      facts: {
        metadata: { document_type: null, report_date: null, facility: null, patient_name: null },
        observations: [],
        medications: [],
      },
    });

    await controller.extract(mockReq, mockRes, mockNext);

    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-123');
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
});
