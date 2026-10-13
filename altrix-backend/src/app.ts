import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import copilotRoutes from "./routes/copilot.routes";

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_ORIGIN,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
}));

app.use(express.json({ limit: "1mb" }));

// API Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/copilot", copilotRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

