import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const tesseractMocks = vi.hoisted(() => ({
  createWorker: vi.fn(),
  recognize: vi.fn(),
  terminate: vi.fn(),
}));
vi.mock('tesseract.js', () => ({
  default: { createWorker: tesseractMocks.createWorker },
}));

import { OcrService } from '../../src/services/documents/ocr.service';

function pngHeader(width = 300, height = 200) {
  const data = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(data);
  data.writeUInt32BE(width, 16);
  data.writeUInt32BE(height, 20);
  return data;
}

describe('OcrService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tesseractMocks.terminate.mockResolvedValue(undefined);
    tesseractMocks.recognize.mockResolvedValue({ data: {
      text: 'Glucose 5.4 mmol/L',
      confidence: 91,
      blocks: [{ text: 'Glucose 5.4 mmol/L', confidence: 89, bbox: { x0: 1, y0: 2, x1: 3, y1: 4 } }],
    } });
    tesseractMocks.createWorker.mockResolvedValue({ recognize: tesseractMocks.recognize, terminate: tesseractMocks.terminate });
  });

  afterEach(() => vi.useRealTimers());

  it('returns engine confidence and block bounds, and reuses one worker serially', async () => {
    const service = new OcrService();
    const [first, second] = await Promise.all([
      service.extractTextFromImage(pngHeader()),
      service.extractTextFromImage(pngHeader()),
    ]);
    expect(first).toMatchObject({ confidence: 91, text: 'Glucose 5.4 mmol/L' });
    expect(first.blocks[0].bbox).toEqual({ x0: 1, y0: 2, x1: 3, y1: 4 });
    expect(second.confidence).toBe(91);
    expect(tesseractMocks.createWorker).toHaveBeenCalledTimes(1);
    expect(tesseractMocks.createWorker).toHaveBeenCalledWith('eng', 1, expect.objectContaining({
      errorHandler: expect.any(Function),
      logger: expect.any(Function),
    }));
    expect(tesseractMocks.recognize).toHaveBeenCalledTimes(2);
    expect(tesseractMocks.terminate).not.toHaveBeenCalled();
  });

  it('keeps unavailable confidence unknown and flags low-confidence scans', async () => {
    tesseractMocks.recognize.mockResolvedValueOnce({ data: { text: 'Glucose 5.4 mmol/L', blocks: [] } });
    const unknown = await new OcrService().extractTextFromImage(pngHeader());
    expect(unknown.confidence).toBeNull();

    tesseractMocks.recognize.mockResolvedValue({ data: { text: 'Hb 1', confidence: 22, blocks: [] } });
    const result = await new OcrService().extractTextFromImage(pngHeader());
    expect(result.confidence).toBe(22);
    expect(result.qualityFlags).toEqual(expect.arrayContaining(['suspiciously_short_text', 'low_ocr_confidence']));
  });

  it('times out and discards a stalled worker', async () => {
    vi.useFakeTimers();
    tesseractMocks.recognize.mockImplementation(() => new Promise(() => undefined));
    const promise = new OcrService().extractTextFromImage(pngHeader());
    const assertion = expect(promise).rejects.toThrow(/time limit/);
    await vi.advanceTimersByTimeAsync(30_001);
    await assertion;
    expect(tesseractMocks.terminate).toHaveBeenCalledTimes(1);
  });

  it('fails immediately and safely when the worker reports initialization failure', async () => {
    tesseractMocks.createWorker.mockImplementation((_language: string, _engine: number, options: { errorHandler: (error: Error) => void }) => {
      queueMicrotask(() => options.errorHandler(new Error('traineddata fetch details')));
      return new Promise(() => undefined);
    });
    await expect(new OcrService().extractTextFromImage(pngHeader())).rejects.toThrow(/time limit/);
  });
});
