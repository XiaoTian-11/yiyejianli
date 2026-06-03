import { describe, it, expect } from 'vitest';
import { calculateMemberUntil, getPlanByType, PLANS_WITH_CATEGORY } from '../lib/pricing';

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
