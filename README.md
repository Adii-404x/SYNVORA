# Altrix Labs

Altrix Labs is a personal health-record copilot with a React/Vite frontend and an Express 5 + TypeScript API. Its connected flows use Supabase Auth, user-scoped REST requests, private document storage, candidate review, verified records, timeline/trends, grounded copilot, summary, and FHIR export. Live Supabase and hosted AI access are not configured in this checkout.

## Workspace

- `src/`: React frontend (Vite, TypeScript, Tailwind CSS).
- `altrix-backend/`: Express API, Supabase integrations, OCR/document processing, migrations, and Vitest tests.
- `Frontend/`: separate static UI prototype; not used by the Vite app.

## Local Setup

Use Node.js 22 or newer.

1. Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_API_BASE_URL`. Only a publishable/anon key belongs in the frontend. Never add a service-role or secret key to a `VITE_` variable.
2. In the workspace root, run `npm ci` and `npm run dev`. Vite serves the frontend at `http://localhost:5173`.
3. In a second terminal, run `cd altrix-backend`, copy `.env.example` to `.env`, set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`, then run `npm ci` and `npm run dev`. The API listens at `http://localhost:3000`.
4. Configure the Supabase Auth site URL and allowed redirect URL to the frontend origin. The current UI uses email/password sign-up and sign-in.
5. Create the private `medical-documents` Storage bucket with a 10 MB limit and PDF/JPEG/PNG/WebP allowlist. Apply reviewed migrations to a development project in numeric order. The migrations establish ownership policies; bucket creation is a separate Supabase Storage action.
6. Configure a reachable Ollama-compatible endpoint and selected model in the backend only if copilot or AI summary generation is needed. Current checked-in runtime defaults are local Ollama at `http://localhost:11434` and model `gemma2`; the local ignored `.env` in this checkout selects `qwen3.8:27b`. Model availability has not been verified.

## Environment Variables

Frontend `.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`.

Backend `.env`: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `PORT`, `NODE_ENV`, `FRONTEND_ORIGIN`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, and optionally `TESSERACT_LANG_PATH`. `SUPABASE_SERVICE_ROLE_KEY` is optional and only used by the audit-log service; ordinary authenticated data requests use the caller's access token and publishable key.

## Checks

```powershell
npm run build
npm run lint
cd altrix-backend
npm run build
npm test
```

The backend suite uses mocked Supabase and model responses, plus actual digital/mixed PDF parser/renderer checks; it does not verify a live database, RLS, Auth, Storage, remote model, or deployed OCR. Tests and fixtures use synthetic data only. The supported upload formats are PDF, JPEG, PNG, and WebP, maximum 10 MB; see `altrix-backend/docs/ocr.md` for OCR limitations.

## Release State

`https://github.com/Adii-404x/ALTRIX-LABS-` is the target repository. No deployment URL exists yet. The configured Supabase URL in the ignored local backend `.env` is a placeholder (`example.supabase.co`), so the database/Auth/Storage journey is not live-verified. Deployment also requires real Supabase project settings and a cloud-reachable model endpoint; local Ollama is not reachable from a cloud host by default. Do not use real patient records for demos.

See [the staging deployment runbook](docs/deployment.md) for the Vercel/Render setup, environment variables, health checks and release gates.
