// api/log-attempt.js
// רישום של כל ניסיון - שמור ב-Redis (דרך REDIS_URL)

import { getRedis } from '../lib/redis.js';

async function readLogs() {
  const redis = getRedis();
  const data = await redis.get('voicemail_logs');
  return data ? JSON.parse(data) : [];
}

async function writeLogs(logs) {
  const redis = getRedis();
  // TTL של 30 יום (בשניות)
  await redis.set('voicemail_logs', JSON.stringify(logs), 'EX', 86400 * 30);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { phone, success, reason = '', messages_count = 0 } = req.body || {};

    if (!phone) {
      return res.status(400).json({ ok: false, error: 'Phone number required' });
    }

    const logs = await readLogs();

    const entry = {
      id: Date.now().toString(),
      phone,
      timestamp: new Date().toISOString(),
      success: success === true,
      reason,
      messages_count,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    };

    logs.push(entry);

    // שמור רק את ה-5000 הרשומות האחרונות
    if (logs.length > 5000) {
      logs.splice(0, logs.length - 5000);
    }

    await writeLogs(logs);

    console.log(`✓ רישום: ${phone} - ${success ? 'הצלחה' : 'כשל'} (סה"כ: ${logs.length})`);

    return res.status(200).json({ ok: true, id: entry.id, total: logs.length });
  } catch (err) {
    console.error('Log error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to log attempt', details: String(err && err.message || err) });
  }
}
