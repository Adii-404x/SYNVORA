import pdf from 'pdf-parse';

export class PdfService {
  async extractText(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const pdfService = new PdfService();