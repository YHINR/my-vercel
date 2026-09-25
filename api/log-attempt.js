// api/log-attempt.js
// רישום של כל ניסיון בזיכרון (בתוך התהליך הנוכחי)

// משתנה גלובלי לשמירת הלוגים בתוך התהליך הנוכחי
if (!global.VOICEMAIL_LOGS) {
  global.VOICEMAIL_LOGS = [];
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

    const entry = {
      id: Date.now().toString(),
      phone,
      timestamp: new Date().toISOString(),
      success: success === true,
      reason,
      messages_count,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    };

    // הוסף ללוגים בזיכרון
    global.VOICEMAIL_LOGS.push(entry);

    // שמור רק את ה-1000 הרשומות האחרונות
    if (global.VOICEMAIL_LOGS.length > 1000) {
      global.VOICEMAIL_LOGS.splice(0, global.VOICEMAIL_LOGS.length - 1000);
    }

    console.log(`✓ רישום: ${phone} - ${success ? 'הצלחה' : 'כשל'}`);

    return res.status(200).json({ ok: true, id: entry.id });
  } catch (err) {
    console.error('Log error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to log attempt' });
  }
}
