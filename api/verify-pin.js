// api/verify-pin.js
// בדיקת קוד ה-PIN + רישום בלוג בשקט

import { getMessages } from '../lib/call2all.js';
import { getRedis } from '../lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { pin, phone } = req.body || {};

    if (!phone) {
      return res.status(400).json({ ok: false, error: 'Phone required' });
    }

    // הקוד נשמר ב-Redis לפי הטלפון ע"י api/store-pin.js, מיד אחרי שה-Apps Script הגריל אותו
    const redis = getRedis();
    const storedCode = await redis.get(`pin:${phone}`);

    // אין קוד שמור = פג תוקף (5 דקות) או שמעולם לא נשלח אימות לטלפון הזה
    const success = storedCode !== null && String(pin) === String(storedCode);

    // קוד חד-פעמי - נמחק מיד לאחר שימוש מוצלח, כדי שלא יהיה שימוש חוזר
    if (success) {
      try {
        await redis.del(`pin:${phone}`);
      } catch (delErr) {
        console.error('Pin delete error:', delErr);
      }
    }

    // אם הכניסה הצליחה - נמשוך כמה הודעות קוליות יש כרגע, לצורך הלוג
    let messagesCount = 0;
    if (success) {
      try {
        const token = process.env.CALL2ALL_TOKEN;
        if (token) {
          const result = await getMessages(token, 'ivr2:1');
          if (result.ok) messagesCount = result.files.length;
        }
      } catch (countErr) {
        console.error('Message count error:', countErr);
      }
    }

    // רישום בלוג בשקט - לא משנה אם הצליח או לא
    // חשוב: יש להמתין (await) לקריאה הזו! בלי await, וורסל עלול "לסגור"
    // את הפונקציה לפני שה-fetch מספיק להגיע ל-log-attempt, והרישום פשוט נחתך.
    if (phone) {
      try {
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const logUrl = `${protocol}://${host}/api/log-attempt`;

        await fetch(logUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            success,
            reason: success ? 'קוד נכון' : 'קוד שגוי',
            messages_count: messagesCount,
          }),
        }).catch(err => console.error('Log error:', err));
      } catch (logErr) {
        console.error('Logging error:', logErr);
      }
    }

    if (success) {
      return res.status(200).json({ ok: true, isAdmin: phone === '0548548689' });
    } else {
      return res.status(401).json({ ok: false });
    }
  } catch (err) {
    console.error('Verify PIN error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
