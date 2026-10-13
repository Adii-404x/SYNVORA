# Local Development

## Requirements

- Node.js compatible with the repository's TypeScript and Vitest versions.
- A Supabase project with the private `medical-documents` Storage bucket and migrations applied to a non-production database first.
- Ollama reachable at the configured `OLLAMA_BASE_URL` with `qwen3.8:27b` available locally. No cloud model credentials are used by this provider.

## Setup

From `altrix-backend` in PowerShell:

```powershell
Copy-Item .env.example .env
npm install
npm run build
npm test
npm run dev
```

Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the local `.env`. Keep `.env` private and do not use the optional service-role key for normal requests. The API listens on port 3000 by default; health check: `http://localhost:3000/api/health`.

## Database Safety

Apply migrations in numeric order: `0001_initial_schema.sql` through `0005_atomic_copilot_turns.sql`. Start with a disposable Supabase/PostgreSQL project and verify the RLS policies, RPC ownership checks, candidate review transitions, and atomic copilot writes there. Migration `0002` preserves same-named policies created by `0001`; migration `0004` aborts before alteration when duplicate verified fact links exist. Neither has been run against a live database in this workspace. Do not apply these files to production until disposable-database verification and a backup/rollback review are complete.

The SQL policies assume Supabase's `auth` and `storage` schemas. The migration files configure Storage policies but do not create the bucket; create `medical-documents` as a private bucket with an appropriate 10 MB upload limit and PDF/JPEG/PNG/WebP MIME allowlist.

## Verification Boundaries

`npm test` runs Vitest unit tests with mocked Supabase and LLM behavior. It does not test PostgreSQL function execution, live Supabase RLS, OCR quality, or a browser journey. The workspace has no local frontend package. The separate GitHub Vite prototype currently uses mock health data and is not connected to this API; do not present its sample records as live patient data.
