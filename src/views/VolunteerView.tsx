import React, { useMemo, useState } from 'react';
import { useRecords } from '../store/recordsStore';
import { useAuth } from '../auth/AuthContext';
import { can, canView, canStudentEdit, isFinalApproved } from '../auth/roles';
import { VolunteerRecord } from '../types';
import { PROFESSORS } from '../data/seed';
import { accumulatedApprovedHours, volunteerPercent } from '../utils/volunteer';
import { matchText } from '../utils/filters';
import { openFile, downloadFile } from '../utils/download';
import { downloadRecordDocx } from '../utils/documents';
import { useSettings } from '../store/settingsStore';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import FileDropField from '../components/ui/FileDropField';
import HistoryList from '../components/HistoryList';
import { Table, THead, Th, Td, TableEmpty } from '../components/ui/Table';
import { FieldGroup, Input, Select } from '../components/ui/Field';
import { useToast } from '../components/ui/Toast';
import { Plus, Eye, ExternalLink, Download, CheckCircle2, RotateCcw } from 'lucide-react';

const readyForFirst = (r: VolunteerRecord) => r.status === '접수' || r.status === '검토중' || r.status === '반려';
const readyForFinal = (r: VolunteerRecord) => r.status === '1차 승인' || r.status === '검토중';

// 학과장 검토/승인 여부 표시용
const headReviewLabel = (r: VolunteerRecord): string =>
  isFinalApproved(r) ? '승인' : r.status === '1차 승인' ? '검토대기' : '-';

export default function VolunteerView() {
  const { state, dispatch } = useRecords();
  const { user } = useAuth();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<VolunteerRecord | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // 검색 필터 상태
  const [fGrade, setFGrade] = useState('전체');
  const [fStudentId, setFStudentId] = useState('');
  const [fName, setFName] = useState('');
  const [fStatus, setFStatus] = useState('전체');
  const [fYearFrom, setFYearFrom] = useState('');
  const [fYearTo, setFYearTo] = useState('');

  const visible = useMemo(
    () => state.volunteer.filter((r) => (user ? canView(user, r) : false)),
    [state.volunteer, user],
  );

  const rows = useMemo(() => {
    const yf = fYearFrom.trim() ? Number(fYearFrom) : null;
    const yt = fYearTo.trim() ? Number(fYearTo) : null;
    return visible
      .filter((r) => {
        if (fGrade !== '전체' && r.grade !== fGrade) return false;
        if (!matchText(r.studentId, fStudentId)) return false;
        if (!matchText(r.name, fName)) return false;
        if (fStatus !== '전체' && r.status !== fStatus) return false;
        const yr = Number(r.year);
        if (yf !== null && yr < yf) return false;
        if (yt !== null && yr > yt) return false;
        return true;
      })
      .slice()
      .sort((a, b) => (a.lastUpdate < b.lastUpdate ? 1 : -1));
  }, [visible, fGrade, fStudentId, fName, fStatus, fYearFrom, fYearTo]);

  if (!user) return null;
  const current = detail ? state.volunteer.find((r) => r.id === detail.id) ?? null : null;
  const title = user.role === 'STUDENT' ? '봉사 인증서 업로드' : user.role === 'PROFESSOR' ? '봉사 목록' : user.role === 'STAFF' ? '봉사 관리자 코멘트' : '봉사 최종승인';
  const actor = { name: user.name, role: user.role };

  const accHours = (studentId: string) => accumulatedApprovedHours(state.volunteer, studentId);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const rowIds = rows.map((r) => r.id);
  const allChecked = rowIds.length > 0 && rowIds.every((id) => selected.has(id));
  const toggleAll = () =>
    setSelected((prev) => {
      if (allChecked) return new Set([...prev].filter((id) => !rowIds.includes(id)));
      return new Set([...prev, ...rowIds]);
    });

  // 일괄 승인: 현재 권한으로 가능한 건만 각 1단계 전진, 불가건 스킵 후 요약 토스트
  const bulkApprove = () => {
    const picks = rows.filter((r) => selected.has(r.id));
    if (picks.length === 0) { toast('선택된 항목이 없습니다.', 'error'); return; }
    let advanced = 0;
    let skipped = 0;
    picks.forEach((r) => {
      if (can(user, 'approve_first', r) && readyForFirst(r)) {
        dispatch({ type: 'APPROVE_VOLUNTEER_PROFESSOR', id: r.id, actor });
        advanced += 1;
      } else if (can(user, 'approve_final', r) && readyForFinal(r)) {
        dispatch({ type: 'APPROVE_VOLUNTEER_FINAL_HEAD', id: r.id, actor });
        advanced += 1;
      } else {
        skipped += 1;
      }
    });
    setSelected(new Set());
    toast(`일괄 승인: ${advanced}건 처리${skipped ? `, ${skipped}건 스킵(권한/상태 불가)` : ''}.`, skipped && !advanced ? 'error' : 'success');
  };

  // 일괄 승인취소: 최종승인 건만 되돌림(CANCEL)
  const bulkCancel = () => {
    const picks = rows.filter((r) => selected.has(r.id));
    if (picks.length === 0) { toast('선택된 항목이 없습니다.', 'error'); return; }
    let cancelled = 0;
    let skipped = 0;
    picks.forEach((r) => {
      if (can(user, 'cancel', r) && isFinalApproved(r)) {
        dispatch({ type: 'CANCEL_VOLUNTEER', id: r.id, actor });
        cancelled += 1;
      } else {
        skipped += 1;
      }
    });
    setSelected(new Set());
    toast(`일괄 승인취소: ${cancelled}건 처리${skipped ? `, ${skipped}건 스킵(최종승인/권한 아님)` : ''}.`, skipped && !cancelled ? 'error' : 'info');
  };

  const canBulk = can(user, 'approve_final') || user.role === 'PROFESSOR' || user.role === 'HEAD';

  return (
    <div>
      <PageHeader title={title} sub="전공연계봉사활동" right={can(user, 'create') && <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> 봉사 등록</Button>} />

      {/* 검색 필터 */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm mb-4 grid grid-cols-2 md:grid-cols-6 gap-3">
        <FieldGroup label="학년"><Select value={fGrade} onChange={(e) => setFGrade(e.target.value)}>{['전체', '2학년', '3학년', '4학년'].map((g) => <option key={g}>{g}</option>)}</Select></FieldGroup>
        <FieldGroup label="학번"><Input value={fStudentId} onChange={(e) => setFStudentId(e.target.value)} placeholder="학번" /></FieldGroup>
        <FieldGroup label="이름"><Input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="이름" /></FieldGroup>
        <FieldGroup label="진행상태"><Select value={fStatus} onChange={(e) => setFStatus(e.target.value)}>{['전체', '접수', '1차 승인', '최종 승인', '검토중', '반려'].map((s) => <option key={s}>{s}</option>)}</Select></FieldGroup>
        <FieldGroup label="연도(부터)"><Input type="number" value={fYearFrom} onChange={(e) => setFYearFrom(e.target.value)} placeholder="예: 2025" data-testid="vol-year-from" /></FieldGroup>
        <FieldGroup label="연도(까지)"><Input type="number" value={fYearTo} onChange={(e) => setFYearTo(e.target.value)} placeholder="예: 2026" data-testid="vol-year-to" /></FieldGroup>
      </div>

      {/* 일괄 처리 */}
      {canBulk && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-slate-500">{selected.size}건 선택됨</span>
          <Button variant="success" size="sm" onClick={bulkApprove} data-testid="vol-bulk-approve"><CheckCircle2 size={14} /> 선택 후 승인</Button>
          <Button variant="secondary" size="sm" onClick={bulkCancel} data-testid="vol-bulk-cancel"><RotateCcw size={14} /> 승인 취소</Button>
        </div>
      )}

      <Table>
        <THead>
          {canBulk && <Th><input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="전체 선택" data-testid="vol-check-all" /></Th>}
          <Th>봉사활동명</Th><Th>학년</Th><Th>학번</Th><Th>이름</Th><Th>연도</Th><Th>학기</Th><Th>인정시간</Th><Th>진행상태</Th><Th>학과장 검토/승인</Th><Th>최종 승인일</Th><Th>누적 봉사시간</Th><Th>인증서</Th><Th></Th>
        </THead>
        <tbody data-testid="vol-tbody">
          {rows.length === 0 ? (
            <TableEmpty colSpan={canBulk ? 14 : 13} message="등록된 봉사활동이 없습니다." />
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                {canBulk && <Td><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} aria-label={`${r.title} 선택`} /></Td>}
                <Td className="text-slate-800 font-medium">{r.title}</Td>
                <Td className="text-slate-600">{r.grade}</Td>
                <Td className="text-slate-600">{r.studentId}</Td>
                <Td className="text-slate-700">{r.name}</Td>
                <Td className="text-slate-600">{r.year}</Td>
                <Td className="text-slate-600">{r.semester}</Td>
                <Td className="text-slate-600">{r.recognizedHours}h</Td>
                <Td><Badge status={r.status} /></Td>
                <Td className="text-slate-600 text-xs">{headReviewLabel(r)}</Td>
                <Td className="text-slate-500 text-xs">{r.finalApprovalDate || '-'}</Td>
                <Td className="text-slate-800 font-semibold">{accHours(r.studentId)}h</Td>
                <Td>
                  {r.certFile ? (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openFile(r.certFile!)} data-testid="vol-cert-open" title="새 창에서 열기"><ExternalLink size={14} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => downloadFile(r.certFile!)} data-testid="vol-cert-download" title="다운로드"><Download size={14} /></Button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </Td>
                <Td><Button variant="ghost" size="sm" onClick={() => setDetail(r)}><Eye size={14} /> 상세</Button></Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
      <p className="text-sm text-slate-500 mt-3">총 {rows.length}건</p>

      {createOpen && <CreateModal onClose={() => setCreateOpen(false)} />}
      {current && <DetailModal record={current} onClose={() => setDetail(null)} />}
    </div>
  );
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const { dispatch } = useRecords();
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [semester, setSemester] = useState('2학기');
  const [professor, setProfessor] = useState(PROFESSORS[0]);
  const [hours, setHours] = useState('8');
  if (!user) return null;

  const submit = () => {
    if (!title.trim()) { toast('봉사활동명을 입력하세요.', 'error'); return; }
    dispatch({
      type: 'CREATE_VOLUNTEER',
      actor: { name: user.name, role: user.role },
      payload: {
        programType: '전공연계봉사활동', grade: user.grade ?? '3학년', studentId: user.studentId ?? '', name: user.name,
        year: '2026', semester, professor, title: title.trim(), recognizedHours: Number(hours) || 0,
        accumulatedHours: Number(hours) || 0, certFile: null, finalApprovalDate: '', adminComment: '',
      },
    });
    toast('봉사활동을 등록했습니다. (접수)');
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="전공연계봉사활동 등록" footer={<><Button variant="secondary" onClick={onClose}>취소</Button><Button onClick={submit} data-testid="vol-create-submit">등록</Button></>}>
      <div className="flex flex-col gap-4">
        <FieldGroup label="봉사활동명"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 어르신 복약지도 봉사" data-testid="vol-title" /></FieldGroup>
        <div className="grid grid-cols-3 gap-3">
          <FieldGroup label="학기"><Select value={semester} onChange={(e) => setSemester(e.target.value)}>{['1학기', '2학기', '여름학기', '겨울학기'].map((s) => <option key={s}>{s}</option>)}</Select></FieldGroup>
          <FieldGroup label="담당교수"><Select value={professor} onChange={(e) => setProfessor(e.target.value)}>{PROFESSORS.map((p) => <option key={p}>{p}</option>)}</Select></FieldGroup>
          <FieldGroup label="인정시간"><Input type="number" value={hours} onChange={(e) => setHours(e.target.value)} /></FieldGroup>
        </div>
        <p className="text-xs text-slate-400">인증서는 등록 후 상세 화면에서 업로드(파일 선택)합니다.</p>
      </div>
    </Modal>
  );
}

function DetailModal({ record, onClose }: { record: VolunteerRecord; onClose: () => void }) {
  const { state, dispatch } = useRecords();
  const { user } = useAuth();
  const { toast } = useToast();
  const { state: settings } = useSettings();
  const [comment, setComment] = useState(record.adminComment);
  const [reject, setReject] = useState(false);
  if (!user) return null;
  const actor = { name: user.name, role: user.role };
  const isOwnerStudent = record.studentId === user.studentId;
  const accumulated = accumulatedApprovedHours(state.volunteer, record.studentId);
  const pct = volunteerPercent(accumulated);
  const canReject = (can(user, 'approve_first', record) && readyForFirst(record)) || (can(user, 'approve_final', record) && readyForFinal(record));
  const signature = settings.signatures.find((s) => s.professorName === record.professor);
  const documentButton = (kind: 'application' | 'result', label: string) => (
    <>
      <Button variant="secondary" size="sm" onClick={() => downloadRecordDocx(record, kind, signature)}>{label} 다운로드</Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          dispatch({ type: 'SET_DOCUMENT_STATUS', domain: 'volunteer', id: record.id, kind, actor });
          toast(`${label} 구글 드라이브 전송됨`, 'success');
        }}
      >
        {label} 드라이브 전송{record.documentStatus?.[kind] ? ` (${record.documentStatus[kind]})` : ''}
      </Button>
    </>
  );

  return (
    <Modal open onClose={onClose} title={record.title} width="max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
        <Row k="학생" v={`${record.name} (${record.studentId})`} />
        <Row k="학기" v={`${record.year} ${record.semester}`} />
        <Row k="담당교수" v={record.professor} />
        <Row k="인정시간" v={`${record.recognizedHours}시간`} />
        <Row k="누적시간" v={`${accumulated}시간 (20시간 대비 ${pct.toFixed(0)}%)`} />
        <Row k="진행상태" v={<Badge status={record.status} />} />
      </div>

      <div className="mb-4">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">봉사 인증서</p>
        {can(user, 'submit_report', record) && isOwnerStudent && readyForFirst(record) ? (
          <FileDropField
            value={record.certFile}
            accept="application/pdf,image/*"
            hint="담당교수 서명이 있는 인증서 (스캔 PDF/이미지)"
            onSelect={(file) => { dispatch({ type: 'UPLOAD_CERT', id: record.id, file, actor }); toast('인증서를 업로드했습니다.'); }}
          />
        ) : record.certFile ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 flex items-center justify-between gap-2">
            <span className="truncate">{record.certFile.name}</span>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="sm" onClick={() => openFile(record.certFile!)} title="새 창에서 열기"><ExternalLink size={14} /> 열기</Button>
              <Button variant="ghost" size="sm" onClick={() => downloadFile(record.certFile!)} title="다운로드"><Download size={14} /> 다운로드</Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">아직 인증서가 업로드되지 않았습니다.</p>
        )}
      </div>
      {signature && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 text-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">담당교수 서명</p>
          <img src={signature.dataUrl} alt={`${signature.professorName} 서명`} className="h-16 max-w-full object-contain rounded bg-slate-50" />
        </div>
      )}


      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        {documentButton('application', '신청서')}
        {documentButton('result', '결과보고서')}
        {readyForFirst(record) && can(user, 'approve_first', record) && (
          <Button variant="success" size="sm" data-testid="vol-approve-first"
            onClick={() => { dispatch({ type: 'APPROVE_VOLUNTEER_PROFESSOR', id: record.id, actor }); toast('봉사활동을 1차 승인했습니다.'); }}>1차 승인</Button>
        )}
        {readyForFinal(record) && can(user, 'approve_final', record) && (
          <Button variant="success" size="sm" data-testid="vol-approve-final"
            onClick={() => { dispatch({ type: 'APPROVE_VOLUNTEER_FINAL_HEAD', id: record.id, actor }); toast('봉사활동을 최종 승인했습니다.'); }}>최종 승인</Button>
        )}
        {isFinalApproved(record) && can(user, 'cancel', record) && (
          <Button variant="secondary" size="sm" onClick={() => { dispatch({ type: 'CANCEL_VOLUNTEER', id: record.id, actor }); toast('최종 승인을 취소했습니다.', 'info'); }}>최종 승인 취소</Button>
        )}
        {canReject && (
          <Button variant="danger" size="sm" onClick={() => setReject(true)}>반려</Button>
        )}
        {record.status === '반려' && canStudentEdit(user, record) && (
          <Button variant="secondary" size="sm" onClick={() => { dispatch({ type: 'RESUBMIT_VOLUNTEER', id: record.id, actor }); toast('재제출했습니다.', 'info'); }}>재제출</Button>
        )}
      </div>

      {can(user, 'admin_comment') && (
        <div className="mt-4">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">행정실 코멘트</p>
          <div className="flex gap-2">
            <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="비고 코멘트" />
            <Button size="sm" onClick={() => { dispatch({ type: 'SET_ADMIN_COMMENT', domain: 'volunteer', id: record.id, comment, actor }); toast('코멘트를 저장했습니다.'); }}>저장</Button>
          </div>
        </div>
      )}
      {record.adminComment && !can(user, 'admin_comment') && <p className="mt-3 text-sm text-slate-600">행정실 코멘트: {record.adminComment}</p>}

      <div className="mt-5">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">진행 이력</p>
        <HistoryList history={record.history} />
      </div>

      <ConfirmDialog open={reject} title="반려" message="봉사활동을 반려합니다. 사유를 입력하세요." confirmLabel="반려" variant="danger" withReason
        onClose={() => setReject(false)}
        onConfirm={(reason) => { dispatch({ type: 'REJECT_VOLUNTEER', id: record.id, reason: reason ?? '', actor }); toast('반려 처리했습니다.', 'info'); setReject(false); }} />
    </Modal>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-20 shrink-0 pt-0.5">{k}</span>
      <span className="text-sm text-slate-700">{v}</span>
    </div>
  );
}
