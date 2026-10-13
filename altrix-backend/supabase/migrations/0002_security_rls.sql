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

-- These policies also exist in the initial migration. Preserve them when present
-- so a clean ordered migration run does not fail on duplicate policy names.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profile_owner_policy') THEN
        CREATE POLICY profile_owner_policy ON profiles FOR ALL USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'health_documents' AND policyname = 'doc_owner_policy') THEN
        CREATE POLICY doc_owner_policy ON health_documents FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'extracted_facts' AND policyname = 'facts_owner_policy') THEN
        CREATE POLICY facts_owner_policy ON extracted_facts FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'observations' AND policyname = 'obs_owner_policy') THEN
        CREATE POLICY obs_owner_policy ON observations FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'medications' AND policyname = 'meds_owner_policy') THEN
        CREATE POLICY meds_owner_policy ON medications FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'copilot_conversations' AND policyname = 'conv_owner_policy') THEN
        CREATE POLICY conv_owner_policy ON copilot_conversations FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'copilot_messages' AND policyname = 'msg_owner_policy') THEN
        CREATE POLICY msg_owner_policy ON copilot_messages FOR ALL USING (
            EXISTS (
                SELECT 1 FROM copilot_conversations
                WHERE id = conversation_id AND user_id = auth.uid()
            )
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_logs' AND policyname = 'audit_read_policy') THEN
        CREATE POLICY audit_read_policy ON audit_logs FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_upload_policy') THEN
        CREATE POLICY storage_upload_policy ON storage.objects FOR INSERT WITH CHECK (
            bucket_id = 'medical-documents' AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_read_policy') THEN
        CREATE POLICY storage_read_policy ON storage.objects FOR SELECT USING (
            bucket_id = 'medical-documents' AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_modify_policy') THEN
        CREATE POLICY storage_modify_policy ON storage.objects FOR ALL USING (
            bucket_id = 'medical-documents' AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Deny all updates/deletes to audit logs for authenticated users (handled by service role)
-- By default, no policies for UPDATE/DELETE means denied.

-- Storage Security: medical-documents bucket
-- Note: Bucket creation is usually via Dashboard, but policies can be in SQL
-- We assume bucket name is 'medical-documents'
