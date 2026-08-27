-- ============================================================================
-- Admin user fields + atomic payment completion
-- Idempotent: safe to run against existing installations.
-- ============================================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_status_check'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'disabled'));
  END IF;
END $$;

-- 每个订单一条权益流水，order_id 唯一保证支付回调幂等。
CREATE TABLE IF NOT EXISTS public.payment_entitlements (
  order_id TEXT PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 原子完成支付：订单锁 + 用户锁 + 权益更新 + 订单完成在同一事务。
CREATE OR REPLACE FUNCTION public.complete_payment_order(
  p_order_id TEXT,
  p_gateway_trade_no TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_user public.users%ROWTYPE;
  v_until TIMESTAMPTZ;
  v_inserted_count INTEGER;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND: 订单不存在: %', p_order_id; END IF;
  IF v_order.status = 'completed' THEN
    RETURN jsonb_build_object('order', to_jsonb(v_order), 'userUpdate', NULL, 'alreadyCompleted', true);
  END IF;
  IF v_order.status IN ('expired', 'cancelled') THEN RAISE EXCEPTION 'ORDER_CLOSED: 订单已关闭，无法完成'; END IF;

  SELECT * INTO v_user FROM public.users WHERE id = v_order.user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.users (id, email) VALUES (v_order.user_id, '') RETURNING * INTO v_user;
  END IF;

  INSERT INTO public.payment_entitlements (order_id, user_id, plan_type)
  VALUES (v_order.id, v_order.user_id, v_order.plan_type)
  ON CONFLICT (order_id) DO NOTHING;
  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  -- 已存在流水只表示该订单已成功处理；正常路径每次函数事务只会插入一次。
  IF v_inserted_count > 0 THEN
    IF v_order.plan_type = 'single_export' THEN
      v_user.remaining_pdf_exports := COALESCE(v_user.remaining_pdf_exports, 0) + 1;
    ELSE
      v_user.tier := 'member';
      IF v_user.member_until IS NOT NULL AND v_user.member_until::TEXT LIKE '2099%' THEN
        v_user.member_until := '2099-12-31T23:59:59Z';
      ELSE
        v_until := CASE v_order.plan_type
          WHEN 'week' THEN NOW() + INTERVAL '7 days'
          WHEN 'month' THEN NOW() + INTERVAL '1 month'
          WHEN 'quarter' THEN NOW() + INTERVAL '3 months'
          WHEN 'year' THEN NOW() + INTERVAL '1 year'
          WHEN 'student_year' THEN NOW() + INTERVAL '1 year'
          WHEN 'lifetime' THEN '2099-12-31T23:59:59Z'::TIMESTAMPTZ
          ELSE NULL END;
        IF v_until IS NULL THEN RAISE EXCEPTION 'INVALID_PLAN: 未知的方案类型'; END IF;
        IF v_user.member_until IS NOT NULL AND v_user.member_until > NOW() AND v_order.plan_type <> 'lifetime' THEN
          v_until := v_user.member_until + CASE v_order.plan_type
            WHEN 'week' THEN INTERVAL '7 days' WHEN 'month' THEN INTERVAL '1 month'
            WHEN 'quarter' THEN INTERVAL '3 months' ELSE INTERVAL '1 year' END;
        END IF;
        v_user.member_until := v_until;
      END IF;
      v_user.remaining_pdf_exports := 999;
    END IF;
    UPDATE public.users SET tier=v_user.tier, member_until=v_user.member_until,
      remaining_pdf_exports=v_user.remaining_pdf_exports, remaining_png_exports=v_user.remaining_png_exports,
      remaining_ats_checks=v_user.remaining_ats_checks, updated_at=NOW() WHERE id=v_user.id;
  END IF;

  UPDATE public.orders SET status='completed', paid_at=NOW(), completed_at=NOW(),
    gateway_trade_no=COALESCE(p_gateway_trade_no, gateway_trade_no) WHERE id=v_order.id;
  SELECT * INTO v_order FROM public.orders WHERE id=v_order.id;
  RETURN jsonb_build_object('order',to_jsonb(v_order),'userUpdate',jsonb_build_object(
    'tier',v_user.tier,'member_until',v_user.member_until,'remaining_pdf_exports',v_user.remaining_pdf_exports),
    'alreadyCompleted',false);
END;
$$;

REVOKE ALL ON FUNCTION public.complete_payment_order(TEXT, TEXT) FROM PUBLIC;
NOTIFY pgrst, 'reload schema';
