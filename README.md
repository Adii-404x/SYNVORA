# Altrix Labs

Altrix Labs is a personal health-record copilot project. The repository contains a React/Vite frontend and an Express 5 + TypeScript backend. The frontend still contains prototype screens and mock data; connecting its user journeys to the API is in progress.

## Workspace

- `src/`: React frontend (Vite, TypeScript, Tailwind CSS).
- `altrix-backend/`: Express API, Supabase integrations, document processing, migrations, and Vitest tests.
- `Frontend/`: separate static UI prototype; not the active Vite application.

## Local Development

Use Node.js compatible with the installed Vite and TypeScript versions.

Frontend:

```powershell
npm install
npm run dev
```

Backend, in a separate terminal:

```powershell
cd altrix-backend
npm ci
Copy-Item .env.example .env
npm run dev
```

Configure `.env` with a Supabase project URL and publishable/anon key, and the backend's other required settings. Keep server-only secrets in the backend environment; never place them in frontend variables. See `altrix-backend/README.md` and `altrix-backend/docs/development.md` for backend setup and API details.

## Checks

```powershell
npm run build
npm run lint
cd altrix-backend
npm run build
npm test
```

Database migrations are in `altrix-backend/supabase/migrations/`. Review them against the target database before applying; no production migration should be applied from this repository without explicit review.

The frontend-to-backend journey, live Supabase access, hosted model availability, and deployment are not yet verified. Do not use real patient records in development or demos.
