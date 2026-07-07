// 마크다운을 서버(/api/export-hwp)로 보내 HWPX로 변환·다운로드한다.
import { triggerDownload } from './download';

export async function downloadHwpx(markdown: string, filename: string, preset?: string): Promise<void> {
  const res = await fetch('/api/export-hwp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markdown, filename, preset }),
  });

  if (!res.ok) {
    let msg = `변환 실패 (HTTP ${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      /* 응답 본문이 JSON이 아니면 기본 메시지 유지 */
    }
    throw new Error(msg);
  }

  const blob = await res.blob();
  const safe = filename.replace(/[\\/:*?"<>|]/g, '_') || 'document';
  triggerDownload(blob, `${safe}.hwpx`);
}
