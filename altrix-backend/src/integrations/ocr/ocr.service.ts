import { ocrService } from '../../services/documents/ocr.service';
import { ApiError } from '../../utils/api-error';

type OcrInput = Buffer | { buffer: Buffer; mimetype?: string };

export class OcrService {
	/** Extracts text from an uploaded image or its raw buffer. */
	async extractText(input: OcrInput, _language = 'eng'): Promise<string> {
		const image = Buffer.isBuffer(input) ? input : input?.buffer;

		if (!image?.length) {
			throw new ApiError(400, 'An image file is required for OCR.');
		}

		return (await ocrService.extractTextFromImage(image)).text;
	}
}
