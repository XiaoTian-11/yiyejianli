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
  // 退款相关（20260828_refund.sql 迁移后存在；未迁移环境 undefined）
  refund_amount?: number;    // 累计已退（元）
  refund_status?: 'partial' | 'full' | null;
  refunded_at?: string | null;
  refunded_by?: string | null;
}

export type OrderStatus = OrderRecord['status'];

/** 支付渠道：native=扫码（桌面）| jsapi=微信内直接调起 | h5=微信外手机浏览器跳转收银台 */
export type PayChannel = 'native' | 'jsapi' | 'h5';

/** JSAPI 调起参数（微信内 WeixinJSBridge 用） */
export interface JsapiParams {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string; // prepay_id=xxx
  signType: string;
  paySign: string;
}

/** 退款发起输入（金额单位：元） */
export interface RefundInput {
  outTradeNo: string;
  outRefundNo: string;
  refundFen: number;
  totalFen: number;
  reason?: string;
  notifyUrl?: string;
}

export interface RefundResult {
  /** 网关退款状态：SUCCESS | PROCESSING | CLOSED | ABNORMAL */
  status?: string;
  wechatRefundId?: string;
  [key: string]: unknown;
}

/** 支付网关 provider 抽象 */
export interface OrderProvider {
  readonly name: string;
  /** 创建支付单，返回扫码内容 codeUrl（native）或 jsapiParams（jsapi） */
  createOrder(input: {
    orderId: string;
    description: string;
    amountFen: number;
    notifyUrl: string;
    channel?: PayChannel;
    openid?: string;
    /** H5 支付需要用户真实公网 IP（微信风控要求，不能是服务器/内网 IP） */
    payerClientIp?: string;
  }): Promise<{ codeUrl: string; gatewayTradeNo?: string; jsapiParams?: JsapiParams; h5Url?: string }>;
  /** 模拟模式专用：模拟用户扫码支付成功（真实网关无此方法） */
  markPaid?(orderId: string): Promise<void>;
  /** 发起退款（真实模式走网关 API；mock 模式直接成功） */
  refundOrder?(input: RefundInput): Promise<RefundResult>;
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
  params: { userId: string; planType: string; paymentMethod?: string; channel?: PayChannel; openid?: string; payerClientIp?: string }
): Promise<{ order: OrderRecord; codeUrl: string; amountFen: number; jsapiParams?: JsapiParams; h5Url?: string }> {
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

  // 调支付网关下单，拿扫码内容 / JSAPI 调起参数 / H5 跳转地址
  const { codeUrl, gatewayTradeNo, jsapiParams, h5Url } = await provider.createOrder({
    orderId,
    description: `壹页简历-${plan.name}`,
    amountFen,
    notifyUrl: buildNotifyUrl(plan.type),
    channel: params.channel,
    openid: params.openid,
    payerClientIp: params.payerClientIp,
  });

  if (gatewayTradeNo) order.gateway_trade_no = gatewayTradeNo;

  const { error } = await admin.from('orders').insert(order);
  if (error) throw new PaymentError('DB_INSERT_ORDER', `写入订单失败: ${error.message}`);

  return { order, codeUrl, amountFen, jsapiParams, h5Url };
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

  // 数据库 RPC 将订单锁、权益流水、用户权益和订单完成放进同一事务，
  // 从根上避免重复回调并发发放，以及权益成功后订单更新失败导致的重复发放。
  // 未执行迁移的旧环境暂时回退到下方兼容逻辑，便于平滑升级。
  const rpc = (admin as any).rpc;
  if (typeof rpc === 'function') {
    const { data, error } = await rpc.call(admin, 'complete_payment_order', {
      p_order_id: orderId,
      p_gateway_trade_no: opts.gatewayTradeNo || null,
    });
    if (!error && data) {
      return {
        order: data.order as OrderRecord,
        userUpdate: data.userUpdate as UserUpdateResult | null,
        alreadyCompleted: Boolean(data.alreadyCompleted),
      };
    }
    if (error && !/function .*complete_payment_order.* does not exist|Could not find the function/i.test(error.message || '')) {
      throw new PaymentError('DB_COMPLETE_PAYMENT', `原子完成订单失败: ${error.message}`);
    }
  }

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

  // 先发放用户权益，成功后再标记订单 completed。
  // 重要：此旧路径只能作为数据库 RPC 不可用时的兼容回退；RPC 负责真正的事务与幂等。
  const userUpdate = await applyPlanToUser(deps, order.user_id, order.plan_type, now);

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
  const { data: user, error: userFetchErr } = await admin
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (userFetchErr) {
    // 读取失败不能误判为用户不存在，否则 upsert 默认 free 行会覆盖会员权益。
    throw new PaymentError('DB_READ_USER', `读取用户失败: ${userFetchErr.message}`);
  }

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
    // 续费叠加：已有未过期会员则在原到期日上叠加时长；已是终身保持永久
    const isLifetime = !!row.member_until && row.member_until.startsWith('2099');
    if (isLifetime) {
      row.member_until = '2099-12-31T23:59:59Z';
    } else {
      const base =
        row.member_until && new Date(row.member_until) > now ? new Date(row.member_until) : now;
      row.member_until = calcMemberUntil(planType, base);
    }
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

// ---------------------------------------------------------------------------
// 退款（管理后台发起：金额自定义，首笔退款即收回该订单全部权益）
// 幂等键 refund_no；权益回收由 DB RPC commit_refund 在单事务内完成。
// ---------------------------------------------------------------------------
export function generateRefundNo(now: Date = new Date()): string {
  const ts = now.toISOString().replace(/[-:T]/g, '').slice(0, 14); // 14 位
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase(); // 6 位
  return `RF${ts}${rand}`; // 与订单号同风格，22 字符
}

/** 微信退款单状态 → 本地 refunds.status */
export function mapRefundStatus(gatewayStatus: string | undefined): 'success' | 'processing' | 'failed' | 'abnormal' {
  switch (gatewayStatus) {
    case 'SUCCESS': return 'success';
    case 'PROCESSING': return 'processing';
    case 'ABNORMAL': return 'abnormal';
    case 'CLOSED': return 'failed';
    default: return 'processing';
  }
}

export interface RefundOrderResult {
  order: OrderRecord;
  user: UserUpdateResult | null;
  refund: { refundNo: string; amount: number; status: string; alreadyRefunded: boolean };
}

/**
 * 管理后台退款编排：
 * 1. 校验订单可退（completed、累计未退满、金额合法）
 * 2. 调网关退款（受理即视为成功；失败落 failed 流水留痕）
 * 3. 调 commit_refund RPC 原子落库（流水 + 订单状态 + 首笔权益回收）
 */
export async function refundOrder(
  deps: PaymentDeps,
  orderId: string,
  params: { amount: number; reason?: string; operatorId?: string }
): Promise<RefundOrderResult> {
  const { admin, provider } = deps;
  const now = deps.now ? deps.now() : new Date();

  const order = await queryOrder(deps, orderId);
  if (!order) throw new PaymentError('ORDER_NOT_FOUND', `订单不存在: ${orderId}`);
  if (order.status !== 'completed') {
    throw new PaymentError('REFUND_NOT_ALLOWED', `仅已完成的订单可退款（当前状态: ${order.status}）`);
  }
  const refundedSoFar = Number(order.refund_amount || 0);
  const refundable = Number(order.amount) - refundedSoFar;
  if (refundable <= 0) throw new PaymentError('REFUND_NOT_ALLOWED', '该订单已全额退款');
  const amount = Math.round(Number(params.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new PaymentError('REFUND_INVALID_AMOUNT', '退款金额必须大于 0');
  }
  if (amount > refundable + 0.001) {
    throw new PaymentError('REFUND_EXCEEDS_ORDER', `退款金额超过可退余额 ${refundable.toFixed(2)} 元`);
  }

  const refundNo = generateRefundNo(now);
  const totalFen = toFen(Number(order.amount));
  const refundFen = toFen(amount);

  if (typeof provider.refundOrder !== 'function') {
    throw new PaymentError('REFUND_UNSUPPORTED', '当前支付模式不支持退款');
  }

  let gatewayResult: RefundResult;
  try {
    gatewayResult = await provider.refundOrder({
      outTradeNo: order.id,
      outRefundNo: refundNo,
      refundFen,
      totalFen,
      reason: params.reason,
      notifyUrl: buildRefundNotifyUrl(),
    });
  } catch (err) {
    // 网关受理失败：落 failed 流水留痕（不影响订单状态），再抛业务错误
    await admin.from('refunds').insert({
      order_id: order.id,
      refund_no: refundNo,
      amount,
      status: 'failed',
      reason: params.reason || null,
      operator_id: params.operatorId || null,
    }).then(({ error }) => {
      if (error) console.error('[refund] failed 流水写入失败:', error.message);
    });
    throw new PaymentError('REFUND_GATEWAY_ERROR', `退款网关请求失败: ${(err as Error).message}`);
  }

  // 网关状态映射（受理中 PROCESSING 也先落库回收权益；ABNORMAL/CLOSED 由回调/查单纠正）
  const localStatus = mapRefundStatus(gatewayResult.status);
  if (localStatus === 'failed' || localStatus === 'abnormal') {
    await admin.from('refunds').insert({
      order_id: order.id,
      refund_no: refundNo,
      amount,
      status: localStatus,
      reason: params.reason || null,
      wechat_refund_id: gatewayResult.wechatRefundId || null,
      operator_id: params.operatorId || null,
    }).then(({ error }) => {
      if (error) console.error('[refund] 异常态流水写入失败:', error.message);
    });
    throw new PaymentError('REFUND_GATEWAY_ERROR', `退款网关返回异常状态: ${gatewayResult.status}`);
  }

  // 原子落库：流水 + 订单退款状态 + 首笔权益回收
  const rpc = (admin as any).rpc;
  if (typeof rpc === 'function') {
    const { data, error } = await rpc.call(admin, 'commit_refund', {
      p_order_id: orderId,
      p_refund_no: refundNo,
      p_amount: amount,
      p_wechat_refund_id: gatewayResult.wechatRefundId || null,
      p_operator_id: params.operatorId || null,
      p_reason: params.reason || null,
    });
    if (!error && data) {
      return {
        order: data.order as OrderRecord,
        user: (data.user as UserUpdateResult) || null,
        refund: { refundNo, amount, status: localStatus, alreadyRefunded: Boolean(data.alreadyRefunded) },
      };
    }
    if (error && !/function .*commit_refund.* does not exist|Could not find the function/i.test(error.message || '')) {
      throw new PaymentError('DB_COMMIT_REFUND', `退款落库失败: ${error.message}`);
    }
    // RPC 不存在（迁移未执行）——拒绝退款而不是走非事务的兼容路径：
    // 权益回收一旦非原子，失败会造成「钱退了权益没收」或反向的资损，宁可失败重试。
    throw new PaymentError('MIGRATION_REQUIRED', '数据库尚未执行退款迁移（commit_refund），请先在 Supabase SQL Editor 执行 20260828_refund.sql');
  }
  throw new PaymentError('MIGRATION_REQUIRED', '数据库客户端不支持 RPC，无法安全退款');
}

/** 构建微信退款回调通知 URL */
export function buildRefundNotifyUrl(): string {
  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
  if (appUrl) return `${appUrl}/api/payment/notify/refund-wechat`;
  return 'https://your-domain.com/api/payment/notify/refund-wechat';
}
