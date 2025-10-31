import cors from 'cors';
import { config } from '../config.js';

function normalizeOrigin(url) {
  if (!url) return '';
  return url.replace(/\/$/, '');
}

function parseOrigins(input) {
  if (!input) return [];
  if (input === '*') return ['*'];
  return input
    .split(',')
    .map((s) => normalizeOrigin(s.trim()))
    .filter(Boolean);
}

const allowed = parseOrigins(config.corsOrigin);

export const corsMiddleware = cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow same-origin/no-origin
    const o = normalizeOrigin(origin);
    if (allowed.includes('*') || allowed.includes(o)) return callback(null, true);
    // Disallow without throwing to ensure a clean CORS failure
    return callback(null, false);
  },
  credentials: true,
});


