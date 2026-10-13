import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PdfService } from '../../src/services/documents/pdf.service';
import { ocrService } from '../../src/services/documents/ocr.service';
import { medicalDocumentScenarios } from '../fixtures/medical-document-scenarios';

const pdfMocks = vi.hoisted(() => ({
  getText: vi.fn(),
  getScreenshot: vi.fn(),
  destroy: vi.fn(),
}));

vi.mock('pdf-parse', () => ({
  PDFParse: class {
    getText = pdfMocks.getText;
    getScreenshot = pdfMocks.getScreenshot;
    destroy = pdfMocks.destroy;
    constructor() {}
  },
}));
vi.mock('../../src/services/documents/ocr.service', () => ({
  ocrService: { extractTextFromImage: vi.fn() },
  qualityFlagsForText: (text: string) => !text.trim() ? ['empty_text'] : text.trim().length < 40 ? ['suspiciously_short_text'] : [],
}));

describe('PdfService adaptive page extraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pdfMocks.getScreenshot.mockResolvedValue({ pages: [{ data: new Uint8Array([1, 2, 3]) }] });
    pdfMocks.destroy.mockResolvedValue(undefined);
    vi.mocked(ocrService.extractTextFromImage).mockResolvedValue({
      text: 'Scanned page with a glucose result 5.4 mmol/L',
      confidence: 81,
      blocks: [{ text: 'Glucose 5.4 mmol/L', confidence: 85, bbox: { x0: 12, y0: 18, x1: 180, y1: 44 } }],
      qualityFlags: [],
    });
  });

  it('uses embedded text for digital pages and renders only text-poor pages', async () => {
    pdfMocks.getText.mockResolvedValue({ pages: [
      { num: 1, text: 'A digital laboratory report with sufficient embedded text and values.' },
      { num: 2, text: '' },
      { num: 3, text: 'A second digital page with sufficient embedded text and values.' },
    ] });

    const result = await new PdfService().extractPages(Buffer.from('synthetic'));
    expect(result.extractionMethod).toBe(medicalDocumentScenarios.mixedPdf.expectedMethod);
    expect(result.pages.map((page) => page.method)).toEqual(['pdf_text', 'pdf_ocr', 'pdf_text']);
    expect(result.pages[1]).toMatchObject({ pageNumber: 2, ocrConfidence: 81 });
    expect(result.pages[1].blocks[0].bbox).toEqual({ x0: 12, y0: 18, x1: 180, y1: 44 });
    expect(pdfMocks.getScreenshot).toHaveBeenCalledTimes(1);
    expect(pdfMocks.getScreenshot).toHaveBeenCalledWith({ partial: [2], desiredWidth: 1600, imageBuffer: true });
    expect(ocrService.extractTextFromImage).toHaveBeenCalledTimes(1);
  });

  it('uses OCR for all scanned pages and flags an empty OCR page without fabricating confidence', async () => {
    pdfMocks.getText.mockResolvedValue({ pages: [{ num: 1, text: '' }, { num: 2, text: ' ' }] });
    vi.mocked(ocrService.extractTextFromImage)
      .mockResolvedValueOnce({ text: 'Text from scanned page one', confidence: 79, blocks: [], qualityFlags: [] })
      .mockResolvedValueOnce({ text: '', confidence: null, blocks: [], qualityFlags: ['empty_text'] });

    const result = await new PdfService().extractPages(Buffer.from('synthetic'));
    expect(result.extractionMethod).toBe('pdf_ocr');
    expect(result.pages[0].ocrConfidence).toBe(79);
    expect(result.pages[1].ocrConfidence).toBeNull();
    expect(result.pages[1].qualityFlags).toContain('ocr_empty_page');
  });

  it('refuses PDFs above the configured processing page limit and always releases the parser', async () => {
    pdfMocks.getText.mockResolvedValue({ pages: Array.from({ length: 51 }, (_, index) => ({ num: index + 1, text: 'x' })) });
    await expect(new PdfService().extractPages(Buffer.from('synthetic'))).rejects.toMatchObject({ statusCode: 413 });
    expect(pdfMocks.destroy).toHaveBeenCalled();
    expect(pdfMocks.getScreenshot).not.toHaveBeenCalled();
  });

  it('fails safely when a scanned page cannot be rendered or recognized', async () => {
    pdfMocks.getText.mockResolvedValue({ pages: [{ num: 1, text: '' }] });
    pdfMocks.getScreenshot.mockRejectedValue(new Error('renderer details must not be exposed'));
    await expect(new PdfService().extractPages(Buffer.from('synthetic'))).rejects.toMatchObject({ statusCode: 422 });
  });

  it('fails safely for malformed PDFs without exposing parser diagnostics', async () => {
    pdfMocks.getText.mockRejectedValue(new Error('private parser path and document details'));
    await expect(new PdfService().extractPages(medicalDocumentScenarios.malformedPdf.bytes)).rejects.toThrow('PDF could not be parsed or rendered');
  });
});
