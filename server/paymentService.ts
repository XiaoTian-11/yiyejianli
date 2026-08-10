import type { SupabaseClient } from '@supabase/supabase-js';
import { PLANS } from '../src/constants';
import type { Plan, PlanType } from '../src/types';

// ============================================================================
// 支付/订单核心业务逻辑（纯逻辑，可单测）
// - 金额、到期日一律由服务端计算，绝不信任前端
// - 数据访问注入 admin client（service_role，绕过 RLS）
// ============================================================================

export interface OrderRecord {
  id: string;                // 商户订单号
  user_id: string;
  plan_type: string;
  amount: number;            // 元
  payment_method: string;
  status: 'pending' | 'paid' | 'completed' | 'expired' | 'cancelled';
  gateway_trade_no?: string;
  created_at: string;
  paid_at?: string;
  expires_at: string;
  completed_at?: string;
}

export type OrderStatus = OrderRecord['status'];

/** 支付网关 provider 抽象 */
export interface OrderProvider {
  readonly name: string;
  /** 创建支付单，返回扫码内容 codeUrl */
  createOrder(input: {
    orderId: string;
    description: string;
    amountFen: number;
    notifyUrl: string;
  }): Promise<{ codeUrl: string; gatewayTradeNo?: string }>;
  /** 模拟模式专用：模拟用户扫码支付成功（真实网关无此方法） */
  markPaid?(orderId: string): Promise<void>;
}

export class PaymentError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

export interface PaymentDeps {
  admin: SupabaseClient;
  provider: OrderProvider;
  /** 可注入时钟，便于测试 */
  now?: () => Date;
}

const toFen = (yuan: number) => Math.round(yuan * 100);

/** 生成商户订单号（≤32 字符，满足微信 out_trade_no 约束） */
export function generateOrderId(now: Date = new Date()): string {
  const ts = now.toISOString().replace(/[-:T]/g, '').slice(0, 14); // 14 位
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase(); // 6 位
  return `YJL${ts}${rand}`; // 22 字符
}

/** 订单有效期：默认 30 分钟 */
export function calculateExpiresAt(now: Date = new Date()): string {
  return new Date(now.getTime() + 30 * 60 * 1000).toISOString();
}

/** 从服务端 PLANS 取方案，金额以分为单位返回；非法方案返回 null */
export function getPlan(planType: string): Plan | undefined {
  return PLANS.find(p => p.type === planType as PlanType);
}

/** 到期日计算（与 src/lib/pricing.ts 保持一致） */
export function calcMemberUntil(planType: string, now: Date = new Date()): string | null {
  switch (planType) {
    case 'week': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    case 'month': return new Date(now.setMonth(now.getMonth() + 1)).toISOString();
    case 'quarter': return new Date(now.setMonth(now.getMonth() + 3)).toISOString();
    case 'year':
    case 'student_year':
      return new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
    case 'lifetime': return '2099-12-31T23:59:59Z';
    default: return null;
  }
}

// ---------------------------------------------------------------------------
// 创建订单
// ---------------------------------------------------------------------------
export async function createOrder(
  deps: PaymentDeps,
  params: { userId: string; planType: string; paymentMethod?: string }
): Promise<{ order: OrderRecord; codeUrl: string; amountFen: number }> {
  const { admin, provider } = deps;
  const now = deps.now ? deps.now() : new Date();

  const plan = getPlan(params.planType);
  if (!plan) throw new PaymentError('INVALID_PLAN', `未知的方案类型: ${params.planType}`);
  if (!params.userId) throw new PaymentError('INVALID_USER', '缺少 userId');

  const paymentMethod = params.paymentMethod === 'alipay' ? 'alipay' : 'wechat';
  const orderId = generateOrderId(now);
  const amountFen = toFen(plan.price);

  const order: OrderRecord = {
    id: orderId,
    user_id: params.userId,
    plan_type: plan.type,
    amount: plan.price,
    payment_method: paymentMethod,
    status: 'pending',
    created_at: now.toISOString(),
    expires_at: calculateExpiresAt(now),
  };

  // 调支付网关下单，拿扫码内容
  const { codeUrl, gatewayTradeNo } = await provider.createOrder({
    orderId,
    description: `壹页简历-${plan.name}`,
    amountFen,
    notifyUrl: buildNotifyUrl(plan.type),
  });

  if (gatewayTradeNo) order.gateway_trade_no = gatewayTradeNo;

  const { error } = await admin.from('orders').insert(order);
  if (error) throw new PaymentError('DB_INSERT_ORDER', `写入订单失败: ${error.message}`);

  return { order, codeUrl, amountFen };
}

// ---------------------------------------------------------------------------
// 完成订单（支付成功 → 更新订单状态 + 更新 users 表）
// 幂等：重复回调安全
// ---------------------------------------------------------------------------
export async function completeOrder(
  deps: PaymentDeps,
  orderId: string,
  opts: { gatewayTradeNo?: string } = {}
): Promise<{ order: OrderRecord; userUpdate: UserUpdateResult | null; alreadyCompleted: boolean }> {
  const { admin } = deps;
  const now = deps.now ? deps.now() : new Date();

  const { data: order, error: fetchErr } = await admin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (fetchErr) throw new PaymentError('DB_READ_ORDER', `读取订单失败: ${fetchErr.message}`);
  if (!order) throw new PaymentError('ORDER_NOT_FOUND', `订单不存在: ${orderId}`);

  // 幂等：已完成的订单直接返回，避免重复加配额
  if (order.status === 'completed') {
    return { order: order as OrderRecord, userUpdate: null, alreadyCompleted: true };
  }
  if (order.status === 'expired' || order.status === 'cancelled') {
    throw new PaymentError('ORDER_CLOSED', `订单已${order.status}，无法完成`);
  }

  const nextStatus: OrderStatus = 'completed';
  const { error: updErr } = await admin
    .from('orders')
    .update({
      status: nextStatus,
      paid_at: now.toISOString(),
      completed_at: now.toISOString(),
      gateway_trade_no: opts.gatewayTradeNo || order.gateway_trade_no || null,
    })
    .eq('id', orderId);

  if (updErr) throw new PaymentError('DB_UPDATE_ORDER', `更新订单失败: ${updErr.message}`);

  // 根据方案更新 users 表
  const userUpdate = await applyPlanToUser(deps, order.user_id, order.plan_type, now);

  return { order: { ...(order as OrderRecord), status: nextStatus, completed_at: now.toISOString() }, userUpdate, alreadyCompleted: false };
}

export interface UserUpdateResult {
  tier: string;
  member_until: string | null;
  remaining_pdf_exports: number;
}

async function applyPlanToUser(
  deps: PaymentDeps,
  userId: string,
  planType: string,
  now: Date
): Promise<UserUpdateResult> {
  const { admin } = deps;

  // 读当前用户记录（不存在则建默认 free）
  const { data: user } = await admin
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  let row;
  if (user) {
    row = { ...user };
  } else {
    row = { id: userId, email: '', tier: 'free', member_until: null, remaining_pdf_exports: 0, remaining_png_exports: 0, remaining_ats_checks: 0 };
  }

  if (planType === 'single_export') {
    // 单次导出：仅 +1 导出次数，不改变 tier
    row.remaining_pdf_exports = (row.remaining_pdf_exports || 0) + 1;
  } else {
    // 订阅：升级为 member
    row.tier = 'member';
    row.member_until = calcMemberUntil(planType, now);
    row.remaining_pdf_exports = 999;
  }

  const { error } = await admin.from('users').upsert(row, { onConflict: 'id' });
  if (error) throw new PaymentError('DB_UPDATE_USER', `更新会员失败: ${error.message}`);

  return {
    tier: row.tier,
    member_until: row.member_until,
    remaining_pdf_exports: row.remaining_pdf_exports,
  };
}

// ---------------------------------------------------------------------------
// 查询订单
// ---------------------------------------------------------------------------
export async function queryOrder(
  deps: PaymentDeps,
  orderId: string
): Promise<OrderRecord | null> {
  const { admin } = deps;
  const { data, error } = await admin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (error) throw new PaymentError('DB_READ_ORDER', `读取订单失败: ${error.message}`);
  return (data as OrderRecord) || null;
}

/** 构建微信支付回调通知 URL（默认用 APP_URL 推导） */
export function buildNotifyUrl(_planType?: string): string {
  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
  if (appUrl) return `${appUrl}/api/payment/notify/wechat`;
  return 'https://your-domain.com/api/payment/notify/wechat';
}
