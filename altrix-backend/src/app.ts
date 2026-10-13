import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/error-handler';
import { notFound } from './middleware/not-found';
import { apiLimiter, authLimiter } from './middleware/rate-limiter';
import authRoutes from './routes/auth.routes';
import copilotRoutes from './routes/copilot.routes';
import healthRoutes from './routes/health.routes';
import documentRoutes from './routes/documents.routes';
import timelineRoutes from './routes/timeline.routes';
import trendsRoutes from './routes/trends.routes';
import summaryRoutes from './routes/summary.routes';
import factsRoutes from './routes/facts.routes';
import exportsRoutes from './routes/exports.routes';
import conversationsRoutes from './routes/conversations.routes';
import healthRecordsRoutes from './routes/health-records.routes';
import { env } from './config/env';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api/copilot/conversations', conversationsRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/facts', factsRoutes);
app.use('/api/exports', exportsRoutes);
app.use('/api/health/timeline', timelineRoutes);
app.use('/api/health/records', healthRecordsRoutes);
app.use('/api/health/trends', trendsRoutes);
app.use('/api/health/summary', summaryRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
