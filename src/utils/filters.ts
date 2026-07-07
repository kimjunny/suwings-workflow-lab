// 텍스트 부분 일치 (학번/이름 필터)
export function matchText(hay: string, needle: string): boolean {
  if (!needle.trim()) return true;
  return hay.toLowerCase().includes(needle.trim().toLowerCase());
}

export type SortDir = 'asc' | 'desc';

// 열 클릭 정렬: 값 추출자로 오름/내림차순 비교 (문자열은 ko-KR numeric)
export function compareValues(a: unknown, b: unknown, dir: SortDir): number {
  let cmp: number;
  if (typeof a === 'number' && typeof b === 'number') {
    cmp = a - b;
  } else {
    cmp = String(a ?? '').localeCompare(String(b ?? ''), 'ko-KR', { numeric: true });
  }
  return dir === 'asc' ? cmp : -cmp;
}
