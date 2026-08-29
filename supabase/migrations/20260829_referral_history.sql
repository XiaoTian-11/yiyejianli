-- ============================================================================
-- 壹页简历 — 邀请奖励 UX 优化迁移（3）
-- 新增 get_my_referral_history：个人中心「获得奖励记录」列表。
-- 幂等，可重复执行。
-- ============================================================================

-- 当前用户作为邀请人的邀请记录（含被邀请人邮箱/时间/奖励状态）
CREATE OR REPLACE FUNCTION public.get_my_referral_history()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_result JSONB;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'invitee_email', COALESCE(iu.email, ''),
      'invite_code', r.invite_code,
      'inviter_bonus', r.inviter_bonus,
      'device_suspect', r.device_suspect,
      'status', r.status,
      'created_at', r.created_at,
      'revoked_at', r.revoked_at
    ) ORDER BY r.created_at DESC
  )
  INTO v_result
  FROM public.referrals r
  LEFT JOIN public.users iu ON iu.id = r.invitee_id
  WHERE r.inviter_id = v_caller_id;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.get_my_referral_history() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_referral_history() TO authenticated;

NOTIFY pgrst, 'reload schema';
