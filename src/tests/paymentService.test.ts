import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateOrderId,
  calculateExpiresAt,
  getPlan,
  calcMemberUntil,
  createOrder,
  completeOrder,
  queryOrder,
  PaymentError,
  PaymentDeps,
  OrderRecord,
} from '../../server/paymentService';

// ============================================================================
// 支付/订单核心业务逻辑单元测试
// - admin client（service_role）与 provider 全部依赖注入，便于 mock
// - 重点覆盖：金额防篡改、权益发放、幂等完成、状态流转
// ============================================================================

const NOW = '2026-06-02T12:00:00Z';
const toIso = (d: Date) => d.toISOString();

// ─── Mock admin client ──────────────────────────────────────────────────────
const mock = vi.hoisted(() => {
  const orderMaybeSingle = vi.fn();
  const userMaybeSingle = vi.fn();
  const updateEq = vi.fn();
  const insert = vi.fn();
  const upsert = vi.fn();
  const rpc = vi.fn();
  const from = vi.fn();

  from.mockImplementation((table: string) => {
    const chain: Record<string, any> = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.order = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    // orders / users 两个表走不同查询，用 table 名区分返回
    chain.maybeSingle = table === 'orders' ? orderMaybeSingle : userMaybeSingle;
    chain.update = vi.fn(() => ({ eq: updateEq }));
    chain.insert = insert;
    chain.upsert = upsert;
    return chain;
  });

  return { orderMaybeSingle, userMaybeSingle, updateEq, insert, upsert, rpc, from };
});

// ─── Mock provider ──────────────────────────────────────────────────────────
const provider = {
  name: 'test',
  createOrder: vi.fn(),
};

// 固定时钟，保证订单号/到期日可断言
const makeDeps = (): PaymentDeps => ({
  admin: { from: mock.from } as any,
  provider: provider as any,
  now: () => new Date(NOW),
});

// ─── 测试数据 helpers ───────────────────────────────────────────────────────
const pendingOrder = (planType: string): OrderRecord => ({
  id: 'YJL20260602120000ABC123',
  user_id: 'u1',
  plan_type: planType,
  amount: planType === 'single_export' ? 5.9 : 15,
  payment_method: 'wechat',
  status: 'pending',
  created_at: NOW,
  expires_at: toIso(new Date(new Date(NOW).getTime() + 30 * 60 * 1000)),
});

const freeUserRow = {
  id: 'u1',
  email: '',
  tier: 'free',
  member_until: null,
  remaining_pdf_exports: 0,
  remaining_png_exports: 0,
  remaining_ats_checks: 0,
};

describe('paymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mock.orderMaybeSingle.mockResolvedValue({ data: null, error: null });
    mock.userMaybeSingle.mockResolvedValue({ data: null, error: null });
    mock.updateEq.mockResolvedValue({ error: null });
    mock.insert.mockResolvedValue({ error: null });
    mock.upsert.mockResolvedValue({ error: null });
    provider.createOrder.mockResolvedValue({ codeUrl: 'weixin://wxpay/bizpayurl?pr=TEST123' });
  });

  // ── 纯函数 ────────────────────────────────────────────────────────────────
  describe('generateOrderId', () => {
    it('生成 23 位商户订单号（YJL + 14 位时间 + 6 位随机，≤32 满足微信约束）', () => {
      const id = generateOrderId(new Date(NOW));
      expect(id).toMatch(/^YJL20260602120000[A-Z0-9]{6}$/);
      expect(id.length).toBe(23);
      expect(id.length).toBeLessThanOrEqual(32);
    });
  });

  describe('calculateExpiresAt', () => {
    it('默认 30 分钟有效', () => {
      const expires = new Date(calculateExpiresAt(new Date(NOW))).getTime();
      const expected = new Date(NOW).getTime() + 30 * 60 * 1000;
      expect(expires).toBe(expected);
    });
  });

  describe('getPlan', () => {
    it('从服务端 PLANS 取方案（single_export 单价 5.9）', () => {
      const plan = getPlan('single_export');
      expect(plan).toBeDefined();
      expect(plan!.price).toBe(5.9);
    });

    it('非法方案返回 undefined', () => {
      expect(getPlan('nope')).toBeUndefined();
    });
  });

  describe('calcMemberUntil', () => {
    it('week → 7 天后', () => {
      const until = new Date(calcMemberUntil('week', new Date(NOW))!).getTime();
      expect(until).toBe(new Date(NOW).getTime() + 7 * 24 * 60 * 60 * 1000);
    });

    it('lifetime → 2099 年末', () => {
      expect(calcMemberUntil('lifetime')).toBe('2099-12-31T23:59:59Z');
    });

    it('非法方案返回 null', () => {
      expect(calcMemberUntil('nope')).toBeNull();
    });
  });

  // ── createOrder ───────────────────────────────────────────────────────────
  describe('createOrder', () => {
    it('金额以服务端方案价为准，写入 orders 表并返回扫码 URL', async () => {
      const res = await createOrder(makeDeps(), { userId: 'u1', planType: 'month' });

      expect(res.order.status).toBe('pending');
      expect(res.order.plan_type).toBe('month');
      expect(res.order.amount).toBe(15);
      expect(res.amountFen).toBe(1500);
      expect(res.order.payment_method).toBe('wechat');
      expect(res.codeUrl).toContain('weixin://');
      expect(provider.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: res.order.id, amountFen: 1500 })
      );
      expect(mock.insert).toHaveBeenCalledOnce();
    });

    it('单次导出订单金额为 5.9（590 分）', async () => {
      const res = await createOrder(makeDeps(), { userId: 'u1', planType: 'single_export' });
      expect(res.amountFen).toBe(590);
    });

    it('非法方案类型抛 INVALID_PLAN', async () => {
      await expect(createOrder(makeDeps(), { userId: 'u1', planType: 'nope' }))
        .rejects.toThrow('未知的方案类型');
    });

    it('缺 userId 抛 INVALID_USER', async () => {
      await expect(createOrder(makeDeps(), { userId: '', planType: 'month' }))
        .rejects.toThrow('缺少 userId');
    });

    it('数据库写入失败时抛 DB_INSERT_ORDER', async () => {
      mock.insert.mockResolvedValue({ error: new Error('insert denied') });
      await expect(createOrder(makeDeps(), { userId: 'u1', planType: 'month' }))
        .rejects.toBeInstanceOf(PaymentError);
    });
  });

  // ── completeOrder ─────────────────────────────────────────────────────────
  describe('completeOrder', () => {
    it('单次导出：订单变 completed，用户 +1 导出次数', async () => {
      mock.orderMaybeSingle.mockResolvedValue({ data: pendingOrder('single_export'), error: null });
      mock.userMaybeSingle.mockResolvedValue({ data: freeUserRow, error: null });

      const res = await completeOrder(makeDeps(), 'YJL20260602120000ABC123');

      expect(res.alreadyCompleted).toBe(false);
      expect(res.order.status).toBe('completed');
      expect(res.userUpdate).toEqual({ tier: 'free', member_until: null, remaining_pdf_exports: 1 });
      // 写回 users 表（upsert）
      expect(mock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'u1', remaining_pdf_exports: 1 }),
        expect.objectContaining({ onConflict: 'id' })
      );
    });

    it('订阅方案：升级为 member 并设置到期日 + 999 次导出', async () => {
      mock.orderMaybeSingle.mockResolvedValue({ data: pendingOrder('month'), error: null });
      mock.userMaybeSingle.mockResolvedValue({ data: freeUserRow, error: null });

      const res = await completeOrder(makeDeps(), 'YJL20260602120000ABC123');

      expect(res.userUpdate?.tier).toBe('member');
      expect(res.userUpdate?.remaining_pdf_exports).toBe(999);
      expect(res.userUpdate?.member_until).toBeDefined();
    });

    it('幂等：已完成的订单直接返回，不重复发放权益', async () => {
      mock.orderMaybeSingle.mockResolvedValue({
        data: { ...pendingOrder('single_export'), status: 'completed' },
        error: null,
      });

      const res = await completeOrder(makeDeps(), 'YJL20260602120000ABC123');

      expect(res.alreadyCompleted).toBe(true);
      expect(res.userUpdate).toBeNull();
      expect(mock.updateEq).not.toHaveBeenCalled();
      expect(mock.upsert).not.toHaveBeenCalled();
    });

    it('拒绝完成已过期订单', async () => {
      mock.orderMaybeSingle.mockResolvedValue({
        data: { ...pendingOrder('month'), status: 'expired' },
        error: null,
      });

      await expect(completeOrder(makeDeps(), 'YJL20260602120000ABC123'))
        .rejects.toThrow('已expired');
    });

    it('订单不存在抛 ORDER_NOT_FOUND', async () => {
      await expect(completeOrder(makeDeps(), 'NOPE')).rejects.toThrow('订单不存在');
    });

    it('续费叠加：会员未过期时在原到期日上加套餐时长', async () => {
      mock.orderMaybeSingle.mockResolvedValue({ data: pendingOrder('month'), error: null });
      mock.userMaybeSingle.mockResolvedValue({
        data: { ...freeUserRow, tier: 'member', member_until: '2026-07-02T12:00:00Z' },
        error: null,
      });

      const res = await completeOrder(makeDeps(), 'YJL20260602120000ABC123');

      // 原到期日 2026-07-02 + 1 个月 → 2026-08-02
      expect(res.userUpdate?.member_until).toBe('2026-08-02T12:00:00.000Z');
    });

    it('续费叠加：会员已过期则从今天起算', async () => {
      mock.orderMaybeSingle.mockResolvedValue({ data: pendingOrder('month'), error: null });
      mock.userMaybeSingle.mockResolvedValue({
        data: { ...freeUserRow, tier: 'member', member_until: '2026-05-01T12:00:00Z' },
        error: null,
      });

      const res = await completeOrder(makeDeps(), 'YJL20260602120000ABC123');

      // NOW = 2026-06-02，+1 个月 → 2026-07-02
      expect(res.userUpdate?.member_until).toBe('2026-07-02T12:00:00.000Z');
    });

    it('续费叠加：已是终身会员续费保持永久', async () => {
      mock.orderMaybeSingle.mockResolvedValue({ data: pendingOrder('month'), error: null });
      mock.userMaybeSingle.mockResolvedValue({
        data: { ...freeUserRow, tier: 'member', member_until: '2099-12-31T23:59:59Z' },
        error: null,
      });

      const res = await completeOrder(makeDeps(), 'YJL20260602120000ABC123');

      expect(res.userUpdate?.member_until).toBe('2099-12-31T23:59:59Z');
    });

    it('user 记录不存在时自动创建默认 free 记录再加权益', async () => {
      mock.orderMaybeSingle.mockResolvedValue({ data: pendingOrder('single_export'), error: null });
      // users 表无记录 → userMaybeSingle 返回 null
      mock.userMaybeSingle.mockResolvedValue({ data: null, error: null });

      const res = await completeOrder(makeDeps(), 'YJL20260602120000ABC123');

      expect(res.userUpdate?.remaining_pdf_exports).toBe(1);
      expect(mock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'u1', tier: 'free' }),
        expect.objectContaining({ onConflict: 'id' })
      );
    });

    it('读取用户失败时抛出 DB_READ_USER，不使用默认 free 记录覆盖权益', async () => {
      mock.orderMaybeSingle.mockResolvedValue({ data: pendingOrder('single_export'), error: null });
      mock.userMaybeSingle.mockResolvedValue({ data: null, error: { message: 'temporary users read failure' } });

      await expect(completeOrder(makeDeps(), 'YJL20260602120000ABC123'))
        .rejects.toThrow('读取用户失败');
      expect(mock.upsert).not.toHaveBeenCalled();
      expect(mock.updateEq).not.toHaveBeenCalled();
    });


    it('权益发放失败时订单保持未完成，不标记 completed（保证重试可补发）', async () => {
      mock.orderMaybeSingle.mockResolvedValue({ data: pendingOrder('single_export'), error: null });
      mock.userMaybeSingle.mockResolvedValue({ data: freeUserRow, error: null });
      // users 表 upsert 失败 → 权益未发放
      mock.upsert.mockResolvedValue({ error: { message: 'update users failed' } });

      await expect(completeOrder(makeDeps(), 'YJL20260602120000ABC123'))
        .rejects.toThrow('更新会员失败');

      // 关键：绝不能先把订单标记 completed，否则后续微信重试会被幂等跳过
      expect(mock.updateEq).not.toHaveBeenCalled();
    });
  });

  // ── queryOrder ────────────────────────────────────────────────────────────
  describe('queryOrder', () => {
    it('返回订单记录', async () => {
      mock.orderMaybeSingle.mockResolvedValue({ data: pendingOrder('month'), error: null });

      const order = await queryOrder(makeDeps(), 'YJL20260602120000ABC123');

      expect(order?.plan_type).toBe('month');
      expect(order?.status).toBe('pending');
    });

    it('订单不存在返回 null', async () => {
      const order = await queryOrder(makeDeps(), 'NOPE');
      expect(order).toBeNull();
    });
  });
});
