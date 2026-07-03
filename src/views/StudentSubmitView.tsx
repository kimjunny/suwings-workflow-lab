import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Languages, HeartHandshake } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

const CARDS = [
  {
    to: '/dept',
    title: '학과내 비교과 신청·제출',
    description: '대표학생으로 프로그램을 등록하고 팀원, 계획서, 결과보고서 PDF를 제출합니다.',
    icon: BookOpen,
  },
  {
    to: '/toeic',
    title: '토익 정보 입력',
    description: '응시일자, 수험번호, 점수, 발급번호 등 성적표 기재 정보를 입력합니다.',
    icon: Languages,
  },
  {
    to: '/volunteer',
    title: '봉사 인증서 업로드',
    description: '전공연계봉사활동을 등록하고 담당교수 서명 인증서를 업로드합니다.',
    icon: HeartHandshake,
  },
];

export default function StudentSubmitView() {
  return (
    <div>
      <PageHeader title="신청·제출" sub="학생 제출 포털" />
      <div className="grid gap-4 md:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <card.icon size={24} className="mb-4 text-blue-600" />
            <h2 className="mb-2 text-base font-semibold text-slate-800">{card.title}</h2>
            <p className="text-sm leading-6 text-slate-500">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
