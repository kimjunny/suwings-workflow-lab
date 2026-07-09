import '../index.css';
import {
  bootDeck,
  detailRow,
  el,
  fileBox,
  noticeBox,
  pageHeader,
  stampBadge,
  suTable,
  winButton,
  winWindow,
  type DeckStep,
  type Role,
} from './core';

// spec md §1 Legacy Work Flow (기존 오프라인 프로세스) — 대면·수기 서명·구글폼 스캔.
interface LegacyVM {
  k: number;
}

type Flow = 'app' | 'report';

interface LegacyStep {
  actor: Role;
  menu: string;
  flow: Flow;
  caption: string;
  note: string;
  render: () => HTMLElement;
}

const RECORD = {
  title: '임상약학 케이스 스터디 프로젝트',
  student: '학생',
  studentId: '20231234',
  grade: '3학년',
  semester: '2026 1학기',
  professor: '담당교수',
  hours: 10,
  team: '팀원A(20231235), 팀원B(20231236)',
  plan: '실제 처방 사례를 분석하고, 중간 점검 세미나 후 결과 발표와 결과 보고서를 작성합니다.',
  googleForm: '학사관리 비교과 제출 Google Form',
};

const dispInput = (value: string): HTMLElement => el('input', { className: 'w-full', attrs: { value, disabled: 'true' } });
const dispArea = (value: string): HTMLElement => el('textarea', { className: 'w-full', text: value, attrs: { rows: '3', disabled: 'true' } });
const field = (label: string, node: Node): HTMLElement =>
  el('div', { className: 'flex flex-col gap-1.5' }, [
    el('label', { className: 'text-[11px] font-bold text-slate-950 uppercase tracking-wider', text: label }),
    node,
  ]);

function paperStamp(label: string, done: boolean, active = false): HTMLElement {
  return el('div', { className: `border border-slate-300 bg-white p-3 ${active ? 'deck-hl' : ''}` }, [
    el('div', { className: 'flex items-center justify-between gap-2' }, [
      el('span', { className: 'text-xs font-black text-slate-700', text: label }),
      el('span', { className: `stamp-badge ${done ? 'stamp-green' : 'stamp-orange'}`, text: done ? '서명 완료' : '서명 대기' }),
    ]),
    el('div', { className: 'mt-2 h-14 border border-dashed border-slate-300 bg-[#fffdf5] flex items-center justify-center text-[11px] font-bold text-slate-400' }, [
      done ? '수기 서명 / 도장 이미지' : '방문 후 수기 서명 필요',
    ]),
  ]);
}

function paperApplication(opts: { prof?: boolean; head?: boolean; active?: 'write' | 'prof' | 'head' | 'scan' }): HTMLElement {
  const body = el('div', { className: 'grid md:grid-cols-[1.2fr_0.8fr] gap-5' }, [
    el('div', { className: 'space-y-3' }, [
      field('프로그램 제목', dispInput(RECORD.title)),
      el('div', { className: 'grid grid-cols-3 gap-3' }, [
        field('학기', dispInput(RECORD.semester)),
        field('담당교수', dispInput(RECORD.professor)),
        field('인정시간', dispInput(String(RECORD.hours))),
      ]),
      field('팀원', dispInput(RECORD.team)),
      field('계획서', dispArea(RECORD.plan)),
    ]),
    el('div', { className: 'space-y-3' }, [
      paperStamp('담당교수 승인 서명란', Boolean(opts.prof), opts.active === 'prof'),
      paperStamp('학과장 승인 서명란', Boolean(opts.head), opts.active === 'head'),
      opts.active === 'scan'
        ? fileBox('비교과_신청서_서명본_scan.pdf', false, '수기 서명 원본을 스캔해 Google Form에 첨부')
        : noticeBox('오프라인 원본 관리', '학생이 종이 원본을 들고 담당교수실과 학과장실을 직접 방문합니다.', 'slate'),
    ]),
  ]);
  return winWindow('비교과 프로그램 신청서 · 종이 원본', body, null, 'max-w-4xl');
}

function appList(status: string, active = false): HTMLElement {
  const table = suTable(
    ['제목', '학번', '이름', '학기', '인정시간', '담당교수 서명', '학과장 서명', '스캔 제출', '처리상태'],
    [[
      el('span', { className: 'text-slate-800 font-medium', text: RECORD.title }),
      RECORD.studentId,
      RECORD.student,
      RECORD.semester,
      `${RECORD.hours}h`,
      stampBadge(status === '작성중' ? '서명 대기' : '서명 완료'),
      stampBadge(status === '학과장 서명 완료' || status === '승인' ? '서명 완료' : '서명 대기'),
      status === '구글폼 제출' || status === '승인' ? stampBadge('제출 완료') : '-',
      stampBadge(status),
    ]],
  );
  return el('div', {}, [
    pageHeader('Legacy 신청서 승인 현황', '오프라인 수기 서명 / 스캔 제출', null),
    active ? noticeBox('현재 단계', '학사에서 스캔본의 기본 형식과 서명 여부를 육안으로 확인합니다.', 'amber') : null,
    table,
  ]);
}

function googleFormScreen(kind: '신청서' | '결과보고서'): HTMLElement {
  const body = el('div', { className: 'grid md:grid-cols-[0.9fr_1.1fr] gap-5' }, [
    el('div', { className: 'border border-slate-300 bg-[#f8f8f4] p-4 space-y-2' }, [
      el('h3', { className: 'text-sm font-black text-slate-900', text: RECORD.googleForm }),
      detailRow('제출 구분', kind),
      detailRow('학생', `${RECORD.student} (${RECORD.studentId})`),
      detailRow('프로그램', RECORD.title),
      detailRow('상태', stampBadge('업로드 대기')),
    ]),
    el('div', { className: 'space-y-3' }, [
      field('학번', dispInput(RECORD.studentId)),
      field('이름', dispInput(RECORD.student)),
      fileBox(kind === '신청서' ? '비교과_신청서_서명본_scan.pdf' : '비교과_결과보고서_서명본_scan.pdf', false, '스캐너/휴대폰으로 만든 PDF 또는 이미지'),
      el('div', { className: 'flex gap-2' }, [winButton('임시 저장', { variant: 'secondary' }), winButton('제출', { variant: 'primary', highlight: true })]),
    ]),
  ]);
  return winWindow(`${kind} Google Form 스캔 제출`, body, null, 'max-w-4xl');
}

function posterDisplay(active = false): HTMLElement {
  return el('div', {}, [
    pageHeader('비교과 결과 포스터 전시', '오프라인 전시 공간', null),
    el('div', { className: 'grid md:grid-cols-3 gap-4' }, [
      el('div', { className: `md:col-span-2 border-2 border-slate-800 bg-white p-5 ${active ? 'deck-hl' : ''}` }, [
        el('div', { className: 'aspect-[4/3] border border-slate-300 bg-[#f8f8f4] flex items-center justify-center text-center p-6' }, [
          el('div', {}, [
            el('p', { className: 'text-lg font-black text-slate-900', text: RECORD.title }),
            el('p', { className: 'mt-3 text-sm text-slate-600 font-bold', text: '결과 포스터 오프라인 전시물' }),
            el('p', { className: 'mt-8 text-[11px] text-slate-400 font-bold', text: '학생들이 지정 장소에 실제 출력물을 부착' }),
          ]),
        ]),
      ]),
      noticeBox('심사 방식', '학과장님이 전시 장소를 방문해 출력된 결과 포스터를 확인·심사합니다.', 'slate'),
    ]),
  ]);
}

function reportPaper(opts: { written?: boolean; prof?: boolean; head?: boolean; active?: 'write' | 'prof' | 'head' | 'scan' }): HTMLElement {
  const body = el('div', { className: 'grid md:grid-cols-[1.2fr_0.8fr] gap-5' }, [
    el('div', { className: 'space-y-3' }, [
      field('프로그램 제목', dispInput(RECORD.title)),
      field('결과 요약', dispArea(opts.written ? '처방 사례 분석 결과와 팀별 발표 내용을 정리했습니다. 활동 사진과 참여자 역할을 첨부합니다.' : '결과보고서 작성 전')), 
      field('인정시간', dispInput(`${RECORD.hours}시간`)),
      opts.active === 'write' ? noticeBox('현재 단계', '학생들이 결과보고서를 작성하고 출력합니다.', 'amber') : null,
    ]),
    el('div', { className: 'space-y-3' }, [
      paperStamp('담당교수 결과보고서 승인 서명란', Boolean(opts.prof), opts.active === 'prof'),
      paperStamp('학과장 결과보고서 승인 서명란', Boolean(opts.head), opts.active === 'head'),
      opts.active === 'scan'
        ? fileBox('비교과_결과보고서_서명본_scan.pdf', false, '서명 완료된 결과보고서 원본 스캔본')
        : noticeBox('결과보고서 원본', '출력물에 수기 서명을 받은 뒤 학사 Google Form으로 스캔 제출합니다.', 'slate'),
    ]),
  ]);
  return winWindow('비교과 프로그램 결과보고서 · 종이 원본', body, null, 'max-w-4xl');
}

function reportList(status: string, active = false): HTMLElement {
  const table = suTable(
    ['제목', '학번', '이름', '포스터 심사', '담당교수 서명', '학과장 서명', '스캔 제출', '처리상태'],
    [[RECORD.title, RECORD.studentId, RECORD.student, stampBadge('심사 완료'), stampBadge('서명 완료'), stampBadge('서명 완료'), status === '승인' ? stampBadge('제출 완료') : '-', stampBadge(status)]],
  );
  return el('div', {}, [
    pageHeader('Legacy 결과보고서 승인 현황', '오프라인 포스터 심사 / 수기 서명 / 스캔 제출', null),
    active ? noticeBox('현재 단계', '학사에서 결과보고서 스캔본의 기본 형식과 서명 여부를 최종 검토합니다.', 'amber') : null,
    table,
  ]);
}

const legacySteps: LegacyStep[] = [
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    flow: 'app',
    caption: '1.1 신청서 승인 — 1/5 학생 신청서 작성',
    note: '학생들이 비교과 프로그램 신청서를 작성합니다.',
    render: () => paperApplication({ active: 'write' }),
  },
  {
    actor: 'PROFESSOR',
    menu: '학과내 목록',
    flow: 'app',
    caption: '1.1 신청서 승인 — 2/5 담당교수 대면 승인',
    note: '학생이 담당 교수님을 찾아가 승인을 받고 수기 서명을 받습니다.',
    render: () => paperApplication({ prof: true, active: 'prof' }),
  },
  {
    actor: 'HEAD',
    menu: '학과내 최종승인',
    flow: 'app',
    caption: '1.1 신청서 승인 — 3/5 학과장 대면 승인',
    note: '학생이 학과장님을 찾아가 승인을 받고 수기 서명을 받습니다.',
    render: () => paperApplication({ prof: true, head: true, active: 'head' }),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    flow: 'app',
    caption: '1.1 신청서 승인 — 4/5 Google Form 스캔 제출',
    note: '서명 받은 원본 신청서를 학사에서 관리하는 구글폼에 스캔하여 제출합니다.',
    render: () => googleFormScreen('신청서'),
  },
  {
    actor: 'STAFF',
    menu: '통합조회',
    flow: 'app',
    caption: '1.1 신청서 승인 — 5/5 학사 형식 검토/승인 처리',
    note: '학사에서 기본 형식, 서명 여부 등을 검토하여 신청 승인 처리합니다.',
    render: () => appList('승인', true),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    flow: 'report',
    caption: '1.2 결과보고서 승인 — 1/7 결과 포스터 전시',
    note: '학생들이 비교과 결과 포스터를 전시합니다.',
    render: () => posterDisplay(true),
  },
  {
    actor: 'HEAD',
    menu: '학과내 최종승인',
    flow: 'report',
    caption: '1.2 결과보고서 승인 — 2/7 학과장 포스터 심사',
    note: '학과장님이 전시된 결과 포스터를 심사합니다.',
    render: () => posterDisplay(false),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    flow: 'report',
    caption: '1.2 결과보고서 승인 — 3/7 결과보고서 작성',
    note: '학생들이 결과보고서를 작성합니다.',
    render: () => reportPaper({ written: true, active: 'write' }),
  },
  {
    actor: 'PROFESSOR',
    menu: '학과내 목록',
    flow: 'report',
    caption: '1.2 결과보고서 승인 — 4/7 담당교수 대면 승인',
    note: '담당 교수님을 찾아가 결과보고서 승인을 받고 수기 서명을 받습니다.',
    render: () => reportPaper({ written: true, prof: true, active: 'prof' }),
  },
  {
    actor: 'HEAD',
    menu: '학과내 최종승인',
    flow: 'report',
    caption: '1.2 결과보고서 승인 — 5/7 학과장 대면 승인',
    note: '학과장님을 찾아가 결과보고서 승인을 받고 수기 서명을 받습니다.',
    render: () => reportPaper({ written: true, prof: true, head: true, active: 'head' }),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    flow: 'report',
    caption: '1.2 결과보고서 승인 — 6/7 Google Form 스캔 제출',
    note: '서명 받은 원본을 학사에서 관리하는 구글폼에 스캔하여 제출합니다.',
    render: () => googleFormScreen('결과보고서'),
  },
  {
    actor: 'STAFF',
    menu: '통합조회',
    flow: 'report',
    caption: '1.2 결과보고서 승인 — 7/7 학사 형식 검토/승인 처리',
    note: '학사에서 기본 형식, 서명 여부 등을 검토하여 승인 처리합니다.',
    render: () => reportList('승인', true),
  },
];

const steps: DeckStep<LegacyVM>[] = legacySteps.map((st) => ({
  actor: st.actor,
  menu: st.menu,
  caption: st.caption,
  note: st.note,
  render: st.render,
}));

bootDeck<LegacyVM>({ program: 'Legacy 오프라인 프로세스', initial: { k: 0 }, steps });
