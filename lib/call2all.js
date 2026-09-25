// lib/call2all.js
// לוגיקה משותפת למשיכת רשימת ההודעות הקוליות מ-call2all

export async function getMessages(token, path) {
  const listUrl = `https://www.call2all.co.il/ym/api/GetIVR2Dir?token=${encodeURIComponent(token)}&path=${encodeURIComponent(path)}`;
  const response = await fetch(listUrl);
  const data = await response.json();

  if (data.responseStatus !== 'OK') {
    return { ok: false, data };
  }

  let audioFiles = data.files
    ? data.files.filter((f) => f.name.endsWith('.wav') || f.name.endsWith('.mp3'))
    : [];

  audioFiles.sort((a, b) => {
    const numA = parseInt(a.name.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.name.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });

  return { ok: true, files: audioFiles };
}
