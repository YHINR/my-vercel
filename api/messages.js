// api/messages.js
// משיכת רשימת ההודעות הקוליות מ-call2all.
// הטוקן נשמר כמשתנה סביבה בוורסל ולעולם לא נשלח ללקוח.

export default async function handler(req, res) {
  try {
    const token = process.env.CALL2ALL_TOKEN;
    const path = 'ivr2:1';

    if (!token) {
      return res.status(500).json({ responseStatus: 'ERROR', message: 'Token not configured on server' });
    }

    const listUrl = `https://www.call2all.co.il/ym/api/GetIVR2Dir?token=${encodeURIComponent(token)}&path=${encodeURIComponent(path)}`;
    const response = await fetch(listUrl);
    const data = await response.json();

    if (data.responseStatus !== 'OK') {
      return res.status(200).json(data);
    }

    let audioFiles = data.files
      ? data.files.filter((f) => f.name.endsWith('.wav') || f.name.endsWith('.mp3'))
      : [];

    audioFiles.sort((a, b) => {
      const numA = parseInt(a.name.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.name.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    // חשוב: לא מחזירים כתובת עם הטוקן! רק שם קובץ.
    // הלקוח יבקש את הקובץ עצמו דרך /api/audio?name=...
    const files = audioFiles.map((f) => ({ name: f.name }));

    return res.status(200).json({ responseStatus: 'OK', files });
  } catch (err) {
    return res.status(500).json({ responseStatus: 'ERROR', message: 'Server error fetching messages' });
  }
}
