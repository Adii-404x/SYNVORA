import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { chatSchema } from "../schemas/copilot.schema";
import { llmService } from "../services/llm/llm.service";
import { HEALTH_COPILOT_SYSTEM_PROMPT } from "../prompts/health-copilot.prompt";
import { ApiError } from "../utils/api-error";

const router = Router();

router.post("/chat", authenticate, validate(chatSchema), async (req, res, next) => {
  try {
    const { message, context } = chatSchema.shape.body.parse(req.body);

    // Grounding the prompt with provided context
    const contextString = context
      ? "\\nUser-provided, UNVERIFIED context (do not describe as verified health records):\\n" +
        context.map(f => `- ${f.type}: ${f.value} ${f.unit || ""} (Source label: ${f.source || "unknown"})`).join("\\n")
      : "No health context was provided.";

    const prompt = `User Message: ${message}\\n\\nContext:\\n${contextString}`;

    const response = await llmService.chat({
      prompt,
      systemPrompt: HEALTH_COPILOT_SYSTEM_PROMPT,
    });

    res.status(200).json({
      success: true,
      answer: response.content,
      // All current request context is client supplied and therefore unverified.
      uncertainty: true,
      sources: [],
    });
  } catch (error) {
    next(error);
  }
});

export default router;

