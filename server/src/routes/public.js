import { Router } from 'express';
import { Schedule } from '../models/Schedule.js';
import { Appointment } from '../models/Appointment.js';
import { generateDailySlots, subtractAppointmentsFromSlots } from '../utils/availability.js';

export const publicRouter = Router();

// GET /public/availability?start=YYYY-MM-DD&end=YYYY-MM-DD
publicRouter.get('/availability', async (req, res) => {
  const start = req.query.start;
  const end = req.query.end;
  if (!start || !end) return res.status(400).json({ error: 'start and end are required (YYYY-MM-DD)' });

  const schedule = (await Schedule.findOne().lean()) || { days: [], overrides: [], timezone: 'Europe/Moscow' };
  const timezone = schedule.timezone || 'Europe/Moscow';

  const days = [];
  for (let d = new Date(start); d <= new Date(end); d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    days.push(iso);
  }

  const result = {};
  for (const dateISO of days) {
    const daySlots = generateDailySlots({ dateISO, schedule, timezone });
    if (daySlots.length === 0) {
      result[dateISO] = [];
      continue;
    }
    const dayStart = new Date(`${dateISO}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateISO}T23:59:59.999Z`);
    const appts = await Appointment.find({
      startsAt: { $lt: dayEnd },
      endsAt: { $gt: dayStart },
      status: 'scheduled',
    }).lean();
    result[dateISO] = subtractAppointmentsFromSlots(daySlots, appts);
  }

  res.json(result);
});

// POST /public/appointments  (create booking without auth, with overlap check)
publicRouter.post('/appointments', async (req, res) => {
  const { fullName, phone, note = '', startsAt, endsAt } = req.body || {};
  if (!fullName || !phone || !startsAt || !endsAt) {
    return res.status(400).json({ error: 'fullName, phone, startsAt, endsAt are required' });
  }

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (!(start instanceof Date) || isNaN(start) || !(end instanceof Date) || isNaN(end) || start >= end) {
    return res.status(400).json({ error: 'Invalid startsAt/endsAt' });
  }

  // Check overlap with existing scheduled appointments
  const conflict = await Appointment.findOne({
    status: 'scheduled',
    startsAt: { $lt: end },
    endsAt: { $gt: start },
  }).lean();
  if (conflict) return res.status(409).json({ error: 'Slot already booked' });

  const created = await Appointment.create({ fullName, phone, note, startsAt: start, endsAt: end, source: 'public' });
  res.status(201).json({ id: created._id });
});


