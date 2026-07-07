import React, { useMemo, useState } from 'react';
import { FileDown, FileText } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { FieldGroup, Input, Textarea } from '../components/ui/Field';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../auth/AuthContext';
import { FORM_SPECS, FormSpec, FormValues, formToMarkdown } from '../utils/planForm';
import { downloadHwpx } from '../utils/hwp';

export default function PlanFormView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [specId, setSpecId] = useState(FORM_SPECS[0].id);
  const spec = useMemo<FormSpec>(() => FORM_SPECS.find((s) => s.id === specId) ?? FORM_SPECS[0], [specId]);

  // 로그인 사용자 정보로 기본값 채우기
  const [values, setValues] = useState<FormValues>(() => ({
    studentId: user?.studentId ?? '',
    name: user?.name ?? '',
    grade: user?.grade ?? '',
  }));
  const [busy, setBusy] = useState(false);

  const set = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }));
  const markdown = useMemo(() => formToMarkdown(spec, values), [spec, values]);

  const onDownload = async () => {
    setBusy(true);
    try {
      const fname = `${values.studentId || '학번'}-${values.name || '성명'}-${spec.title}`;
      await downloadHwpx(markdown, fname, spec.preset);
      toast('HWP(HWPX) 파일을 생성했습니다.', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'HWP 변환 중 오류가 발생했습니다.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="양식 작성"
        sub="HWP 자동 변환"
        right={
          <Button onClick={onDownload} disabled={busy}>
            <FileDown size={15} />
            {busy ? '변환 중…' : 'HWP 다운로드'}
          </Button>
        }
      />

      <div className="mb-5 flex items-center gap-2">
        {FORM_SPECS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSpecId(s.id)}
            className={`border-2 border-slate-800 px-3 py-1.5 text-xs font-black ${
              s.id === specId ? 'bg-[#3c6e91] text-white' : 'bg-white text-slate-800 hover:bg-[#edf4ee]'
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* 입력 폼 */}
        <div className="border-2 border-slate-800 bg-white p-5 shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
          <h2 className="mb-4 text-sm font-black text-slate-900">{spec.title}</h2>
          <div className="flex flex-col gap-6">
            {spec.sections.map((section, i) => (
              <div key={i}>
                {section.kind === 'table' ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {section.fields.map((f) => (
                      <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
                        <FieldGroup label={f.label}>
                          <Input
                            type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                            value={values[f.key] ?? ''}
                            placeholder={f.placeholder}
                            onChange={(e) => set(f.key, e.target.value)}
                          />
                        </FieldGroup>
                      </div>
                    ))}
                  </div>
                ) : (
                  <FieldGroup label={section.heading ?? section.fields[0].label}>
                    <Textarea
                      rows={4}
                      value={values[section.fields[0].key] ?? ''}
                      placeholder={section.fields[0].placeholder}
                      onChange={(e) => set(section.fields[0].key, e.target.value)}
                    />
                  </FieldGroup>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 마크다운 미리보기 */}
        <div className="border-2 border-slate-800 bg-[#f8f8f4] p-4 shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-black text-slate-700">
            <FileText size={14} />
            변환 미리보기 (Markdown)
          </div>
          <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-slate-800 font-mono">
            {markdown}
          </pre>
        </div>
      </div>

      <p className="mt-4 text-[11px] font-bold text-slate-500">
        ※ 입력값이 양식 그대로 마크다운으로 변환되고, 서버(kordoc)에서 한컴 공문서 서식의 HWPX로 생성됩니다.
      </p>
    </div>
  );
}
