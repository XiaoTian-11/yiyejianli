-- ============================================================================
-- 壹页简历 — 邀请奖励反作弊收紧迁移（4）
-- 变更 grant_referral_reward：触发作弊条件（同设备马甲 device_suspect）时，
-- 被邀请用户也不发放奖励（原逻辑仅邀请人不发，被邀请人仍 +1）。
-- 仍写入 referrals 流水（inviter_bonus=0 且标记 device_suspect=true）供后台核查。
-- 幂等，可重复执行。
-- ============================================================================

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
  v_invitee_bonus INTEGER;
  v_inviter_bonus INTEGER;
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

  -- 设备指纹：同设备再次绑定 → 判定为作弊，双方都不发奖励，仅记录流水标记 device_suspect
  IF p_device_id IS NOT NULL AND EXISTS(
    SELECT 1 FROM public.referrals WHERE device_id = p_device_id
  ) THEN
    v_suspect := true;
  END IF;

  -- 锁用户行
  SELECT * INTO v_inviter FROM public.users WHERE id = v_inviter.id FOR UPDATE;
  SELECT * INTO v_invitee FROM public.users WHERE id = v_caller_id FOR UPDATE;
  SELECT COALESCE(COUNT(*), 0) INTO v_bonus_cnt
  FROM public.referrals WHERE inviter_id = v_inviter.id AND inviter_bonus = 1 AND status = 'granted';

  -- 作弊判定：双方都不发（invitee_bonus / inviter_bonus 均为 0）
  IF v_suspect THEN
    v_invitee_bonus := 0;
    v_inviter_bonus := 0;
  ELSE
    -- 正常路径：被邀请人 +1；邀请人 +1（受 2 次上限约束）
    v_invitee_bonus := 1;
    IF v_bonus_cnt < 2 THEN
      v_inviter_bonus := 1;
    ELSE
      v_inviter_bonus := 0;
    END IF;
    -- 实际发放
    v_invitee.remaining_pdf_exports := COALESCE(v_invitee.remaining_pdf_exports, 0) + 1;
    UPDATE public.users SET remaining_pdf_exports = v_invitee.remaining_pdf_exports, updated_at = NOW()
    WHERE id = v_invitee.id;
    IF v_inviter_bonus = 1 THEN
      v_inviter.remaining_pdf_exports := COALESCE(v_inviter.remaining_pdf_exports, 0) + 1;
      UPDATE public.users SET remaining_pdf_exports = v_inviter.remaining_pdf_exports, updated_at = NOW()
      WHERE id = v_inviter.id;
    END IF;
  END IF;

  -- 写流水（作弊时 inviter_bonus=0、device_suspect=true，后台可见）
  INSERT INTO public.referrals (inviter_id, invitee_id, invite_code, device_id, inviter_bonus, device_suspect)
  VALUES (v_inviter.id, v_caller_id, p_invite_code, p_device_id, v_inviter_bonus, v_suspect);

  RETURN jsonb_build_object(
    'rewarded', true,
    'already', false,
    'suspect', v_suspect,
    'inviteeQuota', v_invitee_bonus,
    'inviterBonus', v_inviter_bonus,
    'inviterQuotaReached', (v_bonus_cnt >= 2)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.grant_referral_reward(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_referral_reward(TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
