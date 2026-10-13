# Altrix Labs Backend

AI-Powered Personal Health Copilot Backend.

## Project Structure
- src/: Source code
  - config/: Environment and global configuration.
  - middleware/: Request processing pipeline.
  - outes/: API endpoint definitions.
  - controllers/: Request handling logic.
  - services/: Core business logic and domain services.
  - integrations/: Third-party API clients (Supabase, Ollama, OCR).
  - schemas/: Validation schemas.
  - jobs/: Background processing tasks.
  - utils/: Shared utility functions.
- supabase/: Database migrations and seed data.
- 	ests/: Testing suite (unit, integration, security).
- docs/: API documentation and contracts.

## Planned Modules
- Document OCR & Parsing
- Fact Extraction (Medical Entity Recognition)
- Health Timeline Generation
- AI Copilot (RAG based on health facts)
- FHIR-compliant Data Export
