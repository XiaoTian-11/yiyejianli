import { describe, it, expect } from 'vitest';
import { calculateMemberUntil, calculateRenewedMemberUntil, getPlanByType, PLANS_WITH_CATEGORY, deriveCurrentPlan } from '../lib/pricing';

describe('pricing utilities', () => {
  describe('calculateMemberUntil', () => {
    it('should return a date 1 week later for week plan', () => {
      const before = new Date();
      const result = calculateMemberUntil('week');
      const resultDate = new Date(result);
      const after = new Date();

      const diffDays = (resultDate.getTime() - before.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(6);
      expect(diffDays).toBeLessThanOrEqual(8);
    });

    it('should return a date ~1 month later for month plan', () => {
      const result = calculateMemberUntil('month');
      const resultDate = new Date(result);
      const now = new Date();

      expect(resultDate.getMonth()).toBe((now.getMonth() + 1) % 12);
      expect(resultDate.getFullYear()).toBe(now.getFullYear() + (now.getMonth() + 1 >= 12 ? 1 : 0));
    });

    it('should return a date ~1 year later for year plan', () => {
      const result = calculateMemberUntil('year');
      const resultDate = new Date(result);
      const now = new Date();

      expect(resultDate.getFullYear()).toBe(now.getFullYear() + 1);
    });

    it('should return a date ~3 months later for quarter plan', () => {
      const result = calculateMemberUntil('quarter');
      const resultDate = new Date(result);
      const now = new Date();

      const diffMonths = (resultDate.getFullYear() - now.getFullYear()) * 12
        + (resultDate.getMonth() - now.getMonth());
      expect(diffMonths).toBeGreaterThanOrEqual(2);
      expect(diffMonths).toBeLessThanOrEqual(4);
    });

    it('should return far-future date for lifetime plan', () => {
      const result = calculateMemberUntil('lifetime');
      expect(result).toBe('2099-12-31T23:59:59Z');
    });

    it('should return a date ~1 year later for student_year plan', () => {
      const result = calculateMemberUntil('student_year');
      const resultDate = new Date(result);
      const now = new Date();

      expect(resultDate.getFullYear()).toBe(now.getFullYear() + 1);
    });

    it('should return a default ~1 month for unknown plan type', () => {
      const result = calculateMemberUntil('unknown_plan' as any);
      const resultDate = new Date(result);
      const now = new Date();

      expect(resultDate.getMonth()).toBe((now.getMonth() + 1) % 12);
    });
  });

  describe('getPlanByType', () => {
    it('should return the correct plan for single_export', () => {
      const plan = getPlanByType('single_export');
      expect(plan).toBeDefined();
      expect(plan?.type).toBe('single_export');
      expect(plan?.price).toBe(5.9);
      expect(plan?.category).toBe('one_time');
      expect(plan?.exportQuota).toBe(1);
    });

    it('should return the correct plan for month', () => {
      const plan = getPlanByType('month');
      expect(plan).toBeDefined();
      expect(plan?.type).toBe('month');
      expect(plan?.price).toBe(15);
      expect(plan?.category).toBe('subscription');
    });

    it('should return undefined for unknown plan type', () => {
      const plan = getPlanByType('nonexistent' as any);
      expect(plan).toBeUndefined();
    });
  });

  describe('deriveCurrentPlan', () => {
    it('should return undefined when tier is not member', () => {
      const orders = [{ status: 'completed', planType: 'month' }];
      expect(deriveCurrentPlan(orders, 'free')).toBeUndefined();
      expect(deriveCurrentPlan(orders, 'guest')).toBeUndefined();
    });

    it('should return the most recent completed subscription plan for a member', () => {
      const orders = [
        { status: 'completed', planType: 'month' }, // 最近一笔（已按 created_at 降序）
        { status: 'completed', planType: 'year' },
      ];
      expect(deriveCurrentPlan(orders, 'member')).toBe('month');
    });

    it('should pick the completed order even when a newer one is pending', () => {
      const orders = [
        { status: 'pending', planType: 'quarter' }, // 未支付的最新订单不生效
        { status: 'completed', planType: 'month' },
      ];
      expect(deriveCurrentPlan(orders, 'member')).toBe('month');
    });

    it('should ignore one-time single_export orders', () => {
      const orders = [
        { status: 'completed', planType: 'month' },
        { status: 'completed', planType: 'single_export' },
      ];
      expect(deriveCurrentPlan(orders, 'member')).toBe('month');
    });

    it('should return undefined for member without any completed subscription order', () => {
      const orders = [{ status: 'pending', planType: 'month' }];
      expect(deriveCurrentPlan(orders, 'member')).toBeUndefined();
    });

    it('should return the purchased plan only, not mark other plans', () => {
      // 用户只买了 month：只有 month 是“当前持有”
      const orders = [{ status: 'completed', planType: 'month' }];
      const current = deriveCurrentPlan(orders, 'member');
      for (const type of ['week', 'quarter', 'year', 'lifetime', 'student_year']) {
        expect(current).not.toBe(type);
      }
      expect(current).toBe('month');
    });
  });

  describe('calculateRenewedMemberUntil', () => {
    it('有未过期会员时在原到期日上叠加时长', () => {
      // 基准取未来的 2026-10-02（相对"今天"未过期），+1 个月 → 2026-11-02
      const result = new Date(calculateRenewedMemberUntil('month', '2026-10-02T12:00:00Z'));
      expect(result.getUTCFullYear()).toBe(2026);
      expect(result.getUTCMonth()).toBe(10); // 11 月
      expect(result.getUTCDate()).toBe(2);
    });

    it('无会员记录时从今天起算', () => {
      const result = new Date(calculateRenewedMemberUntil('month'));
      expect(result.getTime()).toBeGreaterThan(Date.now());
    });

    it('已是终身会员续费保持永久', () => {
      expect(calculateRenewedMemberUntil('month', '2099-12-31T23:59:59Z')).toBe('2099-12-31T23:59:59Z');
    });

    it('会员已过期则从今天起算', () => {
      const result = new Date(calculateRenewedMemberUntil('month', '2020-01-01T00:00:00Z'));
      expect(result.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('PLANS_WITH_CATEGORY', () => {
    it('should include single_export in the plans list', () => {
      const singleExport = PLANS_WITH_CATEGORY.find(p => p.type === 'single_export');
      expect(singleExport).toBeDefined();
    });

    it('should have category field on every plan', () => {
      for (const plan of PLANS_WITH_CATEGORY) {
        expect(plan.category).toBeDefined();
        expect(['one_time', 'subscription']).toContain(plan.category);
      }
    });

    it('should set exportQuota to 1 for single_export', () => {
      const singleExport = PLANS_WITH_CATEGORY.find(p => p.type === 'single_export')!;
      expect(singleExport.exportQuota).toBe(1);
    });

    it('should not have exportQuota on subscription plans', () => {
      const subscriptionPlans = PLANS_WITH_CATEGORY.filter(p => p.category === 'subscription');
      for (const plan of subscriptionPlans) {
        expect(plan.exportQuota).toBeUndefined();
      }
    });

    it('should have exactly 7 plans (1 one_time + 6 subscription)', () => {
      expect(PLANS_WITH_CATEGORY.length).toBe(7);
      const oneTime = PLANS_WITH_CATEGORY.filter(p => p.category === 'one_time');
      const subscriptions = PLANS_WITH_CATEGORY.filter(p => p.category === 'subscription');
      expect(oneTime.length).toBe(1);
      expect(subscriptions.length).toBe(6);
    });
  });
});
