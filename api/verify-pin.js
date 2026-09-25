// api/verify-pin.js
// בדיקת קוד ה-PIN + רישום בלוג בשקט

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { pin, phone } = req.body || {};
    const correctPin = process.env.PIN_CODE;

    if (!correctPin) {
      return res.status(500).json({ ok: false, error: 'PIN not configured on server' });
    }

    const success = String(pin) === String(correctPin);

    // רישום בלוג בשקט - לא משנה אם הצליח או לא
    if (phone) {
      try {
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const logUrl = `${protocol}://${host}/api/log-attempt`;
        
        fetch(logUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            success,
            reason: success ? 'PIN correct' : 'PIN incorrect',
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
