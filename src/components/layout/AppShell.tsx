import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { canAccessView, ViewKey } from '../../auth/roles';
import { ROLE_LABEL, Role } from '../../types';
import { LayoutDashboard, BookOpen, Languages, HeartHandshake, BarChart3, LogOut, Menu, RotateCcw, ClipboardCheck, MessageSquare } from 'lucide-react';
import { useRecords } from '../../store/recordsStore';
import { useToast } from '../ui/Toast';

const ICONS = {
  integrated: LayoutDashboard,
  submit: ClipboardCheck,
  dept: BookOpen,
  toeic: Languages,
  volunteer: HeartHandshake,
  stats: BarChart3,
} satisfies Record<ViewKey, React.ComponentType<{ size?: number }>>;

type NavItem = { key: ViewKey; to: string; label: string; icon: React.ComponentType<{ size?: number }> };

const roleNav = (role: Role): NavItem[] => {
  const item = (key: ViewKey, to: string, label: string, icon = ICONS[key]): NavItem => ({ key, to, label, icon });
  switch (role) {
    case 'STUDENT':
      return [
        item('integrated', '/integrated', '내 현황'),
        item('submit', '/submit', '신청·제출'),
      ];
    case 'PROFESSOR':
      return [
        item('integrated', '/integrated', '배정 검토함'),
        item('dept', '/dept', '학과내 검토'),
        item('toeic', '/toeic', '토익 검토'),
        item('volunteer', '/volunteer', '봉사 검토'),
      ];
    case 'HEAD':
      return [
        item('integrated', '/integrated', '전체조회'),
        item('dept', '/dept', '학과내 최종승인'),
        item('toeic', '/toeic', '토익 최종승인'),
        item('volunteer', '/volunteer', '봉사 최종승인'),
        item('stats', '/stats', '통계'),
      ];
    case 'STAFF':
      return [
        item('integrated', '/integrated', '전체조회'),
        item('dept', '/dept', '학과내 코멘트', MessageSquare),
        item('toeic', '/toeic', '토익 코멘트', MessageSquare),
        item('volunteer', '/volunteer', '봉사 코멘트', MessageSquare),
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
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <aside
        className={`fixed lg:static z-40 h-full w-64 bg-slate-900 flex flex-col shrink-0 transition-transform ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-14 border-b border-slate-700/60 flex items-center px-6 shrink-0 gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">S</div>
          <h1 className="text-sm font-semibold tracking-tight text-white">삼육대 약대 <span className="text-slate-400 font-normal">/ 비교과</span></h1>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto" data-testid="role-nav">
          {items.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800 font-normal'
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-700/60 p-3">
          <button onClick={resetData} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800">
            <RotateCcw size={14} /> 데이터 초기화
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6 shrink-0">
          <button className="lg:hidden text-slate-600" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-sm font-medium text-slate-800">{user.name}</div>
              <div className="text-[11px] text-slate-400">{ROLE_LABEL[user.role]}</div>
            </div>
            <span className="inline-block px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
              {ROLE_LABEL[user.role]}
            </span>
            <button onClick={doLogout} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
              <LogOut size={16} /> 로그아웃
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="mx-auto max-w-[1280px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
