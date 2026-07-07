import React from 'react';

// 상태 → 색상 매핑 (다단계/단순 상태 모두)
const TONE: Record<string, string> = {
  '계획서 접수': 'stamp-badge stamp-blue',
  '계획서 승인': 'stamp-badge stamp-blue',
  '보고서 접수': 'stamp-badge stamp-blue',
  '보고서 담당승인': 'stamp-badge stamp-orange',
  '최종 승인': 'stamp-badge stamp-green',
  '반려': 'stamp-badge stamp-red',
  '접수': 'stamp-badge stamp-blue',
  '검토중': 'stamp-badge stamp-orange',
  '1차 승인': 'stamp-badge stamp-orange',
  '승인': 'stamp-badge stamp-green',
};

export default function Badge({ status }: { status: string }) {
  const tone = TONE[status] ?? 'stamp-badge stamp-blue';
  return (
    <span className={tone}>
      {status}
    </span>
  );
}
