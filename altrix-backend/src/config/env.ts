import { z } from "zod";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  AI_PROVIDER: z.enum(["groq", "ollama"]).optional(),
  GROQ_API_KEY: z.string().min(1).optional(),
  GROQ_MODEL: z.string().min(1).default("openai/gpt-oss-20b"),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().min(1).default("gemma2"),
  TESSERACT_LANG_PATH: z.string().min(1).optional(),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const invalidKeys = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))];
  console.error("Invalid environment configuration:", invalidKeys.join(", "));
  process.exit(1);
}

const aiProvider = parsed.data.AI_PROVIDER ?? (parsed.data.GROQ_API_KEY ? "groq" : "ollama");
if (aiProvider === "groq" && !parsed.data.GROQ_API_KEY) {
  console.error("Invalid environment configuration: GROQ_API_KEY is required when AI_PROVIDER=groq");
  process.exit(1);
}

export const env = { ...parsed.data, AI_PROVIDER: aiProvider };
