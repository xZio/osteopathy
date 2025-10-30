import mongoose from 'mongoose';

const dayScheduleSchema = new mongoose.Schema(
  {
    weekday: { type: Number, min: 0, max: 6, required: true },
    // minutes from 00:00, e.g., 9:30 => 570
    slots: [
      {
        startMinute: { type: Number, required: true },
        endMinute: { type: Number, required: true },
        durationMinutes: { type: Number, required: true },
      },
    ],
  },
  { _id: false }
);

const scheduleSchema = new mongoose.Schema(
  {
    timezone: { type: String, default: 'Europe/Moscow' },
    days: { type: [dayScheduleSchema], default: [] },
    overrides: {
      type: [
        {
          date: { type: String, required: true }, // YYYY-MM-DD
          slots: [
            { startMinute: Number, endMinute: Number, durationMinutes: Number },
          ],
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const Schedule = mongoose.model('Schedule', scheduleSchema);


