-- ============================================================================
-- 壹页简历 — 邀请奖励 UX 优化迁移（2）
-- 新增 ensure_my_invite_code：历史用户（迁移前注册，invite_code 为 NULL）
-- 登录后惰性生成邀请码。
-- 幂等，可重复执行。
-- ============================================================================

-- 惰性生成当前用户的邀请码（无则生成并回写；已有则直接返回）
CREATE OR REPLACE FUNCTION public.ensure_my_invite_code()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_code      TEXT;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT invite_code INTO v_code FROM public.users WHERE id = v_caller_id;
  IF v_code IS NULL OR v_code = '' THEN
    v_code := public.generate_invite_code();
    UPDATE public.users SET invite_code = v_code, updated_at = NOW()
    WHERE id = v_caller_id;
  END IF;

  RETURN jsonb_build_object('invite_code', v_code);
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_my_invite_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_my_invite_code() TO authenticated;

NOTIFY pgrst, 'reload schema';
