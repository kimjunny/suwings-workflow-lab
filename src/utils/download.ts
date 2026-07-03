import { FileMeta } from '../types';

// 프론트엔드 전용 목업: 실제 업로드 파일 바이트가 없으므로
// 파일메타를 바탕으로 플레이스홀더 내용을 가진 Blob을 생성한다.
function mockBlob(meta: FileMeta): Blob {
  const body =
    `[목업 파일 미리보기]\n\n` +
    `파일명: ${meta.name}\n` +
    `크기: ${meta.size} bytes\n` +
    `업로드: ${meta.uploadedAt}\n\n` +
    `※ 이 시스템은 프론트엔드 전용 목업이며 실제 파일 바이트는 저장되지 않습니다.\n` +
    `실제 서비스에서는 여기에 업로드된 원본 파일이 표시/다운로드됩니다.`;
  return new Blob([body], { type: 'text/plain;charset=utf-8' });
}

// 새 창(탭)으로 열기
export function openFile(meta: FileMeta): void {
  const url = URL.createObjectURL(mockBlob(meta));
  window.open(url, '_blank', 'noopener,noreferrer');
  // 브라우저가 새 탭에서 로드할 시간을 준 뒤 revoke
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// 즉시 다운로드
export function downloadFile(meta: FileMeta): void {
  triggerDownload(mockBlob(meta), meta.name);
}

// 임의 Blob을 파일로 다운로드 (Word .docx 등 재사용)
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
