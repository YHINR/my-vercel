// api/audio.js
// מזרים את קובץ האודיו מ-call2all דרך השרת שלנו,
// כך שהטוקן לא נחשף בכתובת ה-URL שמופיעה בדפדפן (ב-<audio src>).

export default async function handler(req, res) {
  try {
    const token = process.env.CALL2ALL_TOKEN;
    const path = 'ivr2:1';
    const { name } = req.query;

    if (!token) {
      return res.status(500).send('Token not configured on server');
    }

    // סניטציה בסיסית לשם הקובץ - מונעת path traversal
    if (!name || !/^[\w\-. ]+\.(wav|mp3)$/i.test(name)) {
      return res.status(400).send('Invalid file name');
    }

    const fileUrl = `https://www.call2all.co.il/ym/api/DownloadFile?token=${encodeURIComponent(token)}&path=${encodeURIComponent(path + '/' + name)}`;

    const upstream = await fetch(fileUrl);

    if (!upstream.ok) {
      return res.status(upstream.status).send('Failed to fetch audio file');
    }

    const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
    const arrayBuffer = await upstream.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (err) {
    return res.status(500).send('Server error fetching audio');
  }
}
