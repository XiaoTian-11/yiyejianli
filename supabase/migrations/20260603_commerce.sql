-- ============================================================================
-- 壹页简历 — 商业化数据迁移
-- users 表（会员体系）+ orders 表（订单体系）
-- 执行方式：Supabase Dashboard → SQL Editor → 粘贴执行（幂等，可重复执行）
-- 或：supabase db push / supabase migration up
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. users 表：会员/配额持久化
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('guest', 'free', 'member')),
  member_until TIMESTAMPTZ,
  remaining_pdf_exports INTEGER NOT NULL DEFAULT 0,
  remaining_png_exports INTEGER NOT NULL DEFAULT 0,
  remaining_ats_checks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_tier ON public.users(tier);

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 新用户注册时自动创建默认 free 记录
-- 注意：必须用 SECURITY DEFINER + 限定 search_path。
-- 否则触发器由 auth 流程以 SECURITY INVOKER 调用，会被 users 表 RLS 拦截，
-- 导致注册事务回滚，报 "Database error saving new user"。
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS：用户只可读自己的数据
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Only server can update users" ON public.users;
CREATE POLICY "Only server can update users"
  ON public.users FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 2. orders 表：订单体系
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,                                  -- 商户订单号（如 YJL20260602XXXX）
  user_id UUID NOT NULL REFERENCES auth.users(id),
  plan_type TEXT NOT NULL,                              -- single_export | week | month | ...
  amount NUMERIC(10, 2) NOT NULL,                       -- 单位：元
  payment_method TEXT NOT NULL CHECK (payment_method IN ('wechat', 'alipay')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'completed', 'expired', 'cancelled')),
  gateway_trade_no TEXT,                                -- 微信支付交易号 transaction_id
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 用户只可读自己的订单（服务端用 service_role 绕过 RLS 写入）
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
CREATE POLICY "Users can read own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);
