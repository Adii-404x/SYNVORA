-- Additive extraction provenance and quality metadata. Existing RLS policies remain unchanged.
ALTER TABLE public.health_documents
    ADD COLUMN page_count INTEGER,
    ADD COLUMN extraction_method TEXT,
    ADD COLUMN extraction_quality_flags JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.health_documents
    ADD CONSTRAINT health_documents_page_count_nonnegative
        CHECK (page_count IS NULL OR page_count >= 0),
    ADD CONSTRAINT health_documents_extraction_method_valid
        CHECK (extraction_method IS NULL OR extraction_method IN ('pdf_text', 'pdf_ocr', 'mixed_pdf', 'image_ocr')),
    ADD CONSTRAINT health_documents_extraction_quality_array
        CHECK (jsonb_typeof(extraction_quality_flags) = 'array');

ALTER TABLE public.extraction_runs
    ADD COLUMN page_count INTEGER,
    ADD COLUMN extraction_method TEXT,
    ADD COLUMN ocr_confidence NUMERIC,
    ADD COLUMN quality_flags JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.extraction_runs
    ADD CONSTRAINT extraction_runs_page_count_nonnegative
        CHECK (page_count IS NULL OR page_count >= 0),
    ADD CONSTRAINT extraction_runs_method_valid
        CHECK (extraction_method IS NULL OR extraction_method IN ('pdf_text', 'pdf_ocr', 'mixed_pdf', 'image_ocr')),
    ADD CONSTRAINT extraction_runs_ocr_confidence_range
        CHECK (ocr_confidence IS NULL OR ocr_confidence BETWEEN 0 AND 100),
    ADD CONSTRAINT extraction_runs_quality_array
        CHECK (jsonb_typeof(quality_flags) = 'array');

ALTER TABLE public.extracted_facts
    ADD COLUMN ocr_confidence NUMERIC,
    ADD COLUMN llm_confidence NUMERIC,
    ADD COLUMN source_start_offset INTEGER,
    ADD COLUMN source_end_offset INTEGER,
    ADD COLUMN source_boxes JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN quality_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN dedupe_key TEXT;

ALTER TABLE public.extracted_facts
    ADD CONSTRAINT extracted_facts_ocr_confidence_range
        CHECK (ocr_confidence IS NULL OR ocr_confidence BETWEEN 0 AND 100),
    ADD CONSTRAINT extracted_facts_llm_confidence_range
        CHECK (llm_confidence IS NULL OR llm_confidence BETWEEN 0 AND 1),
    ADD CONSTRAINT extracted_facts_source_offsets_valid
        CHECK (
            (source_start_offset IS NULL AND source_end_offset IS NULL)
            OR (
                source_start_offset IS NOT NULL
                AND source_end_offset IS NOT NULL
                AND source_start_offset >= 0
                AND source_end_offset >= source_start_offset
            )
        ),
    ADD CONSTRAINT extracted_facts_source_boxes_array
        CHECK (jsonb_typeof(source_boxes) = 'array'),
    ADD CONSTRAINT extracted_facts_quality_flags_array
        CHECK (jsonb_typeof(quality_flags) = 'array');

CREATE UNIQUE INDEX extracted_facts_document_dedupe_key_unique
    ON public.extracted_facts (document_id, dedupe_key);

COMMENT ON COLUMN public.extracted_facts.ocr_confidence IS 'Engine-reported OCR confidence (0-100); NULL when unavailable or not applicable.';
COMMENT ON COLUMN public.extracted_facts.llm_confidence IS 'Model-reported extraction confidence (0-1); NULL unless the provider supplies a validated score.';
COMMENT ON COLUMN public.extracted_facts.source_start_offset IS 'Zero-based character offset within the extracted page text.';
COMMENT ON COLUMN public.extracted_facts.source_end_offset IS 'Exclusive character offset within the extracted page text.';
