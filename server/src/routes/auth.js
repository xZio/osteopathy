import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  if (username !== config.adminUsername) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!config.adminPasswordHash) {
    return res.status(500).json({ error: 'Admin password is not configured' });
  }

  const ok = await bcrypt.compare(password, config.adminPasswordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ role: 'admin', username }, config.jwtSecret, { expiresIn: '12h' });
  res.json({ token });
});


