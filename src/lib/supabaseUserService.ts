import { supabase } from './supabase';
import type { User } from '../types';

function rowToUser(data: any): User {
  return {
    id: data.id,
    email: data.email,
    tier: data.tier,
    memberUntil: data.member_until || undefined,
    remainingPdfExports: data.remaining_pdf_exports ?? 0,
    remainingPngExports: data.remaining_png_exports ?? 0,
    remainingAtsChecks: data.remaining_ats_checks ?? 0,
    status: data.status === 'disabled' ? 'disabled' : 'active',
    inviteCode: data.invite_code || undefined,
    invitedCount: data.invited_count ?? 0,
    referralBonusCount: data.referral_bonus_count ?? 0,
  };
}

/**
 * 获取用户的会员信息
 * 如数据库无记录则创建默认记录
 */
export async function getUser(userId: string): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      // 表不存在或其他数据库错误
      return { user: null, error: error.message };
    }

    if (data) {
      return { user: rowToUser(data), error: null };
    }

    // 无记录 → 创建默认 free 用户
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: '',
        tier: 'free',
        remaining_pdf_exports: 0,
      })
      .select()
      .single();

    if (insertError) {
      return { user: null, error: insertError.message };
    }

    return { user: rowToUser(newUser), error: null };
  } catch (err) {
    return { user: null, error: String(err) };
  }
}

/**
 * 更新用户会员信息。
 * ⚠️ RLS 已收紧（用户不可 UPDATE 自身行），此函数仅能由「服务端/后台」使用；
 * 前端如需改配额/权益，一律走对应 RPC（consume_quota / grant_referral_reward / complete_payment_order）。
 */
export async function updateUser(
  userId: string,
  updates: Partial<{
    email: string;
    tier: string;
    member_until: string | null;
    remaining_pdf_exports: number;
    remaining_png_exports: number;
    remaining_ats_checks: number;
  }>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * 检查会员是否过期，过期则自动降级
 * 返回降级后的用户信息
 */
export async function checkAndDowngrade(userId: string): Promise<{ user: User | null; downgraded: boolean; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return { user: null, downgraded: false, error: error?.message || 'User not found' };
    }

    let downgraded = false;
    if (data.tier === 'member' && data.member_until) {
      const memberUntil = new Date(data.member_until);
      if (memberUntil < new Date()) {
        // 已过期，降级
        const { error: updateError } = await supabase
          .from('users')
          .update({ tier: 'free', member_until: null })
          .eq('id', userId);

        if (updateError) {
          return { user: null, downgraded: false, error: updateError.message };
        }

        downgraded = true;
        data.tier = 'free';
        data.member_until = null;
      }
    }

    return { user: rowToUser(data), downgraded, error: null };
  } catch (err) {
    return { user: null, downgraded: false, error: String(err) };
  }
}
