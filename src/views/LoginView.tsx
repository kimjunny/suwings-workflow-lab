import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { USERS } from '../data/seed';
import { ROLE_LABEL } from '../types';
import { useSettings } from '../store/settingsStore';
import Button from '../components/ui/Button';
import { Input, Label } from '../components/ui/Field';
import { ShieldAlert, AlertCircle, Lock, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function LoginView() {
  const { login } = useAuth();
  const { state: settings } = useSettings();
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(id, pw);
    if (res.ok) navigate('/');
    else setError(res.error ?? '로그인에 실패했습니다.');
  };

  const quick = (uid: string, upw: string) => {
    setId(uid);
    setPw(upw);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e9ecef] px-4 font-mono select-none">
      <div className="w-full max-w-sm flex flex-col gap-4 border border-[#222222] bg-[#ffffff] p-6">
        <div className="text-center border-b border-[#222222] pb-3">
          <h1 className="text-sm font-black text-[#1a251e] tracking-tight">
            국방 비교과 학사행정체계 (DELIS)
          </h1>
          <p className="text-[10px] text-slate-500 font-bold mt-1">
            [등급: II급 비밀 정보체계]
          </p>
        </div>

        {/* 심플한 경고 알림 */}
        <div className="border border-[#b23b3b] p-2.5 text-[11px] text-[#b23b3b] bg-[#fff5f5] leading-normal font-bold">
          <strong>[보안통제 경고]</strong> 본 망은 군 내부 전용망입니다. 허가받지 않은 모든 접근과 무단 정보 수집 행위는 군사보안 수칙에 의거 추적 및 엄벌합니다.
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-700">군번 / ID</label>
            <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="군번 또는 ID" autoFocus />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-700">비밀번호 / PASSWORD</label>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" />
          </div>
          {error && (
            <div className="flex items-center gap-1 text-xs text-[#b23b3b] font-bold">
              <AlertCircle size={12} /> {error}
            </div>
          )}
          <Button type="submit" variant="success" className="w-full text-xs py-2 mt-1">
            보안 접속 요청
          </Button>
        </form>

        {/* 간소화된 계정 리스트 */}
        <div className="border-t border-[#cccccc] pt-3 text-xs flex flex-col gap-2">
          <div className="text-[10px] text-slate-500 font-bold">대원 로그인 정보 시뮬레이션 (원클릭 자동 입력)</div>
          <div className="grid grid-cols-2 gap-1.5">
            {USERS.map((u) => {
              const milRole =
                u.role === 'STUDENT' ? '학사생도' :
                u.role === 'PROFESSOR' ? '지도대위' :
                u.role === 'HEAD' ? '대대장' : '행정 준위';
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => quick(u.id, u.pw)}
                  className="text-left border border-[#cccccc] bg-[#f8f9fa] p-2 hover:bg-[#e9ecef] cursor-pointer"
                >
                  <span className="block text-[11px] font-black text-slate-800">{milRole}: {u.name}</span>
                  <span className="block text-[10px] text-slate-500 font-mono">{u.id}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
