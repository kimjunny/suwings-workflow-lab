import { VolunteerRecord } from '../types';

// 봉사 달성률 기준 시간 (스펙: 20시간 = 100%)
export const VOLUNTEER_TARGET_HOURS = 20;

const isVolApproved = (r: VolunteerRecord) => r.status === '최종 승인' || r.status === '승인';

// 누적 봉사시간 = 특정 학생의 '최종 승인된' 봉사 건들의 인정시간 합 (스펙 R5)
export function accumulatedApprovedHours(all: VolunteerRecord[], studentId: string): number {
  return all
    .filter((r) => r.studentId === studentId && isVolApproved(r))
    .reduce((sum, r) => sum + (r.recognizedHours || 0), 0);
}

// 봉사 달성률 = min(누적 승인시간 / 20, 1) * 100 (선형)
export function volunteerPercent(hours: number): number {
  return Math.min(hours / VOLUNTEER_TARGET_HOURS, 1) * 100;
}
