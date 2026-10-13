import Tesseract from 'tesseract.js';

export class OcrService {
  async extractTextFromImage(buffer: Buffer): Promise<string> {
    try {
      const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
      return text;
    } catch (error) {
      throw new Error(`OCR extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const ocrService = new OcrService();