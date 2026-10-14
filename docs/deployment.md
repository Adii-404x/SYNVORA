# Staging Deployment

## Topology

- Frontend: Vercel static Vite build from the workspace root.
- API: Render Node web service using `render.yaml` and `altrix-backend` as its root directory.
- Auth, PostgreSQL and private document storage: Supabase.
- Inference: an authenticated, cloud-reachable Ollama-compatible endpoint. A developer laptop's `localhost` is not reachable from Render.

Vercel documents Vite builds and exposes build-time variables prefixed with `VITE_`. Render documents Node web services, environment settings and HTTP health checks. This topology keeps the long-running OCR/API process separate from the static frontend. Render's filesystem is ephemeral by default; documents must remain in Supabase Storage, not local disk.

## Configure Staging

1. Create a non-production Supabase project. Review migrations `0001` through `0007` and validate them on a disposable database before applying them to staging. Do not configure automated migration-on-deploy. Create the private `medical-documents` bucket with a 10 MB limit and PDF/JPEG/PNG/WebP allowlist. Confirm Storage policies and Auth redirect URLs for the eventual Vercel domain.
2. Create a Render web service from the GitHub repository using `render.yaml`. The blueprint selects Render's free plan. Set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and the exact Vercel `FRONTEND_ORIGIN` when prompted. The free service may spin down when idle and can be slow on its first request; OCR may exceed its available resources. Only configure `SUPABASE_SERVICE_ROLE_KEY` if the server-side audit logger needs it; it must never be placed in frontend variables.
3. Configure the Vercel project with the workspace root as its root directory and these build-time values:
   - `VITE_SUPABASE_URL`: staging project URL.
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: staging publishable/anon key only.
   - `VITE_API_BASE_URL`: the Render API origin followed by `/api`.
4. Deploy the API, record its HTTPS origin, then set that exact origin plus `/api` as `VITE_API_BASE_URL` and the Vercel origin as Render's `FRONTEND_ORIGIN`. Redeploy both after configuration changes.
5. Verify `GET /api/health`, Auth registration/login, signed-in `/api/auth/me`, private bucket upload/read, candidate review, timeline, copilot and summary using synthetic records only. Test cross-user denial with two staging accounts before inviting demo users.

## Runtime Notes

Use Node.js 22 or newer for both projects. Render's service uses `npm ci`, `npm run build`, and `npm start`; its HTTP health check is `/api/health`. The API applies in-memory rate limits and serializes OCR through a bounded in-process queue, so begin with one service instance. Do not attach persistent local storage for patient documents.

PDF parsing/rendering and Tesseract.js run inside Node. Tesseract may fetch English traineddata on first use unless `TESSERACT_LANG_PATH` points to a provisioned compatible copy. Confirm the selected Render plan has enough memory/CPU and outbound access for that workload. Current OCR is English-only; handwriting, deskew/rotation preprocessing and dependable table structure are not supported or verified. Upload and per-document limits are described in [the OCR notes](../altrix-backend/docs/ocr.md).

The checked-in model adapter targets Ollama. No hosted model endpoint or credentials are configured in this repository. The API can run without a model endpoint, but copilot, summary generation, and AI extraction will be unavailable until the owner provisions and configures a cloud-reachable model service in Render. Do not place model credentials in Vercel.

## Release Gate and Rollback

Do not deploy to production until staging migration/RLS checks, Auth/Storage tests, OCR runtime tests, model failure handling, and a two-user ownership test pass. Apply reviewed migrations manually after a database backup; the repository has no validated automated rollback for these schema changes. If a release fails, roll back the frontend/API deployment to the previous application version, then assess database compatibility before any schema rollback. Do not drop user data or reverse additive migrations blindly.

No staging or production service has been created from this checkout. These instructions and provider configs are not evidence of a live deployment.
