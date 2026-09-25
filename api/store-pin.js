// api/store-pin.js
// נקרא ע"י ה-Apps Script אחרי שאימת טלפון ויצר קוד חדש.
// שומר את הקוד ב-Redis לפי מספר הטלפון, עם תוקף קצר (5 דקות).

import { getRedis } from '../lib/redis.js';

const SHARED_SECRET = process.env.APPSCRIPT_SHARED_SECRET;
const CODE_TTL_SECONDS = 300; // 5 דקות

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { phone, code, secret } = req.body || {};

    // בדיקת הסוד המשותף - רק ה-Apps Script אמור לדעת אותו
    if (!SHARED_SECRET || secret !== SHARED_SECRET) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    if (!phone || !code) {
      return res.status(400).json({ ok: false, error: 'Missing phone or code' });
    }

    const redis = getRedis();
    await redis.set(`pin:${phone}`, String(code), 'EX', CODE_TTL_SECONDS);

    console.log(`🔐 קוד נשמר עבור ${phone} (תוקף ${CODE_TTL_SECONDS} שניות)`);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Store pin error:', err);
    return res.status(500).json({ ok: false, error: 'Server error', details: String(err && err.message || err) });
  }
}
