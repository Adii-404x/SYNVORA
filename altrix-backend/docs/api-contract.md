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

## Candidate Facts

- `GET /api/facts/pending` lists up to 100 pending candidate facts owned by the authenticated user, including their source document and persisted typed extraction payload.
- `POST /api/facts/:factId/confirm` confirms a pending observation or medication atomically. An observation whose extracted date is absent or invalid requires `{ "observationDate": "YYYY-MM-DD" }` as an explicit reviewer correction. Clinical codes are not inferred and may remain absent.
- `POST /api/facts/:factId/reject` rejects a pending candidate without creating a verified record. Repeating the same decision is idempotent; conflicting state transitions return 409.
- Confirmed facts retain their original extraction payload, evidence, document link, page number, extraction method, reviewer, and review timestamp.

## Health Records

- `GET /api/health/timeline` accepts optional `from`, `to`, `type`, `limit`, and datetime `cursor` query parameters.
- `GET /api/health/trends?testName=...` accepts optional `from` and `to` datetimes. Results include only verified, source-linked observations. Incompatible or missing units return `incompatible_units` with an empty data array.
- `POST /api/health/summary` returns an AI-generated clinician-review summary with validated source references and an uncertainty flag.

## Copilot

- `POST /api/copilot/chat` accepts `{ "message": "...", "conversationId": "optional UUID" }`.
- Successful chat turns create a conversation when no ID is supplied and atomically save both messages; the response includes the conversation ID.
- `GET /api/copilot/conversations` lists up to 50 most recently updated conversations owned by the authenticated user.
- `GET /api/copilot/conversations/:conversationId/messages` returns up to the latest 100 messages, only after verifying conversation ownership.
- Health context is retrieved from the authenticated user's verified, source-linked records. Client-supplied health context is rejected.
- The response is `{ success, data: { answer, sources, uncertainty } }`. Each source identifies a retrieved fact and its source document. Citations not present in retrieved records cause a safe 502 response.


Errors use `{ success: false, error: { message, statusCode } }`. Malformed JSON returns 400; provider failures return a safe error without provider details.

## FHIR Export

- `POST /api/exports/fhir` requires authentication and represents an explicit user-initiated export.
- It returns an `application/fhir+json` FHIR R4 `Bundle` of type `collection`, assembled from the authenticated user's verified, source-linked records.
- Observations retain their original test name, reported value, unit, printed reference range, date and source document. No clinical code or UCUM unit is inferred.
- Medication statements are included only when the source, start date and supported status are present; incomplete records are omitted rather than assigned invented values. The bundle is generated in the response and is not persisted or sent to a third party.
