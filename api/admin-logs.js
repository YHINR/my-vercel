// api/admin-logs.js
// שליפת לוגים - רק למנהל שנכנס עם הטלפון שלו

import fs from 'fs/promises';

const ADMIN_PHONE = '0548548689';
const LOG_FILE = '/tmp/voicemail_logs.json';

async function readLogs() {
  try {
    const data = await fs.readFile(LOG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  try {
    // בדיקה של מספר הטלפון או ה-PIN
    const { adminPin, adminPhone } = req.query;
    const ADMIN_PHONE = '0548548689';

    // בדוק אם היוזר זה המנהל - ע"י טלפון או PIN
    const isAuthorized = (
      adminPhone === ADMIN_PHONE || 
      adminPhone === process.env.ADMIN_PHONE ||
      adminPin === process.env.ADMIN_PIN ||
      adminPin === '0548548689'
    );
    
    if (!isAuthorized) {
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

    // לוג עם מידע כספי (למי יש הודעות)
    const logsWithDetails = logs.map(log => ({
      ...log,
      dateTime: new Date(log.timestamp).toLocaleString('he-IL'),
      time: new Date(log.timestamp).toLocaleTimeString('he-IL'),
      date: new Date(log.timestamp).toLocaleDateString('he-IL'),
    }));

    return res.status(200).json({
      ok: true,
      stats,
      logs: logsWithDetails.reverse(), // החדשים ביותר בראש
    });
  } catch (err) {
    console.error('Admin logs error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
