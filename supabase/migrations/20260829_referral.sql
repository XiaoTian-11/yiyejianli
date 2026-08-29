-- ============================================================================
-- 壹页简历 — 邀请奖励功能迁移
-- 幂等，可重复执行。包含：invite_code 字段、referrals 表、app_config 表、
-- grant_referral_reward / consume_quota / get_app_config / set_app_config /
-- revoke_referral_bonus / get_my_referral_stats 六个 RPC，以及 users 表 RLS 收紧。
-- ============================================================================

-- ── 1. users.invite_code 字段 ─────────────────────────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS invite_code TEXT;

-- 已存在但重复的 invite_code 先清理（保险），再建唯一索引
DELETE FROM public.users a
USING public.users b
WHERE a.id > b.id AND a.invite_code IS NOT NULL AND a.invite_code = b.invite_code;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_invite_code ON public.users(invite_code)
  WHERE invite_code IS NOT NULL;

-- 生成 6 位邀请码（排除易混淆字符 0/O/1/I/L），唯一性循环校验
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code TEXT;
  v_chars CONSTANT TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- 无 0/O/1/I/L
  v_i INTEGER;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := '';
    FOR v_i IN 1..6 LOOP
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM public.users WHERE invite_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

-- 注册时自动生成邀请码（handle_new_user 扩展）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, invite_code)
  VALUES (NEW.id, NEW.email, public.generate_invite_code())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 2. referrals 表 ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id              BIGSERIAL PRIMARY KEY,
  inviter_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  invite_code     TEXT NOT NULL,
  device_id       TEXT,
  inviter_bonus   INTEGER NOT NULL DEFAULT 0 CHECK (inviter_bonus IN (0, 1)),
  device_suspect  BOOLEAN NOT NULL DEFAULT false,
  status          TEXT NOT NULL DEFAULT 'granted' CHECK (status IN ('granted', 'revoked')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON public.referrals(inviter_id);
CREATE INDEX IF NOT EXISTS idx_referrals_invitee ON public.referrals(invitee_id);

-- ── 3. app_config 表（活动总开关）────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_config (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES auth.users(id)
);
INSERT INTO public.app_config (key, value)
VALUES ('referral_activity', '{"enabled": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ── 4. 活动开关 RPC ───────────────────────────────────────────────────────

-- 读配置（仅暴露白名单 key 的布尔字段，供匿名/已认证前端获取活动开关）
CREATE OR REPLACE FUNCTION public.get_app_config()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  SELECT (value->>'enabled')::boolean INTO v_enabled
  FROM public.app_config WHERE key = 'referral_activity';
  RETURN jsonb_build_object('referral_enabled', COALESCE(v_enabled, false));
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_app_config() TO anon, authenticated;

-- 写配置（仅管理员：校验调用者是 users.is_admin）
CREATE OR REPLACE FUNCTION public.set_app_config(p_enabled BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;
  SELECT is_admin INTO v_is_admin FROM public.users WHERE id = auth.uid();
  IF v_is_admin IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  INSERT INTO public.app_config (key, value, updated_at, updated_by)
  VALUES ('referral_activity', jsonb_build_object('enabled', p_enabled), NOW(), auth.uid())
  ON CONFLICT (key) DO UPDATE SET
    value = jsonb_build_object('enabled', p_enabled),
    updated_at = NOW(),
    updated_by = auth.uid();
  RETURN jsonb_build_object('referral_enabled', p_enabled);
END;
$$;
REVOKE ALL ON FUNCTION public.set_app_config(BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_app_config(BOOLEAN) TO authenticated;

-- ── 5. 奖励发放 RPC（原子、幂等）─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.grant_referral_reward(
  p_invite_code TEXT,
  p_device_id TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_inviter   public.users%ROWTYPE;
  v_invitee   public.users%ROWTYPE;
  v_enabled   BOOLEAN;
  v_bonus_cnt INTEGER;
  v_suspect   BOOLEAN := false;
BEGIN
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;

  -- 第 0 步：活动开关
  SELECT (value->>'enabled')::boolean INTO v_enabled
  FROM public.app_config WHERE key = 'referral_activity';
  IF v_enabled IS DISTINCT FROM true THEN
    RETURN jsonb_build_object('rewarded', false, 'reason', 'activity_closed');
  END IF;

  -- 幂等：已被邀请过
  IF EXISTS(SELECT 1 FROM public.referrals WHERE invitee_id = v_caller_id) THEN
    RETURN jsonb_build_object('rewarded', true, 'already', true);
  END IF;

  -- 邀请码有效性 + 禁止自邀
  IF p_invite_code IS NULL OR p_invite_code = '' THEN
    RETURN jsonb_build_object('rewarded', false, 'reason', 'invalid_code');
  END IF;
  SELECT * INTO v_inviter FROM public.users WHERE invite_code = p_invite_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('rewarded', false, 'reason', 'invalid_code');
  END IF;
  IF v_inviter.id = v_caller_id THEN
    RETURN jsonb_build_object('rewarded', false, 'reason', 'self_invite');
  END IF;

  -- 设备指纹：同设备再次绑定 → 邀请人奖励不发，标记 device_suspect
  IF p_device_id IS NOT NULL AND EXISTS(
    SELECT 1 FROM public.referrals WHERE device_id = p_device_id
  ) THEN
    v_suspect := true;
  END IF;

  -- 锁邀请人 + 统计已发次数
  SELECT * INTO v_inviter FROM public.users WHERE id = v_inviter.id FOR UPDATE;
  SELECT COALESCE(COUNT(*), 0) INTO v_bonus_cnt
  FROM public.referrals WHERE inviter_id = v_inviter.id AND inviter_bonus = 1 AND status = 'granted';

  -- 新用户自己 +1（R1/R5）
  SELECT * INTO v_invitee FROM public.users WHERE id = v_caller_id FOR UPDATE;
  v_invitee.remaining_pdf_exports := COALESCE(v_invitee.remaining_pdf_exports, 0) + 1;
  UPDATE public.users SET remaining_pdf_exports = v_invitee.remaining_pdf_exports, updated_at = NOW()
  WHERE id = v_invitee.id;

  -- 邀请人 +1（受 2 次上限约束 R3/R4，且设备可疑时不发）
  IF NOT v_suspect AND v_bonus_cnt < 2 THEN
    v_inviter.remaining_pdf_exports := COALESCE(v_inviter.remaining_pdf_exports, 0) + 1;
    UPDATE public.users SET remaining_pdf_exports = v_inviter.remaining_pdf_exports, updated_at = NOW()
    WHERE id = v_inviter.id;
  END IF;

  -- 写流水（inviter_bonus 记录邀请人本次是否得奖）
  INSERT INTO public.referrals (inviter_id, invitee_id, invite_code, device_id, inviter_bonus, device_suspect)
  VALUES (v_inviter.id, v_caller_id, p_invite_code, p_device_id,
          CASE WHEN v_suspect THEN 0 ELSE (CASE WHEN v_bonus_cnt < 2 THEN 1 ELSE 0 END) END,
          v_suspect);

  RETURN jsonb_build_object(
    'rewarded', true,
    'already', false,
    'inviteeQuota', 1,
    'inviterBonus', CASE WHEN v_suspect THEN 0 ELSE (CASE WHEN v_bonus_cnt < 2 THEN 1 ELSE 0 END) END,
    'inviterQuotaReached', (v_bonus_cnt >= 2)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.grant_referral_reward(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_referral_reward(TEXT, TEXT) TO authenticated;

-- ── 6. 我的邀请进度 RPC（个人中心展示）──────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_referral_stats()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_invited INTEGER;
  v_bonus INTEGER;
BEGIN
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  SELECT COUNT(*) INTO v_invited FROM public.referrals WHERE inviter_id = v_caller_id;
  SELECT COALESCE(COUNT(*), 0) INTO v_bonus
  FROM public.referrals WHERE inviter_id = v_caller_id AND inviter_bonus = 1 AND status = 'granted';
  RETURN jsonb_build_object('invited_count', v_invited, 'bonus_count', v_bonus);
END;
$$;
REVOKE ALL ON FUNCTION public.get_my_referral_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_referral_stats() TO authenticated;

-- ── 7. 扣配额 RPC（RLS 收紧后的唯一扣配额路径）─────────────────────────
CREATE OR REPLACE FUNCTION public.consume_quota(p_type TEXT DEFAULT 'pdf')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user public.users%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  SELECT * INTO v_user FROM public.users WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.users (id, email) VALUES (auth.uid(), '') RETURNING * INTO v_user;
  END IF;
  -- 会员无限导出不扣
  IF v_user.tier = 'member' THEN
    RETURN jsonb_build_object('success', true, 'remaining', v_user.remaining_pdf_exports, 'member', true);
  END IF;
  IF COALESCE(v_user.remaining_pdf_exports, 0) <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_quota');
  END IF;
  v_user.remaining_pdf_exports := v_user.remaining_pdf_exports - 1;
  UPDATE public.users SET remaining_pdf_exports = v_user.remaining_pdf_exports, updated_at = NOW()
  WHERE id = v_user.id;
  RETURN jsonb_build_object('success', true, 'remaining', v_user.remaining_pdf_exports, 'member', false);
END;
$$;
REVOKE ALL ON FUNCTION public.consume_quota(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_quota(TEXT) TO authenticated;

-- ── 8. 撤销邀请奖励 RPC（管理员，后台撤销用）────────────────────────────
CREATE OR REPLACE FUNCTION public.revoke_referral_bonus(p_referral_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_ref public.referrals%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  SELECT is_admin INTO v_is_admin FROM public.users WHERE id = auth.uid();
  IF v_is_admin IS DISTINCT FROM true THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT * INTO v_ref FROM public.referrals WHERE id = p_referral_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('revoked', false, 'reason', 'not_found');
  END IF;
  IF v_ref.status = 'revoked' THEN
    RETURN jsonb_build_object('revoked', true, 'already', true);
  END IF;

  -- 回滚邀请人奖励（若该条发放过）
  IF v_ref.inviter_bonus = 1 THEN
    UPDATE public.users SET remaining_pdf_exports = GREATEST(0, COALESCE(remaining_pdf_exports, 0) - 1),
      updated_at = NOW()
    WHERE id = v_ref.inviter_id;
  END IF;
  -- 回滚新用户奖励
  UPDATE public.users SET remaining_pdf_exports = GREATEST(0, COALESCE(remaining_pdf_exports, 0) - 1),
    updated_at = NOW()
  WHERE id = v_ref.invitee_id;

  UPDATE public.referrals SET status = 'revoked', revoked_at = NOW()
  WHERE id = p_referral_id;
  RETURN jsonb_build_object('revoked', true, 'already', false);
END;
$$;
REVOKE ALL ON FUNCTION public.revoke_referral_bonus(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_referral_bonus(BIGINT) TO authenticated;

-- ── 9. users 表 RLS 收紧（D10：删除允许用户自更新的策略）────────────────
DROP POLICY IF EXISTS "Only server can update users" ON public.users;
-- 保留用户只读自己数据（原 "Users can read own data" 策略保留）

NOTIFY pgrst, 'reload schema';
