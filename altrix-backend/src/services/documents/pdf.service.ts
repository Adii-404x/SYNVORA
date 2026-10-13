import { PDFParse } from 'pdf-parse';

export class PdfService {
  async extractText(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return result.pages.map((page) => `[Page ${page.num}]\n${page.text}`).join('\n');
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await parser.destroy();
    }
  }
}

export const pdfService = new PdfService();
