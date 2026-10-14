# Synvora

Synvora is a private, source-linked health-record copilot. The production frontend is the React/Vite application in the repository root. It connects to Supabase Auth and a separately hosted API for private document storage, reviewable extraction, verified records, summaries, copilot answers, and FHIR export.

## Deploy the frontend to Vercel

The repository includes a root-level `vercel.json` configured for the Vite single-page app.

1. Import `Adii-404x/SYNVORA` into Vercel and set the **Root Directory** to the repository root (not `Frontend/` or `altrix-backend/`).
2. Use `npm run build` as the build command and `dist` as the output directory. Vercel detects the checked-in `vercel.json` with these settings.
3. Set these environment variables for the Vercel deployment:
   - `VITE_SUPABASE_URL`: the Supabase project URL.
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: that project's publishable key (or legacy anon key). Never use a service-role or secret key in a `VITE_*` variable.
   - `VITE_API_BASE_URL`: the HTTPS origin of the deployed API followed by `/api`, for example `https://your-api.example.com/api`. Do not use localhost in a Vercel deployment.
4. Deploy the API separately using the root `render.yaml` or another Node hosting service. Configure its Supabase settings, `FRONTEND_ORIGIN` to the Vercel site origin, and an authenticated, cloud-reachable Ollama-compatible model endpoint if AI features are required. A local Ollama server cannot be reached from Vercel or Render.
5. In Supabase, allow the Vercel origin in Auth redirect/site URL settings and keep the `medical-documents` bucket private. Apply and validate database migrations on a staging project before using a production database.

Vercel's `VITE_*` values are embedded in the public browser bundle. Only the Supabase publishable/anon key belongs there. Keep Supabase secret keys and any model credentials in the API host's server-side environment.

If the sign-in screen reports missing configuration on the deployed site, add the three variables above under **Vercel → Project Settings → Environment Variables** for **Production**, then redeploy. A local `.env.local` file is not uploaded to Vercel.

## Local development

Use Node.js 22 or newer.

1. Copy `.env.example` to `.env.local` and configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_API_BASE_URL`.
2. From the repository root, run `npm ci` and `npm run dev`. Vite serves the frontend at `http://localhost:5173`.
3. In a second terminal, go to `altrix-backend`, copy `.env.example` to `.env`, configure the Supabase and local Ollama settings, then run `npm ci` and `npm run dev`.
4. Follow [the staging deployment runbook](docs/deployment.md) for database setup, API hosting, environment variables, and release checks.

## Repository layout

- `src/`, `public/`, `index.html`: the Vercel-deployed React application and static assets.
- `altrix-backend/`: the separately hosted Express API, Supabase migrations, and tests.
- `Frontend/`: an older standalone UI prototype retained for reference; it is not used by the root Vite build or Vercel deployment.
- `vercel.json`: Vercel build output and client-side route rewrite.
- `render.yaml`: Render configuration for the backend API.

## Validation

```powershell
npm run build
cd altrix-backend
npm ci
npm run build
npm test
```

Tests use synthetic records and do not replace staging verification of Supabase Auth, RLS, Storage, OCR, the hosted model endpoint, and cross-user access controls. Do not use real patient information in a demo or staging environment.
