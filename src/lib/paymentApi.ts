import { supabase } from './supabase';

/**
 * 前端支付 API 客户端：与 server.ts 的 /api/payment/* 路由对接。
 * 已登录时自动附带 Supabase JWT（Authorization: Bearer），服务端据此校验身份。
 */

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface CreateOrderResult {
  orderId: string;
  amount: number;
  amountFen: number;
  codeUrl: string;
  jsapiParams?: {
    appId: string;
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: string;
    paySign: string;
  } | null;
  expiresAt: string;
  provider: string;
}

export interface OrderStatusResult {
  orderId: string;
  status: string;
  planType?: string;
  amount?: number;
  createdAt?: string;
  expiresAt?: string;
}

/** 创建支付订单 */
export async function createOrder(params: {
  userId?: string;
  planType: string;
  paymentMethod?: string;
  channel?: 'native' | 'jsapi';
  openid?: string;
}): Promise<CreateOrderResult> {
  const res = await fetch('/api/payment/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || '创建订单失败，请稍后重试');
  }
  return data as CreateOrderResult;
}

/** 查询订单状态（轮询用） */
export async function queryOrder(orderId: string): Promise<OrderStatusResult> {
  const res = await fetch(`/api/payment/query/${orderId}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || '查询订单失败');
  }
  return data as OrderStatusResult;
}

/** 获取公众号网页授权跳转地址（微信内 JSAPI 支付前取 openid）
 *  planType：支付意图授权，编码进 state 随授权往返，回跳后自动继续支付
 *  back：通用预授权，回跳原路径仅带回 openid（不触发自动支付），用于进站提前拿 openid
 *  （微信 WebView 会清空 sessionStorage，意图都经 state 携带，不能依赖 sessionStorage） */
export async function getOauthUrl(planType?: string, back?: string): Promise<string> {
  const params = new URLSearchParams();
  if (planType) params.set('planType', planType);
  if (back) params.set('back', back);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/payment/wechat/oauth-url${qs}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.url) {
    throw new Error(data?.error?.message || '获取微信授权地址失败');
  }
  return data.url as string;
}

// ─── openid 缓存（同一微信用户 + 站内账号复用，避免重复授权跳转）─────────────
export const WECHAT_OPENID_CACHE_KEY = 'yjl_wechat_openid_cache';

/** 读取缓存的 openid；uid 不同（换账号）视为无效返回 null */
export function getCachedOpenid(uid?: string): string | null {
  try {
    const raw = localStorage.getItem(WECHAT_OPENID_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.openid) return null;
    if (uid && data.uid && data.uid !== uid) return null;
    return data.openid as string;
  } catch {
    return null;
  }
}

/** 缓存 openid（授权回跳拿到后存，供下次直接调起/进站预授权后使用） */
export function saveOpenidCache(openid: string, uid?: string) {
  try {
    localStorage.setItem(
      WECHAT_OPENID_CACHE_KEY,
      JSON.stringify({ openid, uid: uid || null, savedAt: Date.now() })
    );
  } catch {
    /* localStorage 不可用时忽略，不影响支付 */
  }
}

/** 模拟支付确认（仅 mock 模式可用；真实模式下服务端会拒绝） */
export async function confirmMockPayment(orderId: string): Promise<any> {
  const res = await fetch('/api/payment/notify/mock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || '支付确认失败');
  }
  return data;
}
