import { PDFParse } from 'pdf-parse';
import { ApiError } from '../../utils/api-error';
import { ExtractedDocumentPage } from '../../types';
import { ocrService, qualityFlagsForText } from './ocr.service';

const MAX_PDF_PAGES = 50;
const RENDER_WIDTH = 1600;
const PAGE_TEXT_THRESHOLD = 40;
const PDF_PARSE_TIMEOUT_MS = 30_000;
const PDF_RENDER_TIMEOUT_MS = 20_000;
const PDF_TOTAL_BUDGET_MS = 300_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string, failureMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new ApiError(504, timeoutMessage)), timeoutMs);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      () => { clearTimeout(timer); reject(new ApiError(422, failureMessage)); },
    );
  });
}

export interface PdfExtractionResult {
  pages: ExtractedDocumentPage[];
  text: string;
  pageCount: number;
  extractionMethod: 'pdf_text' | 'pdf_ocr' | 'mixed_pdf';
  qualityFlags: string[];
}

export class PdfService {
  async extractPages(buffer: Buffer): Promise<PdfExtractionResult> {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const startedAt = Date.now();
    try {
      const result = await withTimeout(
        parser.getText(),
        PDF_PARSE_TIMEOUT_MS,
        'PDF text extraction timed out',
        'PDF could not be parsed or rendered',
      );
      if (result.pages.length > MAX_PDF_PAGES) {
        throw new ApiError(413, `PDF exceeds the ${MAX_PDF_PAGES}-page processing limit`);
      }

      const pages: ExtractedDocumentPage[] = [];
      for (const page of result.pages) {
        if (Date.now() - startedAt > PDF_TOTAL_BUDGET_MS) {
          throw new ApiError(504, 'PDF exceeded the document processing time limit');
        }
        const embeddedText = page.text.trim();
        if (embeddedText.length >= PAGE_TEXT_THRESHOLD) {
          pages.push({
            pageNumber: page.num,
            text: embeddedText,
            embeddedText,
            method: 'pdf_text',
            ocrConfidence: null,
            blocks: [],
            qualityFlags: qualityFlagsForText(embeddedText),
          });
          continue;
        }

        try {
          const screenshot = await withTimeout(
            parser.getScreenshot({ partial: [page.num], desiredWidth: RENDER_WIDTH, imageBuffer: true }),
            PDF_RENDER_TIMEOUT_MS,
            `PDF page ${page.num} rendering timed out`,
            `PDF page ${page.num} could not be rendered`,
          );
          const image = screenshot.pages[0]?.data;
          if (!image?.length) throw new Error('PDF page renderer returned no image');
          const ocr = await ocrService.extractTextFromImage(Buffer.from(image));
          const text = ocr.text.trim() || embeddedText;
          const qualityFlags = [...new Set([
            ...qualityFlagsForText(text),
            ...ocr.qualityFlags,
            ...(!ocr.text.trim() ? ['ocr_empty_page'] : []),
          ])];
          pages.push({
            pageNumber: page.num,
            text,
            embeddedText: embeddedText || null,
            method: 'pdf_ocr',
            ocrConfidence: ocr.confidence,
            blocks: ocr.blocks,
            qualityFlags,
          });
        } catch {
          if (!embeddedText) throw new ApiError(422, `Unable to extract page ${page.num}`);
          pages.push({
            pageNumber: page.num,
            text: embeddedText,
            embeddedText,
            method: 'pdf_text',
            ocrConfidence: null,
            blocks: [],
            qualityFlags: [...qualityFlagsForText(embeddedText), 'page_ocr_failed'],
          });
        }
      }

      const hasOcr = pages.some((page) => page.method === 'pdf_ocr');
      const hasText = pages.some((page) => page.method === 'pdf_text');
      const extractionMethod = hasOcr && hasText ? 'mixed_pdf' : hasOcr ? 'pdf_ocr' : 'pdf_text';
      const qualityFlags = [...new Set(pages.flatMap((page) => page.qualityFlags))];
      if (pages.length === 0 || !pages.some((page) => page.text.trim())) qualityFlags.push('empty_document_text');
      return {
        pages,
        text: pages.map((page) => `[Page ${page.pageNumber}]\n${page.text}`).join('\n'),
        pageCount: result.pages.length,
        extractionMethod,
        qualityFlags: [...new Set(qualityFlags)],
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(422, 'PDF could not be parsed or rendered');
    } finally {
      try { await parser.destroy(); } catch { /* parser cleanup must not replace the safe processing error */ }
    }
  }

  async extractText(buffer: Buffer): Promise<string> {
    return (await this.extractPages(buffer)).text;
  }
}

export const pdfService = new PdfService();
