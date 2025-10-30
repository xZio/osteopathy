import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    note: { type: String, default: '' },
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, required: true },
    status: { type: String, enum: ['scheduled', 'cancelled', 'completed'], default: 'scheduled' },
    source: { type: String, enum: ['admin', 'public'], default: 'admin' },
  },
  { timestamps: true }
);

appointmentSchema.index({ startsAt: 1, endsAt: 1 });

export const Appointment = mongoose.model('Appointment', appointmentSchema);


