ALTER TABLE extraction_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY extraction_run_owner_policy ON extraction_runs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM health_documents
            WHERE health_documents.id = extraction_runs.document_id
              AND health_documents.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM health_documents
            WHERE health_documents.id = extraction_runs.document_id
              AND health_documents.user_id = auth.uid()
        )
    );

ALTER TABLE extracted_facts
    ADD COLUMN IF NOT EXISTS display_name TEXT,
    ADD COLUMN IF NOT EXISTS fact_date DATE,
    ADD COLUMN IF NOT EXISTS extraction_method TEXT;

DROP POLICY IF EXISTS obs_owner_policy ON observations;
CREATE POLICY obs_read_owner_policy ON observations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS meds_owner_policy ON medications;
CREATE POLICY meds_read_owner_policy ON medications
    FOR SELECT USING (auth.uid() = user_id);
