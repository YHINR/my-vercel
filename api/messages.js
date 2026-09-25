// api/messages.js
// משיכת רשימת ההודעות הקוליות מ-call2all.
// הטוקן נשמר כמשתנה סביבה בוורסל ולעולם לא נשלח ללקוח.

import { getMessages } from '../lib/call2all.js';

export default async function handler(req, res) {
  try {
    const token = process.env.CALL2ALL_TOKEN;
    const path = 'ivr2:1';

    if (!token) {
      return res.status(500).json({ responseStatus: 'ERROR', message: 'Token not configured on server' });
    }

    const result = await getMessages(token, path);

    if (!result.ok) {
      return res.status(200).json(result.data);
    }

    // חשוב: לא מחזירים כתובת עם הטוקן! רק שם קובץ.
    // הלקוח יבקש את הקובץ עצמו דרך /api/audio?name=...
    const files = result.files.map((f) => ({ name: f.name }));

    return res.status(200).json({ responseStatus: 'OK', files });
  } catch (err) {
    return res.status(500).json({ responseStatus: 'ERROR', message: 'Server error fetching messages' });
  }
}
