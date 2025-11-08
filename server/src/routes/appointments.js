import { Router } from 'express';
import { Appointment } from '../models/Appointment.js';
import { requireAuth } from '../middleware/auth.js';

export const appointmentsRouter = Router();

// List appointments (admin)
appointmentsRouter.get('/', requireAuth, async (req, res) => {
  const items = await Appointment.find().sort({ startsAt: 1 }).lean();
  res.json(items);
});

// Create appointment (admin)
appointmentsRouter.post('/', requireAuth, async (req, res) => {
  const { fullName, phone, note, startsAt, endsAt } = req.body || {};
  if (!fullName || !phone || !startsAt || !endsAt) {
    return res.status(400).json({ error: 'fullName, phone, startsAt, endsAt are required' });
  }
  const appt = await Appointment.create({ fullName, phone, note, startsAt, endsAt, source: 'admin' });
  res.status(201).json(appt);
});

// Update appointment (admin)
appointmentsRouter.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { fullName, phone, note, startsAt, endsAt } = req.body || {};
  if (!fullName || !phone || !startsAt || !endsAt) {
    return res.status(400).json({ error: 'fullName, phone, startsAt, endsAt are required' });
  }
  const appt = await Appointment.findByIdAndUpdate(
    id,
    { fullName, phone, note, startsAt, endsAt },
    { new: true, runValidators: true }
  );
  if (!appt) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  res.json(appt);
});

// Delete appointment (admin)
appointmentsRouter.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  await Appointment.findByIdAndDelete(id);
  res.status(204).end();
});


