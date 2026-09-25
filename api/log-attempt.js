// api/log-attempt.js
// רישום של כל ניסיון - שמור ב-Vercel KV (Redis)

import { kv } from '@vercel/kv';

async function readLogs() {
  const data = await kv.get('voicemail_logs');
  if (!data) return [];
  return typeof data === 'string' ? JSON.parse(data) : data;
}

async function writeLogs(logs) {
  // חשוב: בלי try/catch כאן - אם kv.set נכשל (למשל בגלל שאין
  // חיבור KV/Redis תקין), אנחנו רוצים שהשגיאה תעלה החוצה
  // ותוחזר ב-JSON, ולא תיבלע בשקט.
  await kv.set('voicemail_logs', JSON.stringify(logs), { ex: 86400 * 30 });
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
    // מחזירים את השגיאה האמיתית כדי שאפשר יהיה לראות אותה ב-Network tab בדפדפן
    return res.status(500).json({ ok: false, error: 'Failed to log attempt', details: String(err && err.message || err) });
  }
}
