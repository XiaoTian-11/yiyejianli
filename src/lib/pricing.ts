import { PLANS, type Plan } from '../constants';
import type { PlanType } from '../types';

/**
 * 根据方案类型计算会员到期日
 */
export function calculateMemberUntil(planType: string): string {
  const now = new Date();
  switch (planType) {
    case 'week': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    case 'month': return new Date(now.setMonth(now.getMonth() + 1)).toISOString();
    case 'quarter': return new Date(now.setMonth(now.getMonth() + 3)).toISOString();
    case 'year': return new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
    case 'lifetime': return '2099-12-31T23:59:59Z';
    case 'student_year': return new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
    default: return new Date(now.setMonth(now.getMonth() + 1)).toISOString();
  }
}

/**
 * 按方案类型查找方案
 */
export function getPlanByType(type: PlanType): Plan | undefined {
  return PLANS.find(p => p.type === type);
}

/** PLANS 的引用导出（测试用） */
export { PLANS as PLANS_WITH_CATEGORY };
