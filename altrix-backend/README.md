# Altrix Labs API

Express 5 API using strict TypeScript, Zod, Supabase Auth/PostgreSQL/Storage, PDF text extraction, Tesseract.js, and an isolated Ollama provider adapter.

## Setup

```powershell
npm ci
Copy-Item .env.example .env
# Set Supabase URL and publishable key, then:
npm run dev
```

The default API URL is `http://localhost:3000`. The frontend runs at `http://localhost:5173`; configure `FRONTEND_ORIGIN` to the exact browser origin.

## Scripts

- `npm run dev`: development server.
- `npm run build`: TypeScript compilation.
- `npm start`: compiled server.
- `npm test`: Vitest suite.
- `npm run test:watch`: watch mode.
- `npm run lint`: Prettier write command for `src/**/*.ts` (it rewrites files).

## Configuration And Migrations

See [development.md](docs/development.md) for required variables, private Storage bucket setup, migration order, and verification boundaries. API contracts are documented in [api-contract.md](docs/api-contract.md). OCR formats and limitations are in [ocr.md](docs/ocr.md).
