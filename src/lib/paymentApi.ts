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
