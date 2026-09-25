// api/verify-pin.js
// בדיקת קוד ה-PIN + רישום של כל ניסיון

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

    // רישום של הניסיון (גם אם כשל)
    if (phone) {
      try {
        await fetch(`${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/log-attempt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            success,
            reason: success ? 'PIN correct' : 'PIN incorrect',
          }),
        }).catch(err => console.error('Failed to log attempt:', err));
      } catch (logErr) {
        console.error('Logging error:', logErr);
      }
    }

    if (success) {
      return res.status(200).json({ ok: true });
    } else {
      return res.status(401).json({ ok: false });
    }
  } catch (err) {
    console.error('Verify PIN error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
