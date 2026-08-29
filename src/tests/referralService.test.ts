import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  readRefParam,
  deriveReferralStats,
  buildInviteLink,
  REFERRAL_BONUS_CAP,
  storeReferralCode,
  getStoredReferralCode,
} from '../lib/referralService';

// vitest 默认 node 环境无 localStorage，用内存 stub 模拟
const memoryStore = new Map<string, string>();
const localStorageStub = {
  getItem: (k: string) => memoryStore.get(k) ?? null,
  setItem: (k: string, v: string) => { memoryStore.set(k, v); },
  removeItem: (k: string) => { memoryStore.delete(k); },
} as unknown as Storage;

beforeAll(() => {
  (globalThis as any).localStorage = localStorageStub;
});
afterAll(() => {
  delete (globalThis as any).localStorage;
});

describe('readRefParam', () => {
  it('解析合法 6 位邀请码', () => {
    expect(readRefParam('?ref=ABC234')).toBe('ABC234');
  });
  it('忽略非法格式', () => {
    expect(readRefParam('?ref=abc')).toBeNull();
    expect(readRefParam('?ref=')).toBeNull();
    expect(readRefParam('?foo=1')).toBeNull();
  });
  it('忽略 URL 中其他参数', () => {
    expect(readRefParam('?ref=ABC234&utm=1')).toBe('ABC234');
  });
});

describe('deriveReferralStats', () => {
  it('未提供时默认 0/0', () => {
    expect(deriveReferralStats(undefined, undefined)).toEqual({ invitedCount: 0, bonusCount: 0 });
  });
  it('封顶到 2', () => {
    expect(deriveReferralStats(5, 3)).toEqual({ invitedCount: 5, bonusCount: REFERRAL_BONUS_CAP });
  });
});

describe('buildInviteLink', () => {
  it('拼接 baseUrl 与 ref', () => {
    expect(buildInviteLink('ABC234', 'https://resume.xnkun.com')).toBe('https://resume.xnkun.com/?ref=ABC234');
  });
  it('无码返回空串', () => {
    expect(buildInviteLink(null)).toBe('');
  });
});

describe('localStorage referral code', () => {
  it('存取一致', () => {
    storeReferralCode('ABC234');
    expect(getStoredReferralCode()).toBe('ABC234');
    storeReferralCode(null);
    expect(getStoredReferralCode()).toBeNull();
  });
});
