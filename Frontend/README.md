# Altrix Labs Frontend

Standalone frontend for the Altrix Labs health records API. It contains no sample patient, document, medication, reminder, or chart data. The overview, documents, candidates, timeline, copilot answers, and summaries are loaded from the signed-in user's API.

## Run locally

1. Copy `.env.example` to `.env.local` in this folder.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to your Supabase project's URL and publishable key. Keep service-role keys out of the browser. Allow `http://localhost:5174` as a Supabase Auth redirect URL for local sign-up confirmation.
3. Start the API from `../altrix-backend` with its valid `.env` settings and `npm run dev`.
4. From this folder, run `npm run dev`, then open `http://localhost:5174`.

The development server proxies `/api` to `http://localhost:3000`. For a deployed frontend, set `VITE_API_BASE_URL` to the deployed API origin plus `/api`, and set the backend's `FRONTEND_ORIGIN` to the exact frontend origin.

The Upload screen supports PDF/JPEG/PNG/WebP files and mobile rear-camera capture. Uploaded reports are processed by the API and remain pending until each extracted candidate is reviewed.

Verified results retain the report's printed high/low interpretation for cautious, source-linked summaries and FHIR R4 export. The export is a prototype collection bundle, not an ABDM-integrated or ABDM profile-validated exchange; it does not create or infer an ABHA identifier or clinical terminology code.

## Judge trial account

Use the dedicated hackathon Supabase project for the shared trial account; never seed fictional records into a production or personal project. Apply migrations `0001` through `0007` from `altrix-backend/supabase/migrations` in numeric order using the project's SQL Editor, and ensure `public` is enabled in Data API settings. The initial migration grants only the app's required operations to `authenticated`, revokes direct table access from `anon`, and leaves row access governed by RLS. The backend seeder creates a fictional `Alex Morgan` account, private source PDFs, verified observations and medications, and one source-linked copilot conversation.

In `altrix-backend/.env` (an ignored local file), configure the demo project's `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, server-only `SUPABASE_SECRET_KEY`, `DEMO_EMAIL`, `DEMO_PASSWORD`, and `DEMO_PROJECT_REF_CONFIRM`. The confirmation value must exactly match the project ref in the URL; choose a demo-only password of at least 12 characters. Configure `FRONTEND_ORIGIN=http://localhost:5174`.

In `Frontend/.env.local`, configure the same demo project's `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, plus `VITE_DEMO_EMAIL` and `VITE_DEMO_PASSWORD` matching the seeder values. These two demo credentials are intentionally exposed in the browser for judges; never reuse them for a real account. The UI offers both normal individual sign-up and a one-click shared judge trial. Trial users share the same fictional records and should not enter real health information.

Run `npm run demo:seed` from `altrix-backend` to create or refresh the trial account and seed data. The command refuses to run unless the project ref is explicitly confirmed. It requires the private `medical-documents` bucket and applied migrations; it does not delete unrelated data.
