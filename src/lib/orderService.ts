import { supabase } from './supabase';

/**
 * 前端订单数据服务：读取当前登录用户的历史订单。
 * 依赖 orders 表的 RLS（用户只可 SELECT 自己的订单），由服务端 service_role 写入。
 */

export interface ClientOrder {
  id: string;
  planType: string;
  amount: number;
  status: 'pending' | 'paid' | 'completed' | 'expired' | 'cancelled';
  createdAt: string;
  paidAt?: string;
  completedAt?: string;
}

export const ORDER_STATUS_TEXT: Record<ClientOrder['status'], string> = {
  pending: '待支付',
  paid: '已支付',
  completed: '已完成',
  expired: '已过期',
  cancelled: '已取消',
};

export async function getMyOrders(userId: string): Promise<ClientOrder[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // 表未创建/RLS 未配置时降级为空列表，不阻塞页面
      if (error.code === '42P01' || error.message.includes('does not exist')) return [];
      console.error('getMyOrders error:', error);
      return [];
    }

    return (data || []).map((r: any) => ({
      id: r.id,
      planType: r.plan_type,
      amount: Number(r.amount),
      status: r.status,
      createdAt: r.created_at,
      paidAt: r.paid_at,
      completedAt: r.completed_at,
    }));
  } catch (err) {
    console.error('getMyOrders failed:', err);
    return [];
  }
}
