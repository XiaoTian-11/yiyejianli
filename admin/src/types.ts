// ============================================================================
// Admin 领域类型（与服务端 /api/admin/* 响应一致）
// ============================================================================

export type MembershipTier = 'guest' | 'free' | 'member';

export interface AdminUser {
  id: string;
  email: string | null;
  isAdmin: boolean;
}

export interface AdminUserRow {
  id: string;
  email: string | null;
  tier: MembershipTier;
  member_until: string | null;
  remaining_pdf_exports: number;
  remaining_png_exports: number;
  remaining_ats_checks: number;
  is_admin: boolean | null;
  status: string | null;
  created_at: string | null;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'completed'
  | 'expired'
  | 'cancelled';

export interface AdminOrderRow {
  id: string;
  user_id: string;
  user_email: string | null;
  plan_type: string;
  plan_name: string;
  amount: number;
  payment_method: string;
  status: OrderStatus;
  gateway_trade_no: string | null;
  created_at: string | null;
  paid_at: string | null;
  expires_at: string | null;
  completed_at: string | null;
}

export interface AdminResumeRow {
  id: string;
  user_id: string;
  user_email: string | null;
  name: string;
  score: number;
  status: string;
  template_id: string | null;
  updated_at: string | null;
}

export interface UserDetail extends AdminUserRow {
  orders: AdminOrderRow[];
  resumes: AdminResumeRow[];
}

export interface StatsOverview {
  totalUsers: number;
  totalOrders: number;
  completedOrders: number;
  gmv: number;
  conversionRate: number; // %
  memberUsers: number;
  totalResumes: number;
  newUsersToday: number;
  paidOrdersToday: number;
}

export interface TrendPoint {
  date: string;
  orders: number;
  gmv: number;
}

// ============================================================================
// 常量映射
// ============================================================================

export const TIER_TEXT: Record<MembershipTier, string> = {
  guest: '游客',
  free: '免费用户',
  member: '会员',
};

export const TIER_BADGE: Record<MembershipTier, 'muted' | 'info' | 'success'> = {
  guest: 'muted',
  free: 'info',
  member: 'success',
};

export const ORDER_STATUS_TEXT: Record<OrderStatus, string> = {
  pending: '待支付',
  paid: '已支付',
  completed: '已完成',
  expired: '已过期',
  cancelled: '已取消',
};

export const ORDER_STATUS_BADGE: Record<OrderStatus, 'warning' | 'info' | 'success' | 'muted' | 'destructive'> = {
  pending: 'warning',
  paid: 'info',
  completed: 'success',
  expired: 'muted',
  cancelled: 'destructive',
};

export const PAYMENT_METHOD_TEXT: Record<string, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
};

/** 方案类型 → 名称 */
export const PLAN_TYPE_TEXT: Record<string, string> = {
  single_export: '单次导出',
  week: '周卡会员',
  month: '月卡会员',
  quarter: '季卡会员',
  year: '年卡会员',
  lifetime: '终身卡',
  student_year: '学生年卡',
};

export const RESUME_STATUS_TEXT: Record<string, string> = {
  new: '新建',
  draft: '草稿',
  completed: '已完成',
};
