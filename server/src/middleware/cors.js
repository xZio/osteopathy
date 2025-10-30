import cors from 'cors';
import { config } from '../config.js';

function parseOrigins(input) {
  if (!input) return [];
  if (input === '*') return ['*'];
  return input.split(',').map((s) => s.trim()).filter(Boolean);
}

const allowed = parseOrigins(config.corsOrigin);

export const corsMiddleware = cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow same-origin/no-origin
    if (allowed.includes('*') || allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
});


