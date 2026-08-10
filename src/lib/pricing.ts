import { PLANS } from '../constants';
import type { Plan, PlanType } from '../types';

/**
 * 根据方案类型计算会员到期日
 * @param base 基准日期（可选）：续费叠加时传入原到期日，从该日起加时长；默认从今天起算
 */
export function calculateMemberUntil(planType: string, base?: Date | string): string {
  const now = base ? new Date(base) : new Date();
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
 * 续费后的到期日（叠加）：已有未过期会员则在其到期日上叠加套餐时长；
 * 已是终身（2099）保持永久；否则从今天起算。
 */
export function calculateRenewedMemberUntil(planType: string, currentMemberUntil?: string): string {
  if (currentMemberUntil && currentMemberUntil.startsWith('2099')) return '2099-12-31T23:59:59Z';
  const base =
    currentMemberUntil && new Date(currentMemberUntil) > new Date() ? currentMemberUntil : undefined;
  return calculateMemberUntil(planType, base);
}

/**
 * 按方案类型查找方案
 */
export function getPlanByType(type: PlanType): Plan | undefined {
  return PLANS.find(p => p.type === type);
}

/** PLANS 的引用导出（测试用） */
export { PLANS as PLANS_WITH_CATEGORY };

/**
 * 推导当前生效的会员套餐：
 * 仅当会员有效（tier=member）时，取最近一笔已完成的订阅订单（排除单次导出）作为“当前持有”套餐。
 * 订单需按 created_at 降序传入（与 getMyOrders 一致）。
 * 用于定价页精确标记“当前持有”，避免把未购买的季卡/年卡/终身卡/学生年卡误标。
 */
export function deriveCurrentPlan(
  orders: { status: string; planType: string }[],
  tier: string
): PlanType | undefined {
  if (tier !== 'member') return undefined;
  const active = orders.find((o) => o.status === 'completed' && o.planType !== 'single_export');
  return active ? (active.planType as PlanType) : undefined;
}
