import { describe, expect, it, vi } from 'vitest';
import { PDFParse } from 'pdf-parse';
import { OcrService, ocrService } from '../../src/services/documents/ocr.service';
import { PdfService } from '../../src/services/documents/pdf.service';

function createDigitalPdf(text: string): Buffer {
  const escaped = text.replace(/[\\()]/g, '\\$&');
  const content = `BT /F1 28 Tf 40 700 Td (${escaped}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const chunks = ['%PDF-1.4\n'];
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(chunks.join('')));
    chunks.push(`${i + 1} 0 obj\n${objects[i]}\nendobj\n`);
  }
  const xrefOffset = Buffer.byteLength(chunks.join(''));
  chunks.push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  for (const offset of offsets.slice(1)) chunks.push(`${String(offset).padStart(10, '0')} 00000 n \n`);
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  return Buffer.from(chunks.join(''), 'binary');
}

function createMixedPdf(): Buffer {
  const digitalContent = 'BT /F1 18 Tf 40 700 Td (Digital result glucose 5.4 mmol/L from laboratory report.) Tj ET';
  const imageContent = 'q 100 0 0 100 40 600 cm /Im1 Do Q';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R 6 0 R] /Count 2 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(digitalContent)} >>\nstream\n${digitalContent}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im1 7 0 R >> >> /Contents 8 0 R >>',
    '<< /Type /XObject /Subtype /Image /Width 1 /Height 1 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length 3 >>\nstream\n\xFF\xFF\xFF\nendstream',
    `<< /Length ${Buffer.byteLength(imageContent)} >>\nstream\n${imageContent}\nendstream`,
  ];
  const chunks = ['%PDF-1.4\n'];
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(chunks.join(''), 'binary'));
    chunks.push(`${i + 1} 0 obj\n${objects[i]}\nendobj\n`);
  }
  const xrefOffset = Buffer.byteLength(chunks.join(''), 'binary');
  chunks.push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  for (const offset of offsets.slice(1)) chunks.push(`${String(offset).padStart(10, '0')} 00000 n \n`);
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  return Buffer.from(chunks.join(''), 'binary');
}

const integration = process.env.RUN_OCR_INTEGRATION === '1' ? describe : describe.skip;

async function renderSyntheticPage(): Promise<Buffer> {
    const parser = new PDFParse({ data: new Uint8Array(createDigitalPdf('GLUCOSE 5.4 mmol/L')) });
    let png!: Buffer;
    try {
      const rendered = await parser.getScreenshot({ partial: [1], desiredWidth: 1600, imageBuffer: true });
      png = Buffer.from(rendered.pages[0].data);
    } finally {
      await parser.destroy();
    }
    return png;
}

describe('actual PDF renderer', () => {
  it('extracts embedded text and renders a synthetic report page to a PNG buffer', async () => {
    const parser = new PDFParse({ data: new Uint8Array(createDigitalPdf('GLUCOSE 5.4 mmol/L')) });
    try {
      const text = await parser.getText();
      const rendered = await parser.getScreenshot({ partial: [1], desiredWidth: 1600, imageBuffer: true });
      expect(text.pages[0].text).toContain('GLUCOSE 5.4 mmol/L');
      expect(Buffer.from(rendered.pages[0].data).subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    } finally {
      await parser.destroy();
    }
  });

  it('routes digital and image-only pages in a real mixed PDF through text extraction and page rendering', async () => {
    const ocr = vi.spyOn(ocrService, 'extractTextFromImage').mockResolvedValue({
      text: 'Scanned page glucose 5.4 mmol/L',
      confidence: 84,
      blocks: [],
      qualityFlags: [],
    });
    try {
      const result = await new PdfService().extractPages(createMixedPdf());
      expect(result.extractionMethod).toBe('mixed_pdf');
      expect(result.pages.map((page) => page.method)).toEqual(['pdf_text', 'pdf_ocr']);
      expect(result.pages[0].text).toContain('Digital result glucose 5.4 mmol/L');
      expect(result.pages[1]).toMatchObject({ pageNumber: 2, text: 'Scanned page glucose 5.4 mmol/L', ocrConfidence: 84 });
      expect(ocr).toHaveBeenCalledTimes(1);
      expect(ocr.mock.calls[0][0].subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    } finally {
      ocr.mockRestore();
    }
  });
});

integration('actual Tesseract engine', () => {
  it('recognizes the printed test and value from the rendered synthetic report', async () => {
    const png = await renderSyntheticPage();
    const result = await new OcrService().extractTextFromImage(png);
    expect(result.text.toUpperCase()).toContain('GLUCOSE');
    expect(result.text).toContain('5.4');
    expect(result.confidence).toEqual(expect.any(Number));
  }, 90_000);
});
