-- Initial Schema for Altrix Labs Health Copilot
-- 1. Profiles Table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    date_of_birth DATE,
    gender TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Health Documents
CREATE TABLE health_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    processing_status TEXT CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Extraction Runs (Tracking the AI process)
CREATE TABLE extraction_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES health_documents(id) ON DELETE CASCADE NOT NULL,
    run_at TIMESTAMPTZ DEFAULT now(),
    model_used TEXT NOT NULL,
    status TEXT CHECK (status IN ('started', 'completed', 'failed')) DEFAULT 'started',
    raw_response JSONB,
    error_message TEXT
);

-- 4. Extracted Facts (The "Candidate" area)
CREATE TABLE extracted_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    document_id UUID REFERENCES health_documents(id) ON DELETE CASCADE NOT NULL,
    run_id UUID REFERENCES extraction_runs(id) ON DELETE CASCADE NOT NULL,
    fact_type TEXT NOT NULL,
    fact_value TEXT NOT NULL,
    fact_unit TEXT,
    reference_range TEXT,
    source_text TEXT NOT NULL,
    page_number INT,
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    verification_status TEXT CHECK (verification_status IN ('pending', 'confirmed', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Observations (Confirmed Clinical Data)
CREATE TABLE observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    fact_id UUID REFERENCES extracted_facts(id) ON DELETE SET NULL,
    observation_date DATE NOT NULL,
    code TEXT NOT NULL, -- e.g., LOINC code
    display_name TEXT NOT NULL,
    value NUMERIC,
    unit TEXT,
    interpretation TEXT,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Medications (Confirmed Clinical Data)
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    fact_id UUID REFERENCES extracted_facts(id) ON DELETE SET NULL,
    drug_name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT CHECK (status IN ('active', 'completed', 'discontinued')),
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Copilot Conversations
CREATE TABLE copilot_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    started_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Copilot Messages
CREATE TABLE copilot_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES copilot_conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    citations JSONB, -- Array of {fact_id, document_id}
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_health_docs_user ON health_documents(user_id);
CREATE INDEX idx_extracted_facts_user ON extracted_facts(user_id);
CREATE INDEX idx_extracted_facts_doc ON extracted_facts(document_id);
CREATE INDEX idx_observations_user ON observations(user_id);
CREATE INDEX idx_medications_user ON medications(user_id);
CREATE INDEX idx_copilot_conv_user ON copilot_conversations(user_id);
CREATE INDEX idx_copilot_msg_conv ON copilot_messages(conversation_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

