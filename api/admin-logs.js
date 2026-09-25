// api/admin-logs.js
// שליפת לוגים מ-Redis (דרך REDIS_URL) - רק למנהל

import { getRedis } from '../lib/redis.js';

const ADMIN_PHONE = '0548548689';

async function readLogs() {
  const redis = getRedis();
  const data = await redis.get('voicemail_logs');
  return data ? JSON.parse(data) : [];
}

export default async function handler(req, res) {
  try {
    const { adminPhone } = req.query;

    // בדוק אם היוזר זה המנהל
    if (adminPhone !== ADMIN_PHONE) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const logs = await readLogs();

    // סטטיסטיקה
    const stats = {
      total: logs.length,
      successful: logs.filter(l => l.success).length,
      failed: logs.filter(l => !l.success).length,
      unique_phones: new Set(logs.map(l => l.phone)).size,
      today: logs.filter(l => {
        const logDate = new Date(l.timestamp).toDateString();
        const today = new Date().toDateString();
        return logDate === today;
      }).length,
    };

    // עיצוב הלוגים - לפי שעון ישראל (השרת רץ ב-UTC כברירת מחדל)
    const logsWithDetails = logs.map(log => ({
      ...log,
      dateTime: new Date(log.timestamp).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' }),
      time: new Date(log.timestamp).toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem' }),
      date: new Date(log.timestamp).toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' }),
    }));

    console.log(`📊 Admin access: ${adminPhone} - ${logs.length} logs`);

    return res.status(200).json({
      ok: true,
      stats,
      logs: logsWithDetails.reverse(),
    });
  } catch (err) {
    console.error('Admin logs error:', err);
    return res.status(500).json({ ok: false, error: 'Server error', details: String(err && err.message || err) });
  }
}
