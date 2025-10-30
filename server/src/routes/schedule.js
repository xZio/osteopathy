import { Router } from 'express';
import { Schedule } from '../models/Schedule.js';
import { requireAuth } from '../middleware/auth.js';

export const scheduleRouter = Router();

// Get current schedule (admin)
scheduleRouter.get('/', requireAuth, async (_req, res) => {
  const doc = await Schedule.findOne().lean();
  res.json(doc || { days: [], overrides: [], timezone: 'Europe/Moscow' });
});

// Upsert schedule (admin)
scheduleRouter.put('/', requireAuth, async (req, res) => {
  const { days = [], overrides = [], timezone = 'Europe/Moscow' } = req.body || {};
  const doc = await Schedule.findOneAndUpdate(
    {},
    { days, overrides, timezone },
    { upsert: true, new: true }
  );
  res.json(doc);
});


