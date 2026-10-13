# API Contract

Protected endpoints require `Authorization: Bearer <Supabase access token>`. User records are queried through the authenticated Supabase client and are subject to RLS.

## Health And Auth

- `GET /api/health` returns `{ success, status, timestamp }` and does not require authentication.
- `GET /api/auth/me` returns `{ success, user: { id } }`.

## Documents

- `POST /api/documents` accepts a multipart `file` field containing a PDF or image (maximum 10 MB) and returns `{ success, data: document }`.
- `GET /api/documents` returns the authenticated user's documents.
- `GET /api/documents/:documentId` returns one owned document; unknown or unowned IDs return the same 404 response.
- `POST /api/documents/:documentId/extract` runs extraction and returns candidate facts with their source evidence. Extracted facts remain pending until reviewed.

## Health Records

- `GET /api/health/timeline` accepts optional `from`, `to`, `type`, `limit`, and datetime `cursor` query parameters.
- `GET /api/health/trends?testName=...` accepts optional `from` and `to` datetimes. Results include only verified, source-linked observations. Incompatible or missing units return `incompatible_units` with an empty data array.
- `POST /api/health/summary` returns an AI-generated clinician-review summary with validated source references and an uncertainty flag.

## Copilot

- `POST /api/copilot/chat` accepts `{ "message": "...", "conversationId": "optional UUID" }`.
- Health context is retrieved from the authenticated user's verified, source-linked records. Client-supplied health context is rejected.
- The response is `{ success, data: { answer, sources, uncertainty } }`. Each source identifies a retrieved fact and its source document. Citations not present in retrieved records cause a safe 502 response.

Errors use `{ success: false, error: { message, statusCode } }`. Malformed JSON returns 400; provider failures return a safe error without provider details.
