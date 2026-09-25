// api/log-attempt.js
// רישום של כל ניסיון: מי התקשר, מתי, והאם הצליח

import fs from 'fs/promises';
import path from 'path';

const LOG_FILE = '/tmp/voicemail_logs.json';

async function readLogs() {
  try {
    const data = await fs.readFile(LOG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeLogs(logs) {
  await fs.writeFile(LOG_FILE, JSON.stringify(logs, null, 2));
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

    // שמור רק את ה-1000 הרשומות האחרונות
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }

    await writeLogs(logs);

    return res.status(200).json({ ok: true, id: entry.id });
  } catch (err) {
    console.error('Log error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to log attempt' });
  }
}
