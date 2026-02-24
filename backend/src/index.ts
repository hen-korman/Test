import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './middleware/logger';
import employeesRoutes from './routes/employees.routes';
import groupsRoutes from './routes/groups.routes';
import templatesRoutes from './routes/templates.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use('/api/employees', employeesRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/templates', templatesRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mockMode: {
      hibob: !process.env.HIBOB_SERVICE_USER_ID,
      slack: !process.env.SLACK_BOT_TOKEN,
    },
  });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Mock mode: HiBob=${!process.env.HIBOB_SERVICE_USER_ID}, Slack=${!process.env.SLACK_BOT_TOKEN}`);
});

export default app;
