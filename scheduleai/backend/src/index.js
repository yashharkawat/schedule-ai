import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';

import schedulesRouter from './routes/schedules.js';
import daysRouter from './routes/days.js';
import stepsRouter from './routes/steps.js';
import sessionsRouter from './routes/sessions.js';
import settingsRouter from './routes/settings.js';
import notificationsRouter from './routes/notifications.js';
import usersRouter from './routes/users.js';
import { sendScheduledNotifications } from './lib/push.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Routes
app.use('/api/users', usersRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/days', daysRouter);
app.use('/api/steps', stepsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/notifications', notificationsRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Cron: check every minute for scheduled notifications
cron.schedule('* * * * *', () => {
  sendScheduledNotifications().catch(console.error);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`ScheduleAI backend running on port ${PORT}`);
});
