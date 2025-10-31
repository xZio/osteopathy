/* eslint-env node */
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { config, assertConfig } from './config.js';
import { corsMiddleware } from './middleware/cors.js';
import { publicLimiter, loginLimiter } from './middleware/rateLimit.js';
import { authRouter } from './routes/auth.js';
import { requireAuth } from './middleware/auth.js';
import { appointmentsRouter } from './routes/appointments.js';
import { scheduleRouter } from './routes/schedule.js';
import { publicRouter } from './routes/public.js';
import { notificationsRouter } from './routes/notifications.js';

const app = express();
const port = config.port;
const mongoUri = config.mongoUri;

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.set('trust proxy', 1);
app.use(corsMiddleware);
app.use(express.json());

app.get('/health', (_req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({ status: 'ok', db: isDbConnected ? 'connected' : 'disconnected' });
});

async function start() {
  try {
    assertConfig();
    if (!mongoUri) {
      console.warn('MONGODB_URI is not set. Server will start without DB connection.');
    } else {
      await mongoose.connect(mongoUri);
      console.log('Connected to MongoDB');
    }

    // rate limit sensitive/public routes
    app.use('/auth', loginLimiter, authRouter);
    app.use('/appointments', appointmentsRouter);
    app.use('/schedule', scheduleRouter);
    app.use('/public', publicLimiter, publicRouter);
    app.use('/notifications', publicLimiter, notificationsRouter);

    // Example protected route placeholder
    app.get('/admin/ping', requireAuth, (_req, res) => {
      res.json({ ok: true });
    });

    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

start();


