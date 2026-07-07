// 마크다운 -> HWPX(한컴) 변환 공용 로직.
// Node 런타임 전용(kordoc 의존). Vercel 서버리스 함수와 Vite dev 미들웨어가 공유한다.

// kordoc 공문서 프리셋 화이트리스트 (임의 값 크래시 방지)
const PRESETS = new Set(['계획서', '보고서', '기안문', '알림통지', '회의록']);

function toBuffer(x) {
  if (Buffer.isBuffer(x)) return x;
  if (x instanceof Uint8Array) return Buffer.from(x.buffer, x.byteOffset, x.byteLength);
  if (x instanceof ArrayBuffer) return Buffer.from(new Uint8Array(x));
  return Buffer.from(x);
}

/**
 * @param {string} markdown  변환할 마크다운 (양식 그대로 직렬화된 문서)
 * @param {string} [preset]  공문서 서식 프리셋
 * @returns {Promise<Buffer>} HWPX 바이트
 */
export async function generateHwpx(markdown, preset = '계획서') {
  if (typeof markdown !== 'string' || markdown.trim() === '') {
    throw new Error('markdown이 비어 있습니다.');
  }
  const safePreset = PRESETS.has(preset) ? preset : '계획서';
  const { markdownToHwpx } = await import('kordoc');
  const out = await markdownToHwpx(markdown, { gongmun: { preset: safePreset } });
  return toBuffer(out);
}
