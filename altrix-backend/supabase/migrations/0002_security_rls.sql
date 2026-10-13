-- Security and RLS Policies
-- Enable RLS on all user-data tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: User can read/update their own profile
CREATE POLICY profile_owner_policy ON profiles 
    FOR ALL USING (auth.uid() = id);

-- 2. Health Documents: Owner only access
CREATE POLICY doc_owner_policy ON health_documents 
    FOR ALL USING (auth.uid() = user_id);

-- 3. Extracted Facts: Owner only access
CREATE POLICY facts_owner_policy ON extracted_facts 
    FOR ALL USING (auth.uid() = user_id);

-- 4. Observations: Owner only access
CREATE POLICY obs_owner_policy ON observations 
    FOR ALL USING (auth.uid() = user_id);

-- 5. Medications: Owner only access
CREATE POLICY meds_owner_policy ON medications 
    FOR ALL USING (auth.uid() = user_id);

-- 6. Copilot Conversations: Owner only access
CREATE POLICY conv_owner_policy ON copilot_conversations 
    FOR ALL USING (auth.uid() = user_id);

-- 7. Copilot Messages: Access via conversation ownership
CREATE POLICY msg_owner_policy ON copilot_messages 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM copilot_conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

-- 8. Audit Logs: Read-only for users (or restricted), Write-only for system/service-role
-- Users can read their own audit logs
CREATE POLICY audit_read_policy ON audit_logs 
    FOR SELECT USING (auth.uid() = user_id);

-- Deny all updates/deletes to audit logs for authenticated users (handled by service role)
-- By default, no policies for UPDATE/DELETE means denied.

-- Storage Security: medical-documents bucket
-- Note: Bucket creation is usually via Dashboard, but policies can be in SQL
-- We assume bucket name is 'medical-documents'

-- 1. Allow users to upload files to their own folder
CREATE POLICY storage_upload_policy ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'medical-documents' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 2. Allow users to read their own files
CREATE POLICY storage_read_policy ON storage.objects 
    FOR SELECT USING (
        bucket_id = 'medical-documents' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 3. Allow users to update/delete their own files
CREATE POLICY storage_modify_policy ON storage.objects 
    FOR ALL USING (
        bucket_id = 'medical-documents' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

