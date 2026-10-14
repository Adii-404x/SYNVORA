ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES
    FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    REVOKE EXECUTE ON FUNCTIONS
    FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    REVOKE EXECUTE ON FUNCTIONS
    FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    REVOKE USAGE, SELECT ON SEQUENCES
    FROM anon, authenticated, service_role;

REVOKE ALL ON
    public.profiles,
    public.health_documents,
    public.extraction_runs,
    public.extracted_facts,
    public.observations,
    public.medications,
    public.copilot_conversations,
    public.copilot_messages,
    public.audit_logs
FROM PUBLIC, anon, authenticated;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;

GRANT SELECT, INSERT, UPDATE ON
    public.health_documents,
    public.extraction_runs,
    public.extracted_facts
TO authenticated;

GRANT SELECT ON
    public.observations,
    public.medications,
    public.copilot_conversations,
    public.copilot_messages,
    public.audit_logs
TO authenticated;

REVOKE ALL ON storage.objects FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON storage.objects TO authenticated;