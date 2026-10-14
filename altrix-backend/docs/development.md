# Local Development

## Requirements

- Node.js compatible with the repository's TypeScript and Vitest versions.
- A Supabase project with the private `medical-documents` Storage bucket and migrations applied to a non-production database first.
- For cloud AI, a Groq API key. Set `GROQ_API_KEY` in the backend environment to use `openai/gpt-oss-20b` (or set `GROQ_MODEL` to another compatible model). This is selected automatically when a key is present; set `AI_PROVIDER=ollama` to force local Ollama at `OLLAMA_BASE_URL` using `OLLAMA_MODEL`. Setting `AI_PROVIDER=groq` without a key is a startup configuration error.

## Setup

From `altrix-backend` in PowerShell:

```powershell
Copy-Item .env.example .env
npm install
npm run build
npm test
npm run dev
```

Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the local `.env`. To use Groq, set `GROQ_API_KEY` there; keep it server-side and never put it in a `VITE_*` variable. Keep `.env` private and do not use the optional service-role key for normal requests. The API listens on port 3000 by default; health check: `http://localhost:3000/api/health`.

## Database Safety

Review and apply migrations in order: `0001_initial_schema.sql` through `0007_auth_profile_provisioning.sql`, followed by the timestamped `tighten_data_api_grants` migration. In Supabase Dashboard, run each file from `supabase/migrations` in the SQL Editor, in order. Ensure `public` is enabled in the project's Data API settings. The initial and follow-up migrations grant only the table operations needed by the app to `authenticated`, revoke direct table access from `anon`, and remove Supabase's default table, function, and sequence grants for future objects created by `postgres` in `public`. RLS policies installed by `0002` and refined by later migrations provide row-level controls. Start with a dedicated hackathon or disposable Supabase project and verify RLS, function grants, candidate-review transitions, atomic copilot writes, OCR metadata constraints, and Auth-trigger behavior. Migration `0002` preserves same-named policies created by `0001`; `0004` aborts when duplicate verified fact links exist; `0006` is additive and preserves existing RLS; `0007` creates missing profile rows for existing Auth users and installs an ID-only profile trigger for new users. Do not apply migrations to production before development verification, backup, and rollback review.

The SQL policies assume Supabase's `auth` and `storage` schemas. They create row-access policies but do not create the bucket. In Supabase Storage, create `medical-documents` as private, set a 10 MB limit, and allow `application/pdf`, `image/jpeg`, `image/png`, and `image/webp`. Do not make this bucket public. The API creates 60-second signed URLs only after checking document ownership.

## Verification Boundaries

`npm test` runs Vitest unit tests with mocked Supabase, LLM, and image-OCR behavior, plus real generated digital/mixed PDF parser and renderer checks. OCR on the image-only PDF fixture is mocked. Text-side synthetic fixtures cover table associations, ambiguous values, and low-quality cases; they are not physical scan images. The Tesseract smoke test is skipped unless `RUN_OCR_INTEGRATION=1`. Tests do not verify PostgreSQL function execution, live Auth/RLS/Storage, production OCR quality, or a browser-to-Supabase journey. See [ocr.md](./ocr.md) for limits and setup.

The workspace root contains the Vite frontend. Its `VITE_*` values are public build-time settings; all server-only values stay in this backend `.env`.
