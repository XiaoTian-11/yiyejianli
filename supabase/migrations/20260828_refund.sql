-- ============================================================================
-- Refund support: order refund columns + refunds ledger + atomic commit_refund
-- Idempotent: safe to run against existing installations.
-- 退款业务规则（与管理后台 UI 文案一致）：
--   * 仅 status='completed' 的订单可退
--   * 累计退款 ≤ 订单金额；管理员可分多次部分退，退满即 'full' 终态
--   * 首笔退款即收回该订单发放的全部权益（与退款比例无关），后续补退不再回收
--   * 会员时长按「该用户所有 completed 且未退款的订单」按 paid_at 升序重算，
--     与 complete_payment_order 的叠加规则一致 → 其他订单贡献精确保留
-- ============================================================================

-- orders 加退款列（不动 status CHECK 约束）
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_status TEXT
    CHECK (refund_status IS NULL OR refund_status IN ('partial', 'full')),
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_by UUID;

-- 退款流水表（仅 service_role 可读写）
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  refund_no TEXT NOT NULL UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'success', 'failed', 'abnormal')),
  reason TEXT,
  wechat_refund_id TEXT,
  operator_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON public.refunds(order_id);
-- RLS 未启用时 anon/authenticated 对新表默认无授权（Postgres 默认拒绝），
-- 再显式 REVOKE 兜底，确保只有 service_role（绕过 RLS）能访问。
REVOKE ALL ON public.refunds FROM anon, authenticated;

-- ============================================================================
-- 核心事务：提交退款（锁单 → 校验 → 首笔重算权益 → 流水 → 订单状态）
-- 幂等键：refund_no；供服务端在支付网关受理成功后调用。
-- 返回 { order, user?, alreadyRefunded? }
-- ============================================================================
CREATE OR REPLACE FUNCTION public.commit_refund(
  p_order_id TEXT,
  p_refund_no TEXT,
  p_amount NUMERIC,
  p_wechat_refund_id TEXT,
  p_operator_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_user public.users%ROWTYPE;
  v_orders_cur RECORD;
  v_base TIMESTAMPTZ;
  v_start TIMESTAMPTZ;
  v_has_valid BOOLEAN;
  v_is_first BOOLEAN;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'REFUND_ORDER_NOT_FOUND: 订单不存在: %', p_order_id; END IF;

  -- 幂等：同 refund_no 已处理过 → 返回当前状态，不重复扣
  IF EXISTS (SELECT 1 FROM public.refunds WHERE refund_no = p_refund_no) THEN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    RETURN jsonb_build_object('order', to_jsonb(v_order), 'alreadyRefunded', true);
  END IF;

  -- 校验：仅 completed 订单可退
  IF v_order.status <> 'completed' THEN
    RAISE EXCEPTION 'REFUND_NOT_ALLOWED: 仅已完成的订单可退款（当前状态: %）', v_order.status;
  END IF;

  -- 校验：金额必须为正且累计不超订单金额
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'REFUND_INVALID_AMOUNT: 退款金额必须大于 0';
  END IF;
  IF p_amount + COALESCE(v_order.refund_amount, 0) > v_order.amount THEN
    RAISE EXCEPTION 'REFUND_EXCEEDS_ORDER: 累计退款 % 超过订单金额 %',
      (COALESCE(v_order.refund_amount, 0) + p_amount), v_order.amount;
  END IF;

  v_is_first := (COALESCE(v_order.refund_amount, 0) = 0);

  -- ── 首笔退款：收回该订单发放的全部权益（按剩余未退订单重算，其他订单精确保留）──
  IF v_is_first THEN
    SELECT * INTO v_user FROM public.users WHERE id = v_order.user_id FOR UPDATE;
    IF NOT FOUND THEN
      INSERT INTO public.users (id, email) VALUES (v_order.user_id, '') ON CONFLICT (id) DO NOTHING;
      SELECT * INTO v_user FROM public.users WHERE id = v_order.user_id FOR UPDATE;
    END IF;

    IF v_order.plan_type = 'single_export' THEN
      -- 单次导出：扣 1 次导出（下限 0），不动 tier
      UPDATE public.users
      SET remaining_pdf_exports = GREATEST(COALESCE(remaining_pdf_exports, 0) - 1, 0),
          updated_at = NOW()
      WHERE id = v_user.id;
    ELSE
      -- 会员订单：从「其余 completed 且未退款」的订单重算 member_until
      -- （paid_at 升序叠加；某笔购买晚于当前累计到期日则从其购买时间起算——
      --   与 complete_payment_order 的续期规则在重放语义下等价）
      v_base := NULL;
      v_has_valid := FALSE;
      FOR v_orders_cur IN
        SELECT plan_type, COALESCE(paid_at, created_at) AS eff_paid_at
        FROM public.orders
        WHERE user_id = v_order.user_id
          AND status = 'completed'
          AND refund_status IS NULL
          AND id <> p_order_id
          AND plan_type <> 'single_export'
        ORDER BY COALESCE(paid_at, created_at) ASC
      LOOP
        v_has_valid := TRUE;
        IF v_orders_cur.plan_type = 'lifetime' THEN
          v_base := '2099-12-31T23:59:59Z'::TIMESTAMPTZ;
        ELSE
          v_start := CASE
            WHEN v_base IS NULL OR v_orders_cur.eff_paid_at > v_base THEN v_orders_cur.eff_paid_at
            ELSE v_base END;
          v_base := v_start + CASE v_orders_cur.plan_type
            WHEN 'week' THEN INTERVAL '7 days'
            WHEN 'month' THEN INTERVAL '1 month'
            WHEN 'quarter' THEN INTERVAL '3 months'
            WHEN 'year' THEN INTERVAL '1 year'
            WHEN 'student_year' THEN INTERVAL '1 year'
            ELSE NULL END;
          IF v_base IS NULL THEN
            RAISE EXCEPTION 'REFUND_INVALID_PLAN: 未知的方案类型: %', v_orders_cur.plan_type;
          END IF;
        END IF;
      END LOOP;

      IF v_has_valid THEN
        UPDATE public.users SET tier = 'member', member_until = v_base, updated_at = NOW()
        WHERE id = v_user.id;
      ELSE
        -- 无其他有效会员订单：失去会员身份（remaining_pdf_exports 残值不清零，
        -- 极边缘场景可由管理员在用户编辑中手动清零）
        UPDATE public.users SET tier = 'free', member_until = NULL, updated_at = NOW()
        WHERE id = v_user.id;
      END IF;
    END IF;

    SELECT * INTO v_user FROM public.users WHERE id = v_order.user_id;
  END IF;

  -- ── 插入退款流水（success 态——网关受理成功后才进入本函数）──
  INSERT INTO public.refunds (order_id, refund_no, amount, status, reason, wechat_refund_id, operator_id)
  VALUES (p_order_id, p_refund_no, p_amount, 'success', p_reason, p_wechat_refund_id, p_operator_id);

  -- ── 更新订单退款状态 ──
  UPDATE public.orders SET
    refund_amount = COALESCE(refund_amount, 0) + p_amount,
    refund_status = CASE WHEN COALESCE(refund_amount, 0) + p_amount >= amount THEN 'full' ELSE 'partial' END,
    refunded_at = COALESCE(refunded_at, NOW()),
    refunded_by = COALESCE(refunded_by, p_operator_id)
  WHERE id = p_order_id;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  RETURN jsonb_build_object(
    'order', to_jsonb(v_order),
    'user', CASE WHEN v_user.id IS NULL THEN NULL ELSE jsonb_build_object(
      'tier', v_user.tier,
      'member_until', v_user.member_until,
      'remaining_pdf_exports', v_user.remaining_pdf_exports
    ) END,
    'alreadyRefunded', false
  );
END;
$$;

-- 仅 service_role 可调用（服务端持 service_role key；anon/authenticated 禁止）
REVOKE ALL ON FUNCTION public.commit_refund(TEXT, TEXT, NUMERIC, TEXT, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.commit_refund(TEXT, TEXT, NUMERIC, TEXT, UUID, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.commit_refund(TEXT, TEXT, NUMERIC, TEXT, UUID, TEXT) TO service_role;

-- ── 安全加固：complete_payment_order 同样收敛为仅 service_role 可调用 ──
-- 此前仅 REVOKE PUBLIC，Supabase 默认权限仍显式授予 anon/authenticated，
-- 理论上可被直接调用免费激活订单；服务端全程持 service_role key，收紧无副作用。
REVOKE ALL ON FUNCTION public.complete_payment_order(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_payment_order(TEXT, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_payment_order(TEXT, TEXT) TO service_role;

NOTIFY pgrst, 'reload schema';
