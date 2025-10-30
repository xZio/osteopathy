import { DateTime } from 'luxon';

function minutesToDateTime(dateISO, minute, timezone) {
  const base = DateTime.fromISO(dateISO, { zone: timezone }).startOf('day');
  return base.plus({ minutes: minute });
}

export function generateDailySlots({ dateISO, schedule, timezone }) {
  const override = (schedule.overrides || []).find((o) => o.date === dateISO);
  const daySlots = ((schedule.days || []).find((d) => d.weekday === (DateTime.fromISO(dateISO, { zone: timezone }).weekday % 7))?.slots) || [];
  const slotsDef = (override?.slots ?? daySlots);
  const result = [];
  for (const s of slotsDef) {
    const start = minutesToDateTime(dateISO, s.startMinute, timezone);
    const end = minutesToDateTime(dateISO, s.endMinute, timezone);
    const duration = s.durationMinutes;
    let cursor = start;
    while (cursor.plus({ minutes: duration }) <= end) {
      result.push({
        startsAt: cursor.toUTC().toISO(),
        endsAt: cursor.plus({ minutes: duration }).toUTC().toISO(),
      });
      cursor = cursor.plus({ minutes: duration });
    }
  }
  return result;
}

export function subtractAppointmentsFromSlots(slots, appointments) {
  const appts = appointments.map((a) => ({
    startsAt: new Date(a.startsAt).getTime(),
    endsAt: new Date(a.endsAt).getTime(),
  }));
  return slots.filter((slot) => {
    const s = new Date(slot.startsAt).getTime();
    const e = new Date(slot.endsAt).getTime();
    return !appts.some((a) => Math.max(a.startsAt, s) < Math.min(a.endsAt, e));
  });
}


