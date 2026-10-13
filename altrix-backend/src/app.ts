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

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/health/timeline', timelineRoutes);
app.use('/api/health/trends', trendsRoutes);
app.use('/api/health/summary', summaryRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;