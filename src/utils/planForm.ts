// 비교과 문서 양식 정의 + 폼값 -> 마크다운 직렬화.
// "학생이 정해진 양식의 칸에 입력 -> 양식 그대로 마크다운 -> (서버에서) HWP 변환" 파이프라인의 프론트 부분.

export type FieldType = 'text' | 'textarea' | 'date' | 'number';

export interface FormField {
  key: string;
  label: string;
  type?: FieldType; // 기본 text
  placeholder?: string;
  full?: boolean; // 표 영역에서 한 줄 전체 차지
}

export interface FormSection {
  /** table: 항목/내용 2열 표 · prose: 소제목 + 본문 단락 */
  kind: 'table' | 'prose';
  heading?: string; // prose 소제목 (table은 생략)
  fields: FormField[];
}

export interface FormSpec {
  id: string;
  title: string;
  /** kordoc 공문서 프리셋 */
  preset: '계획서' | '보고서';
  sections: FormSection[];
}

export type FormValues = Record<string, string>;

// 예시 양식 1: 비교과 프로그램 참가 계획서
export const PLAN_SPEC: FormSpec = {
  id: 'plan',
  title: '비교과 프로그램 참가 계획서',
  preset: '계획서',
  sections: [
    {
      kind: 'table',
      fields: [
        { key: 'studentId', label: '학번' },
        { key: 'name', label: '성명' },
        { key: 'dept', label: '학과' },
        { key: 'grade', label: '학년' },
        { key: 'programName', label: '프로그램명', full: true },
        { key: 'period', label: '참가기간', placeholder: '2026-03-02 ~ 2026-06-30', full: true },
        { key: 'professor', label: '담당교수' },
        { key: 'contact', label: '연락처', placeholder: '010-0000-0000' },
      ],
    },
    { kind: 'prose', heading: '참가 목적', fields: [{ key: 'purpose', label: '참가 목적', type: 'textarea' }] },
    { kind: 'prose', heading: '세부 활동 계획', fields: [{ key: 'plan', label: '세부 활동 계획', type: 'textarea' }] },
    { kind: 'prose', heading: '기대 효과', fields: [{ key: 'expectation', label: '기대 효과', type: 'textarea' }] },
  ],
};

// 예시 양식 2: 비교과 프로그램 결과 보고서
export const REPORT_SPEC: FormSpec = {
  id: 'report',
  title: '비교과 프로그램 결과 보고서',
  preset: '보고서',
  sections: [
    {
      kind: 'table',
      fields: [
        { key: 'studentId', label: '학번' },
        { key: 'name', label: '성명' },
        { key: 'dept', label: '학과' },
        { key: 'grade', label: '학년' },
        { key: 'programName', label: '프로그램명', full: true },
        { key: 'period', label: '활동기간', placeholder: '2026-03-02 ~ 2026-06-30', full: true },
        { key: 'hours', label: '인정시간', type: 'number', placeholder: '20' },
        { key: 'professor', label: '담당교수' },
      ],
    },
    { kind: 'prose', heading: '활동 내용', fields: [{ key: 'activity', label: '활동 내용', type: 'textarea' }] },
    { kind: 'prose', heading: '활동 성과', fields: [{ key: 'result', label: '활동 성과', type: 'textarea' }] },
    { kind: 'prose', heading: '소감 및 향후 계획', fields: [{ key: 'reflection', label: '소감 및 향후 계획', type: 'textarea' }] },
  ],
};

export const FORM_SPECS: FormSpec[] = [PLAN_SPEC, REPORT_SPEC];

// 마크다운 표 셀 이스케이프
const cell = (v: string) => (v || '-').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim() || '-';

/** 폼값을 양식 구조 그대로 마크다운으로 직렬화한다. */
export function formToMarkdown(spec: FormSpec, values: FormValues): string {
  const out: string[] = [`# ${spec.title}`, ''];

  for (const section of spec.sections) {
    if (section.kind === 'table') {
      out.push('| 항목 | 내용 |', '| --- | --- |');
      for (const f of section.fields) {
        out.push(`| ${f.label} | ${cell(values[f.key] ?? '')} |`);
      }
      out.push('');
    } else {
      if (section.heading) out.push(`## ${section.heading}`, '');
      const body = (values[section.fields[0]?.key] ?? '').trim();
      out.push(body || '-', '');
    }
  }

  return out.join('\n').trim() + '\n';
}
