// api/verify-pin.js
// בדיקת קוד ה-PIN מתבצעת כאן, בצד השרת בלבד.
// הקוד עצמו נשמר כמשתנה סביבה (Environment Variable) בוורסל ולא בקוד הגלוי.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { pin } = req.body || {};
    const correctPin = process.env.PIN_CODE; // מוגדר בהגדרות הפרויקט בוורסל

    if (!correctPin) {
      return res.status(500).json({ ok: false, error: 'PIN not configured on server' });
    }

    if (String(pin) === String(correctPin)) {
      return res.status(200).json({ ok: true });
    } else {
      return res.status(401).json({ ok: false });
    }
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
