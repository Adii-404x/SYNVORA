# Document OCR and Extraction

## Supported Inputs

The upload API accepts PDF, JPEG, PNG, and WebP files with a 10 MB upload limit. PDFs are limited to 50 pages. Images are limited to 20 megapixels before OCR, and structured extraction is limited to 120,000 extracted characters. The OCR worker uses English (`eng`) and a 30-second timeout per initialization/recognition operation.

PDF pages with at least 40 characters of embedded text use the PDF text layer. Text-poor pages are rendered individually at 1600 pixels wide and sent to Tesseract.js, so a PDF can mix digital and scanned pages. When OCR is used, any short embedded text is preserved separately instead of silently discarded. Each page records its text, extraction method, OCR engine confidence (or `null`), quality flags, and recognized blocks/bounds where supplied by the engine. Candidate source offsets are zero-based, page-local character offsets; bounding boxes are saved only when the source excerpt can be matched to OCR blocks. Pages with visibly table-like text are flagged for association review; text extraction is not a table-structure engine.

The runtime uses the existing `pdf-parse` renderer and existing `tesseract.js` dependency; no image preprocessing library was added. The OCR worker is reused and serializes recognition jobs. If `TESSERACT_LANG_PATH` is unset, Tesseract.js uses its default English traineddata location, which may require network access on first use. Deployments without outbound access must provision compatible traineddata and set this variable. PDF/OCR processing should run with normal Node worker-thread and memory limits; the app-level caps do not replace container memory/CPU limits.

## Trust and Quality

OCR confidence is the value returned by Tesseract (0-100) and is stored independently from LLM extraction confidence (0-1). The current provider response does not report a validated extraction confidence, so `llm_confidence` remains `null`. Neither score represents clinical correctness. Low OCR confidence, suspiciously short or empty text, malformed replacement characters, invalid/ambiguous dates, questionable numeric forms, and unlocated evidence are flagged for review. Candidates remain pending.

Extracted original values, units, ranges, dates, medication frequency/duration, page number, and the typed model payload are preserved. Values are not normalized or repaired. A candidate's date is never replaced with the report date. Table relationships are requested from the model only when evident in the page text; the current plain-text extraction is not a table-structure engine, so ambiguous rows require human review. A retry creates a new `extraction_runs` row; deterministic document/fact/evidence keys and a partial unique index prevent duplicate candidates. Concurrent requests are blocked by an owner-scoped processing-status claim.

## Limitations

- Handwriting recognition is not supported or verified.
- Rotation detection, deskewing, denoising, and contrast adjustment are not implemented. No image transformation is applied, avoiding unverified loss of decimal points, minus signs, superscripts, or small text.
- OCR and extraction quality depend on scan resolution, language, layout, and legibility. Table accuracy and clinical correctness are not guaranteed.
- Only English OCR is configured. Other languages, including Hindi, are not supported by this OCR service.
- Page-image rendering/OCR requires sufficient CPU and memory; failed pages fail safely rather than becoming verified records.
- Unit tests mock OCR, LLM, and Supabase. Actual `pdf-parse` integration tests cover generated digital and mixed PDFs, including rendering an image-only page; OCR output for that image-only fixture is mocked. The gated Tesseract test runs against a rendered synthetic page only. These tests do not establish production OCR reliability or validate a representative scanned-image corpus.

## Verification

Run the normal mocked checks:

```powershell
npm run build
npm test
```

Run the actual PDF-renderer/Tesseract smoke test (may fetch English traineddata if not provisioned):

```powershell
$env:RUN_OCR_INTEGRATION = '1'
npm test -- tests/integration/ocr-engine.integration.test.ts
Remove-Item Env:RUN_OCR_INTEGRATION
```

The migration `0006_document_ocr_quality.sql` adds nullable confidence/evidence metadata and retry deduplication without changing RLS policies. Review and apply it only to a disposable database first; it has not been applied or verified against PostgreSQL/Supabase in this workspace.
