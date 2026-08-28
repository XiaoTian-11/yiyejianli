import { Router, type Request, type Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdmin } from './adminAuth';
import { getAdminClient } from './supabaseAdmin';
import { refundOrder, mapRefundStatus, PaymentError } from './paymentService';
import { getPaymentProvider } from './paymentProvider';
import { queryWechatRefund } from './paymentWechat';

// ============================================================================
// Admin 管理接口（/api/admin/*）
// 全部经 requireAdmin 中间件校验管理员身份；数据访问使用 service_role client。
// ============================================================================

const router = Router();

// ── 通用工具 ───────────────────────────────────────────────────────────────

function parsePagination(q: Record<string, unknown>) {
  const page = Math.max(1, parseInt(String(q.page || '1'), 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(String(q.pageSize || '20'), 10) || 20));
  return { page, pageSize };
}

function handleError(res: Response, err: any, fallback = '服务器内部错误') {
  console.error('[admin] api error:', err);
  if (!res.headersSent) {
    return res.status(500).json({ error: { code: 'INTERNAL', message: err?.message || fallback } });
  }
}

function nowISO() {
  return new Date().toISOString();
}

/** 为多条记录批量补齐 user_email（不依赖外键） */
async function attachUserEmails(admin: SupabaseClient, rows: Array<{ user_id: string }>) {
  const ids = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)));
  if (!ids.length) return new Map<string, string>();
  const { data } = await admin.from('users').select('id,email').in('id', ids);
  const map = new Map<string, string>();
  (data || []).forEach((u) => {
    if (u.email) map.set(u.id, u.email);
  });
  return map;
}

/** 近 N 天起始时间 */
function daysAgoISO(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

// ── 鉴权探测 ───────────────────────────────────────────────────────────────

router.get('/me', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as Request & { adminUser?: unknown }).adminUser;
  res.json(adminUser);
});

// ── 统计 ───────────────────────────────────────────────────────────────────

router.get('/stats/overview', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = getAdminClient();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const [{ count: totalUsers }, { count: totalOrders }, { count: completedOrders }, { count: memberUsers }, { count: totalResumes }] =
      await Promise.all([
        admin.from('users').select('id', { count: 'exact', head: true }),
        admin.from('orders').select('id', { count: 'exact', head: true }),
        admin.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
        admin.from('users').select('id', { count: 'exact', head: true }).eq('tier', 'member'),
        admin.from('resumes').select('id', { count: 'exact', head: true }),
      ]);

    // GMV：成交订单金额合计 − 退款（净收入口径）
    const { data: completedOrdersData } = await admin
      .from('orders')
      .select('amount, refund_amount')
      .eq('status', 'completed');
    const gmv = (completedOrdersData || []).reduce(
      (s, o) => s + (Number(o.amount) || 0) - (Number(o.refund_amount) || 0),
      0
    );

    // 今日新增用户（created_at 列可能不存在，容错为 0）
    let newUsersToday = 0;
    let paidOrdersToday = 0;
    try {
      const { count: nu } = await admin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayISO);
      newUsersToday = nu || 0;
    } catch {
      newUsersToday = 0;
    }
    try {
      const { count: po } = await admin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('paid_at', todayISO);
      paidOrdersToday = po || 0;
    } catch {
      paidOrdersToday = 0;
    }

    const total = totalUsers || 0;
    const completed = completedOrders || 0;

    res.json({
      totalUsers: total,
      totalOrders: totalOrders || 0,
      completedOrders: completed,
      gmv: Math.round(gmv * 100) / 100,
      conversionRate: total > 0 ? Math.round((completed / total) * 10000) / 100 : 0,
      memberUsers: memberUsers || 0,
      totalResumes: totalResumes || 0,
      newUsersToday,
      paidOrdersToday,
    });
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/stats/orders-trend', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = getAdminClient();
    const days = req.query.days === '30' ? 30 : 7;
    const startISO = daysAgoISO(days);

    const { data, error } = await admin
      .from('orders')
      .select('amount, status, created_at')
      .gte('created_at', startISO);

    if (error) {
      return res
        .status(400)
        .json({ error: { code: 'DB_READ', message: `读取订单失败: ${error.message}` } });
    }

    // 按日期（UTC 日界）聚合
    const buckets = new Map<string, { orders: number; gmv: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      buckets.set(d.toISOString().slice(0, 10), { orders: 0, gmv: 0 });
    }
    (data || []).forEach((o) => {
      const key = (o.created_at || '').slice(0, 10);
      const bucket = buckets.get(key);
      if (!bucket) return;
      bucket.orders += 1;
      if (o.status === 'completed') bucket.gmv += Number(o.amount) || 0;
    });

    const points = Array.from(buckets.entries()).map(([date, v]) => ({
      date,
      orders: v.orders,
      gmv: Math.round(v.gmv * 100) / 100,
    }));
    res.json(points);
  } catch (err) {
    handleError(res, err);
  }
});

// ── 用户管理 ───────────────────────────────────────────────────────────────

router.get('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = getAdminClient();
    const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
    const search = String(req.query.search || '').trim();
    const tier = String(req.query.tier || 'all');

    const base = () => {
      let q = admin.from('users').select('*', { count: 'exact' });
      if (search) q = q.or(`email.ilike.*${search}*`);
      if (tier && tier !== 'all') q = q.eq('tier', tier);
      q = q.range((page - 1) * pageSize, page * pageSize - 1);
      return q;
    };

    // 优先按 created_at 倒序；若该列不存在（旧表），降级为无排序
    let result = await base().order('created_at', { ascending: false });
    if (result.error && /column .*created_at.* does not exist/.test(result.error.message || '')) {
      result = await base();
    }
    if (result.error) {
      return res
        .status(400)
        .json({ error: { code: 'DB_READ', message: `查询用户失败: ${result.error.message}` } });
    }

    res.json({ items: result.data || [], total: result.count || 0, page, pageSize });
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/users/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = getAdminClient();
    const id = req.params.id;

    // 三个查询互不依赖，一次并行发出（云 Supabase 每次往返 ~300-1100ms，
    // 串行会累加延迟，并行只受最慢的一个约束）
    const [userRes, ordersRes, resumesRes] = await Promise.all([
      admin.from('users').select('*').eq('id', id).maybeSingle(),
      admin.from('orders').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      admin.from('resumes').select('*').eq('user_id', id).order('updated_at', { ascending: false }),
    ]);

    const { data: user, error: userErr } = userRes;
    if (userErr) {
      return res.status(400).json({ error: { code: 'DB_READ', message: `查询用户失败: ${userErr.message}` } });
    }
    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '用户不存在' } });
    }
    if (ordersRes.error) {
      return res.status(400).json({ error: { code: 'DB_READ', message: `查询订单失败: ${ordersRes.error.message}` } });
    }
    if (resumesRes.error) {
      return res.status(400).json({ error: { code: 'DB_READ', message: `查询简历失败: ${resumesRes.error.message}` } });
    }

    // 订单/简历的 user_id 就是当前用户，直接复用已查到的 user.email，
    // 避免再发一次 users 表查询（attachUserEmails 对单用户详情是多余的）
    const orders = (ordersRes.data || []).map((o) => ({
      ...o,
      user_email: user.email || null,
      plan_name: planName(o.plan_type),
    }));

    const resumes = (resumesRes.data || []).map((r) => ({
      ...r,
      user_email: user.email || null,
    }));

    res.json({ ...user, orders, resumes });
  } catch (err) {
    handleError(res, err);
  }
});

router.patch('/users/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = getAdminClient();
    const id = req.params.id;
    const body = req.body || {};

    const allowed = [
      'tier',
      'member_until',
      'remaining_pdf_exports',
      'remaining_png_exports',
      'remaining_ats_checks',
      'status',
      'is_admin',
    ];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: '没有需要更新的字段' } });
    }

    // 校验
    if (updates.tier !== undefined && !['guest', 'free', 'member'].includes(String(updates.tier))) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'tier 取值非法' } });
    }
    for (const key of ['remaining_pdf_exports', 'remaining_png_exports', 'remaining_ats_checks']) {
      if (updates[key] !== undefined && (Number(updates[key]) < 0 || isNaN(Number(updates[key])))) {
        return res.status(400).json({ error: { code: 'VALIDATION', message: `${key} 必须为非负数字` } });
      }
      if (updates[key] !== undefined) updates[key] = Number(updates[key]);
    }
    if (updates.member_until === '') updates.member_until = null;
    if (updates.status !== undefined && !['active', 'disabled'].includes(String(updates.status))) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'status 取值非法' } });
    }
    if (updates.is_admin !== undefined) {
      const value = updates.is_admin;
      if (value === true || value === false) {
        updates.is_admin = value;
      } else if (value === 'true' || value === '1' || value === 1) {
        updates.is_admin = true;
      } else if (value === 'false' || value === '0' || value === 0) {
        updates.is_admin = false;
      } else {
        return res.status(400).json({ error: { code: 'VALIDATION', message: 'is_admin 必须为布尔值' } });
      }
    }

    let { data, error } = await admin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    // 兼容尚未执行 admin 字段迁移的旧 users 表：status 不影响会员/配额更新。
    if (error && /column .*status.* does not exist|Could not find the 'status' column/i.test(error.message || '')) {
      const { status: _status, ...legacyUpdates } = updates;
      if (Object.keys(legacyUpdates).length > 0) {
        ({ data, error } = await admin
          .from('users')
          .update(legacyUpdates)
          .eq('id', id)
          .select()
          .maybeSingle());
      } else {
        return res.status(409).json({
          error: { code: 'MIGRATION_REQUIRED', message: '数据库尚未添加用户状态字段，请先执行 admin 用户字段迁移' },
        });
      }
    }

    if (error) {
      return res.status(400).json({ error: { code: 'DB_UPDATE', message: `更新用户失败: ${error.message}` } });
    }
    if (!data) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '用户不存在' } });
    }
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// ── 用户密码重置 ─────────────────────────────────────────────────────────────

/**
 * 重置用户登录密码为 123456（Supabase Auth 哈希存储，管理员无法查看明文，
 * 仅可重置。使用 Auth Admin API 直接更新，即时生效）。
 */
router.post('/users/:id/reset-password', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = getAdminClient();
    const id = req.params.id;
    const { data, error } = await admin.auth.admin.updateUserById(id, { password: '123456' });
    if (error) {
      return res.status(400).json({ error: { code: 'AUTH_UPDATE', message: `重置密码失败: ${error.message}` } });
    }
    res.json({ success: true, email: data.user?.email ?? null });
  } catch (err) {
    handleError(res, err);
  }
});

// ── 订单管理 ───────────────────────────────────────────────────────────────

router.get('/orders', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = getAdminClient();
    const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || 'all');
    const planType = String(req.query.planType || 'all');

    let q = admin.from('orders').select('*', { count: 'exact' });
    if (search) q = q.or(`id.ilike.*${search}*`);
    if (status && status !== 'all') q = q.eq('status', status);
    if (planType && planType !== 'all') q = q.eq('plan_type', planType);
    q = q.order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await q;
    if (error) {
      return res.status(400).json({ error: { code: 'DB_READ', message: `查询订单失败: ${error.message}` } });
    }

    const emailMap = await attachUserEmails(admin, data || []);
    const items = (data || []).map((o) => ({
      ...o,
      user_email: emailMap.get(o.user_id) || null,
      plan_name: planName(o.plan_type),
    }));

    res.json({ items, total: count || 0, page, pageSize });
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/orders/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = getAdminClient();
    const { data: order, error } = await admin
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) {
      return res.status(400).json({ error: { code: 'DB_READ', message: `查询订单失败: ${error.message}` } });
    }
    if (!order) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '订单不存在' } });
    }
    const emailMap = await attachUserEmails(admin, [order]);
    res.json({ ...order, user_email: emailMap.get(order.user_id) || null, plan_name: planName(order.plan_type) });
  } catch (err) {
    handleError(res, err);
  }
});

// ── 订单退款（管理后台专用）────────────────────────────────────────────────

/** 统一把 PaymentError 转成 400 业务错误响应 */
function refundError(res: Response, err: unknown) {
  if (err instanceof PaymentError) {
    return res.status(400).json({ error: { code: err.code, message: err.message } });
  }
  console.error('[admin] refund error:', err);
  if (!res.headersSent) {
    return res.status(500).json({ error: { code: 'INTERNAL', message: (err as Error)?.message || '服务器内部错误' } });
  }
}

/** POST /orders/:id/refund — 发起退款 body: { amount, reason? } */
router.post('/orders/:id/refund', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = getAdminClient();
    const provider = getPaymentProvider();
    const amount = Number(req.body?.amount);
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 200) : undefined;
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: '退款金额必须大于 0' } });
    }
    const operatorId = (req as Request & { adminUser?: { id?: string } }).adminUser?.id;
    const result = await refundOrder({ admin, provider }, req.params.id, { amount, reason, operatorId });
    res.json(result);
  } catch (err) {
    refundError(res, err);
  }
});

/** GET /orders/:id/refunds — 订单退款流水列表 */
router.get('/orders/:id/refunds', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from('refunds')
      .select('*')
      .eq('order_id', req.params.id)
      .order('created_at', { ascending: false });
    if (error) {
      // 未执行退款迁移的旧库：refunds 表不存在，按空列表处理（前端不展示流水区）
      if (/does not exist|relation .*refunds.*|Could not find the table/i.test(error.message || '')) {
        return res.json({ items: [] });
      }
      return res.status(400).json({ error: { code: 'DB_READ', message: `查询退款流水失败: ${error.message}` } });
    }
    const emailMap = await attachUserEmails(admin, (data || []).map((r) => ({ user_id: r.operator_id })));
    const items = (data || []).map((r) => ({
      ...r,
      operator_email: emailMap.get(r.operator_id) || null,
    }));
    res.json({ items });
  } catch (err) {
    handleError(res, err);
  }
});

/** POST /orders/:id/refunds/:refundNo/sync — 主动查网关退款状态并更新本地（兜底回调丢失） */
router.post('/orders/:id/refunds/:refundNo/sync', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = getAdminClient();
    const refundNo = req.params.refundNo;
    if (getPaymentProvider().name !== 'wechat') {
      // mock 模式：本地退款即时成功，无需同步
      return res.json({ synced: false, message: 'mock 模式无需同步' });
    }
    const gateway = await queryWechatRefund(refundNo);
    const status = mapRefundStatus(gateway.status);
    const { data, error } = await admin
      .from('refunds')
      .update({ status, wechat_refund_id: (gateway as any).refund_id || null, updated_at: new Date().toISOString() })
      .eq('refund_no', refundNo)
      .select()
      .maybeSingle();
    if (error) {
      return res.status(400).json({ error: { code: 'DB_UPDATE', message: `更新退款状态失败: ${error.message}` } });
    }
    if (!data) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '退款单不存在' } });
    }
    res.json({ synced: true, refund: data, gatewayStatus: gateway.status });
  } catch (err) {
    refundError(res, err);
  }
});

// ── 简历管理（只读）────────────────────────────────────────────────────────

router.get('/resumes', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = getAdminClient();
    const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
    const search = String(req.query.search || '').trim();

    let pageData: Array<{ user_id: string }> = [];
    let total = 0;

    if (search) {
      // 按用户邮箱过滤简历：先查匹配邮箱的用户，再查这些用户的简历
      const { data: matchedUsers } = await admin
        .from('users')
        .select('id,email')
        .or(`email.ilike.*${search}*`);
      const matchedIds = (matchedUsers || []).map((u) => u.id);
      if (matchedIds.length > 0) {
        const { data, error, count } = await admin
          .from('resumes')
          .select('*', { count: 'exact' })
          .in('user_id', matchedIds)
          .order('updated_at', { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1);
        if (error) {
          return res.status(400).json({ error: { code: 'DB_READ', message: `查询简历失败: ${error.message}` } });
        }
        pageData = data || [];
        total = count || 0;
      }
    } else {
      const { data, error, count } = await admin
        .from('resumes')
        .select('*', { count: 'exact' })
        .order('updated_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);
      if (error) {
        return res.status(400).json({ error: { code: 'DB_READ', message: `查询简历失败: ${error.message}` } });
      }
      pageData = data || [];
      total = count || 0;
    }

    const emailMap = await attachUserEmails(admin, pageData);
    const items = pageData.map((r) => ({
      ...r,
      user_email: emailMap.get(r.user_id) || null,
    }));
    res.json({ items, total, page, pageSize });
  } catch (err) {
    handleError(res, err);
  }
});

// ── 辅助 ───────────────────────────────────────────────────────────────────

const PLAN_NAMES: Record<string, string> = {
  single_export: '单次导出',
  week: '周卡会员',
  month: '月卡会员',
  quarter: '季卡会员',
  year: '年卡会员',
  lifetime: '终身卡',
  student_year: '学生年卡',
};
function planName(type: string | null | undefined): string | null {
  if (!type) return null;
  return PLAN_NAMES[type] || null;
}

export { router as adminRouter };
