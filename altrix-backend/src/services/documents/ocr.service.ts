import Tesseract from 'tesseract.js';
import path from 'node:path';
import { OcrBlock } from '../../types';
import { validateImagePixelLimit } from '../../utils/image-limits';
import { env } from '../../config/env';
import { ApiError } from '../../utils/api-error';

const OCR_TIMEOUT_MS = 30_000;
const BUNDLED_ENGLISH_DATA = path.join(
  path.dirname(require.resolve('@tesseract.js-data/eng')),
  '4.0.0_best_int',
);

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('OCR processing timed out')), timeoutMs);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error: unknown) => { clearTimeout(timer); reject(error); },
    );
  });
}

export interface OcrResult {
  text: string;
  confidence: number | null;
  blocks: OcrBlock[];
  qualityFlags: string[];
}

export class OcrService {
  private workerPromise: Promise<Awaited<ReturnType<typeof Tesseract.createWorker>>> | null = null;
  private queue: Promise<void> = Promise.resolve();
  private queueDepth = 0;

  async extractTextFromImage(buffer: Buffer): Promise<OcrResult> {
    validateImagePixelLimit(buffer);
    if (this.queueDepth >= 5) throw new ApiError(503, 'OCR processing capacity is temporarily full');
    this.queueDepth += 1;
    const task = this.queue.then(() => this.recognize(buffer));
    this.queue = task.then(() => undefined, () => undefined);
    return task.finally(() => { this.queueDepth -= 1; });
  }

  private async recognize(buffer: Buffer): Promise<OcrResult> {
    try {
      const createdWorker = await this.getWorker();
      const result = await withTimeout(
        createdWorker.recognize(buffer, {}, { blocks: true }),
        OCR_TIMEOUT_MS,
      );
      const confidence = Number.isFinite(result.data.confidence)
        ? Math.max(0, Math.min(100, result.data.confidence))
        : null;
      const blocks: OcrBlock[] = (result.data.blocks ?? []).map((block) => ({
        text: block.text,
        confidence: Number.isFinite(block.confidence) ? Math.max(0, Math.min(100, block.confidence)) : null,
        bbox: block.bbox
          ? { x0: block.bbox.x0, y0: block.bbox.y0, x1: block.bbox.x1, y1: block.bbox.y1 }
          : null,
      }));
      const text = result.data.text;
      const qualityFlags = qualityFlagsForText(text);
      if (confidence !== null && confidence < 60) qualityFlags.push('low_ocr_confidence');
      return {
        text,
        confidence,
        blocks,
        qualityFlags,
      };
    } catch (error) {
      const workerPromise = this.workerPromise;
      this.workerPromise = null;
      const worker = await workerPromise?.catch(() => undefined);
      if (worker) {
        try { await worker.terminate(); } catch { /* discard an unhealthy worker */ }
      }
      throw new Error('OCR processing failed or exceeded its time limit', { cause: error });
    }
  }

  private async getWorker(): Promise<Awaited<ReturnType<typeof Tesseract.createWorker>>> {
    if (!this.workerPromise) {
      let expired = false;
      let rejectWorkerFailure!: (error: Error) => void;
      const workerFailure = new Promise<never>((_, reject) => { rejectWorkerFailure = reject; });
      const creation = Promise.race([
        Tesseract.createWorker('eng', 1, {
          langPath: env.TESSERACT_LANG_PATH ?? BUNDLED_ENGLISH_DATA,
          gzip: true,
          logger: () => undefined,
          errorHandler: (error: unknown) => rejectWorkerFailure(
            error instanceof Error ? error : new Error(String(error)),
          ),
        }),
        workerFailure,
      ]).then((worker) => {
        if (expired) void worker.terminate();
        return worker;
      });
      this.workerPromise = withTimeout(creation, OCR_TIMEOUT_MS).catch((error: unknown) => {
        expired = true;
        this.workerPromise = null;
        throw error;
      });
    }
    return this.workerPromise;
  }
}

export function qualityFlagsForText(text: string): string[] {
  const flags: string[] = [];
  const trimmed = text.trim();
  if (!trimmed) flags.push('empty_text');
  else if (trimmed.length < 40) flags.push('suspiciously_short_text');
  const replacementCharacters = (text.match(/\uFFFD/g) ?? []).length;
  if (replacementCharacters >= 2 || (text.length > 0 && replacementCharacters / text.length > 0.01)) {
    flags.push('malformed_characters');
  }
  return flags;
}

export const ocrService = new OcrService();
