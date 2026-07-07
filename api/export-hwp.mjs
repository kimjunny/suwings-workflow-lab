// Vercel 서버리스 함수: 마크다운 -> HWPX 다운로드.
// POST /api/export-hwp  { markdown: string, filename?: string, preset?: string }
import { generateHwpx } from '../server/hwpx.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST만 허용됩니다.' });
    return;
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const { markdown, filename = 'document', preset } = body;
    const buf = await generateHwpx(markdown, preset);
    const safe = String(filename).replace(/[\\/:*?"<>|]/g, '_') || 'document';
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(safe)}.hwpx`);
    res.status(200).send(buf);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
