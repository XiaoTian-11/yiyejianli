import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { getAdminClient } from './supabaseAdmin';

// ============================================================================
// Admin 鉴权中间件
// 管理员判定（双通道，任一命中即管理员）：
//   1) 环境变量 ADMIN_EMAILS：逗号分隔的管理员邮箱白名单（零迁移即可启用）
//   2) users 表的 is_admin 字段 = true（为后续运营在后台提权预留）
// ============================================================================

export interface AdminAuthUser {
  id: string;
  email: string | null;
  isAdmin: boolean;
}

// 匿名客户端仅用于解析用户 JWT（getUser 走 /auth/v1/user），不触库
let anonClient: ReturnType<typeof createClient> | null = null;
function getAnonClient() {
  if (anonClient) return anonClient;
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  anonClient = createClient(url, key, {
    auth: { persistSession: false },
    // Node <22 无原生 WebSocket（服务器 Node 20），注入 ws 避免 RealtimeClient 抛错
    realtime: { transport: WebSocket as any },
  });
  return anonClient;
}

/** 是否命中 ADMIN_EMAILS 白名单 */
function isWhitelistedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/** 综合判断是否为管理员 */
export async function isAdminUser(
  userId: string,
  email: string | null | undefined
): Promise<boolean> {
  if (isWhitelistedEmail(email)) return true;
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle();
  // 表不存在 / 字段不存在 / 无记录 → 视为非管理员
  if (error || !data) return false;
  return data.is_admin === true;
}

/**
 * requireAdmin 中间件：
 * 解析 Authorization Bearer JWT → 校验管理员身份 → 注入 req.adminUser
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const authz = req.headers.authorization || '';
    if (!authz.startsWith('Bearer ')) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: '缺少登录凭证' } });
    }
    const token = authz.slice(7).trim();
    if (!token) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: '缺少登录凭证' } });
    }

    const client = getAnonClient();
    if (!client) {
      return res
        .status(500)
        .json({ error: { code: 'INTERNAL', message: '服务端缺少 Supabase 配置（VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY）' } });
    }

    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: '登录已过期，请重新登录' } });
    }

    const { id, email } = data.user;
    const isAdmin = await isAdminUser(id, email);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: { code: 'FORBIDDEN', message: `账号 ${email || id} 无管理权限` } });
    }

    (req as Request & { adminUser: AdminAuthUser }).adminUser = { id, email, isAdmin };
    next();
  } catch (err: any) {
    console.error('[admin] requireAdmin error:', err);
    return res
      .status(500)
      .json({ error: { code: 'INTERNAL', message: err?.message || '服务端校验失败' } });
  }
}
