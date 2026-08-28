import { supabase } from './supabase';
import type { ReferralStats, AppConfig } from '../types';

/** localStorage key：用户点邀请链接带 ?ref=CODE 进入时暂存，注册时预填 */
const REFERRAL_CODE_KEY = 'referral_code';
/** localStorage key：设备指纹（持久化，用于防马甲号） */
const DEVICE_ID_KEY = 'yiyejianli_device_id';
/** 邀请奖励封顶次数 */
export const REFERRAL_BONUS_CAP = 2;

/** 从 URL 读取 ?ref= 参数（可测试的纯函数） */
export function readRefParam(search: string): string | null {
  const params = new URLSearchParams(search);
  const ref = (params.get('ref') || '').trim().toUpperCase();
  return /^[A-Z0-9]{6}$/.test(ref) ? ref : null;
}

/** 获取/生成持久化设备指纹（localStorage + 随机数） */
export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'dev_fallback_' + Math.random().toString(36).slice(2, 10);
  }
}

/** 暂存邀请码（从链接带参进入时调用） */
export function storeReferralCode(code: string | null): void {
  try {
    if (code) localStorage.setItem(REFERRAL_CODE_KEY, code);
    else localStorage.removeItem(REFERRAL_CODE_KEY);
  } catch {
    // localStorage 不可用时静默忽略
  }
}

/** 读取暂存的邀请码 */
export function getStoredReferralCode(): string | null {
  try {
    return localStorage.getItem(REFERRAL_CODE_KEY);
  } catch {
    return null;
  }
}

/** 调用发放 RPC，返回规范化的发放结果 */
export interface GrantResult {
  rewarded: boolean;
  already?: boolean;
  reason?: 'activity_closed' | 'invalid_code' | 'self_invite' | string;
  inviteeQuota?: number;
  inviterBonus?: number;
  inviterQuotaReached?: boolean;
  error?: string;
}

export async function grantReferralReward(inviteCode: string): Promise<GrantResult> {
  try {
    const { data, error } = await supabase.rpc('grant_referral_reward', {
      p_invite_code: inviteCode,
      p_device_id: getDeviceId(),
    });
    if (error) {
      console.error('grantReferralReward error:', error);
      return { rewarded: false, error: error.message };
    }
    return (data || { rewarded: false, reason: 'unknown' }) as GrantResult;
  } catch (err) {
    console.error('grantReferralReward failed:', err);
    return { rewarded: false, error: String(err) };
  }
}

/** 读取活动总开关（匿名/已登录均可） */
export async function fetchAppConfig(): Promise<AppConfig> {
  try {
    const { data, error } = await supabase.rpc('get_app_config');
    if (error) {
      console.warn('fetchAppConfig error:', error);
      return { referralEnabled: false };
    }
    return { referralEnabled: Boolean(data?.referral_enabled) };
  } catch (err) {
    console.warn('fetchAppConfig failed:', err);
    return { referralEnabled: false };
  }
}

/** 扣减 1 次 PDF 导出配额（RLS 收紧后唯一扣配额路径） */
export async function consumePdfQuota(): Promise<{ success: boolean; remaining: number; member: boolean; reason?: string }> {
  try {
    const { data, error } = await supabase.rpc('consume_quota', { p_type: 'pdf' });
    if (error) {
      console.error('consume_quota error:', error);
      return { success: false, remaining: 0, member: false, reason: error.message };
    }
    return data as { success: boolean; remaining: number; member: boolean; reason?: string };
  } catch (err) {
    console.error('consume_quota failed:', err);
    return { success: false, remaining: 0, member: false, reason: String(err) };
  }
}

/** 登录后幂等重试：若 localStorage 有未用的邀请码，尝试补发（网络中断兜底） */
export async function retryPendingReward(): Promise<GrantResult | null> {
  const code = getStoredReferralCode();
  if (!code) return null;
  const result = await grantReferralReward(code);
  if (result.rewarded || result.error) storeReferralCode(null);
  return result;
}

/** 从 User 对象推导邀请进度（纯函数，可测） */
export function deriveReferralStats(
  invitedCount: number | undefined,
  referralBonusCount: number | undefined
): ReferralStats {
  return {
    invitedCount: invitedCount ?? 0,
    bonusCount: Math.min(referralBonusCount ?? 0, REFERRAL_BONUS_CAP),
  };
}

/** 构造个人中心/首页展示的邀请链接 */
export function buildInviteLink(inviteCode: string | null | undefined, baseUrl = ''): string {
  if (!inviteCode) return '';
  if (baseUrl) return `${baseUrl.replace(/\/$/, '')}/?ref=${inviteCode}`;
  return `/?ref=${inviteCode}`;
}

/** 拉取当前登录用户的邀请进度（RPC get_my_referral_stats） */
export async function fetchMyReferralStats(): Promise<ReferralStats> {
  try {
    const { data, error } = await supabase.rpc('get_my_referral_stats');
    if (error) {
      console.warn('fetchMyReferralStats error:', error);
      return { invitedCount: 0, bonusCount: 0 };
    }
    return {
      invitedCount: Number(data?.invited_count ?? 0),
      bonusCount: Math.min(Number(data?.bonus_count ?? 0), REFERRAL_BONUS_CAP),
    };
  } catch (err) {
    console.warn('fetchMyReferralStats failed:', err);
    return { invitedCount: 0, bonusCount: 0 };
  }
}
