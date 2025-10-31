import { Router } from 'express';
import { config } from '../config.js';

export const notificationsRouter = Router();

notificationsRouter.post('/telegram', async (req, res) => {
  try {
    if (!config.telegramBotToken || !config.telegramChatId) {
      return res.status(501).json({ error: 'Telegram not configured' });
    }
    const { text } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' });
    }
    const tgRes = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: config.telegramChatId, text, parse_mode: 'HTML' }),
    });
    if (!tgRes.ok) {
      return res.status(502).json({ error: 'telegram_failed' });
    }
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'internal_error' });
  }
});


