import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { canAccessView, ViewKey } from '../../auth/roles';
import { ROLE_LABEL, Role } from '../../types';
import { LayoutDashboard, BookOpen, Languages, HeartHandshake, BarChart3, LogOut, Menu, RotateCcw, ClipboardCheck, MessageSquare, Settings } from 'lucide-react';
import { useRecords } from '../../store/recordsStore';
import { useToast } from '../ui/Toast';
import { useSettings } from '../../store/settingsStore';

const ICONS = {
  integrated: LayoutDashboard,
  submit: ClipboardCheck,
  dept: BookOpen,
  toeic: Languages,
  volunteer: HeartHandshake,
  stats: BarChart3,
  settings: Settings,
} satisfies Record<ViewKey, React.ComponentType<{ size?: number }>>;

type NavItem = { key: ViewKey; to: string; label: string; icon: React.ComponentType<{ size?: number }> };

const MIL_ROLE_LABEL: Record<Role, string> = {
  STUDENT: '학사생도',
  PROFESSOR: '지도관(대위)',
  HEAD: '대대장(중령)',
  STAFF: '행정 준위',
};
const roleNav = (role: Role): NavItem[] => {
  const item = (key: ViewKey, to: string, label: string, icon = ICONS[key]): NavItem => ({ key, to, label, icon });
  switch (role) {
    case 'STUDENT':
      return [
        item('integrated', '/integrated', '개인 자력대장 (통합 현황)'),
        item('submit', '/submit', '지상작전 보고 (신청·제출)'),
      ];
    case 'PROFESSOR':
      return [
        item('integrated', '/integrated', '인사사령부 자력조회 (전체)'),
        item('dept', '/dept', '지상작전 교육현황 (학과내)'),
        item('toeic', '/toeic', '어학 전투력 대장 (토익)'),
        item('volunteer', '/volunteer', '대민 지원 대장 (봉사)'),
      ];
    case 'HEAD':
      return [
        item('integrated', '/integrated', '인사사령부 자력조회 (전체)'),
        item('dept', '/dept', '지상작전 교육승인 (학과내)'),
        item('toeic', '/toeic', '어학 전투력 승인 (토익)'),
        item('volunteer', '/volunteer', '대민 지원 승인 (봉사)'),
        item('stats', '/stats', '분석평가단 (통계 지표)'),
        item('settings', '/settings', '정보체계관리단 (설정)'),
      ];
    case 'STAFF':
      return [
        item('integrated', '/integrated', '인사사령부 자력조회 (전체)'),
        item('dept', '/dept', '지상작전 실무검토 (학과내)', MessageSquare),
        item('toeic', '/toeic', '어학 전투력 실무검토 (토익)', MessageSquare),
        item('volunteer', '/volunteer', '대민 지원 실무검토 (봉사)', MessageSquare),
        item('settings', '/settings', '정보체계관리단 (설정)'),
      ];
    default:
      return [];
  }
};

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { dispatch } = useRecords();
  const { toast } = useToast();
  const { state: settings } = useSettings();
  const [open, setOpen] = useState(false);

  if (!user) return null;
  const items = roleNav(user.role).filter((n) => canAccessView(user.role, n.key));

  const doLogout = () => {
    logout();
    navigate('/login');
  };
  const resetData = () => {
    if (confirm('목업 데이터를 초기 시드 상태로 되돌립니다. 계속할까요?')) {
      dispatch({ type: 'RESET' });
      toast('데이터를 초기화했습니다.', 'info');
    }
  };

  return (
    <div className="flex h-screen bg-[#e9ecef] font-mono text-slate-900 overflow-hidden relative">
      <aside
        className={`fixed lg:static z-40 h-full w-60 bg-[#2b352e] border-r border-[#111111] flex flex-col shrink-0 transition-transform ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-12 border-b border-[#18201a] flex items-center px-4 shrink-0 gap-2 bg-[#121c14]">
          <div className="w-5 h-5 rounded-full bg-[#ffcc00] flex items-center justify-center text-[#1c241f] font-black text-xs select-none">★</div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white leading-none">대한민국 육군</span>
            <span className="text-[11px] font-black text-yellow-400 leading-tight">DELIS 비교과</span>
          </div>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto" data-testid="role-nav">
          {items.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `w-full flex items-center gap-2 px-3 py-2 text-xs font-bold transition-none ${
                  isActive 
                    ? 'bg-[#1c241f] text-yellow-400 border-l-4 border-yellow-500' 
                    : 'text-slate-300 hover:bg-[#202b23] border-l-4 border-transparent'
                }`
              }
            >
              <item.icon size={13} className="shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-3 bg-[#1c241f] border-t border-[#18201a] text-center font-mono">
          <div className="text-[9px] text-[#8e9a91] font-bold leading-normal text-left mb-2">
            <strong>[육군의 임무 - 국군조직법]</strong><br />
            지상작전을 주 임무로 하고, 이를 위하여 편성되고 장비를 갖추며 필요한 교육훈련을 한다.
          </div>
          <button onClick={resetData} className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-[#2b352e] hover:bg-[#344038] border border-[#444444] text-[10px] text-slate-300 font-bold cursor-pointer">
            <RotateCcw size={10} /> 데이터 초기 시드 복구
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 플랫 헤더바 */}
        <header className="win7-titlebar-mil h-12 flex items-center justify-between px-4 shrink-0 z-10 select-none">
          <button className="lg:hidden text-white" onClick={() => setOpen(true)}><Menu size={20} /></button>
          
          {/* 플랫 알림 텍스트 */}
          <div className="flex-1 max-w-lg mx-4 hidden md:block text-xs text-yellow-300 font-bold">
            {settings.notices.length > 0 && `[부대공지] ${settings.notices[0].title}`}
          </div>

          {/* 군인 정보 및 안전종료 */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-white">
              {user.name} ({MIL_ROLE_LABEL[user.role]})
            </span>
            <button onClick={doLogout} className="flex items-center gap-1 px-2.5 py-1 bg-[#a93232] hover:bg-[#c33d3d] border border-[#752323] text-xs font-bold text-white cursor-pointer">
              안전종료
            </button>
          </div>
        </header>

        {/* 메인 콘텐츠 영역: 단색 그레이 백그라운드 */}
        <main className="flex-1 overflow-auto p-4 bg-[#e9ecef]">
          <div className="mx-auto max-w-[1280px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
