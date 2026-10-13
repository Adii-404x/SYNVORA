import { describe, expect, it } from 'vitest';
import { validateImagePixelLimit } from '../../src/utils/image-limits';

function pngHeader(width: number, height: number) {
  const data = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(data);
  data.writeUInt32BE(width, 16);
  data.writeUInt32BE(height, 20);
  return data;
}

describe('image processing resource limits', () => {
  it('accepts a normal synthetic page image', () => {
    expect(() => validateImagePixelLimit(pngHeader(3000, 4000))).not.toThrow();
  });

  it('rejects decompression-sized image dimensions before OCR', () => {
    expect(() => validateImagePixelLimit(pngHeader(5000, 5000))).toThrow(/pixel limit/);
  });

  it('rejects malformed image headers safely', () => {
    expect(() => validateImagePixelLimit(Buffer.from('not an image'))).toThrow(/malformed/);
  });
});
