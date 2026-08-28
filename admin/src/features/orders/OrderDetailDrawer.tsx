import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatAmount, formatDateTime } from '@/lib/utils';
import type { AdminOrderRow, OrderStatus, RefundRecord, RefundStatus } from '@/types';
import {
  ORDER_STATUS_TEXT,
  ORDER_STATUS_BADGE,
  ORDER_REFUND_STATUS_TEXT,
  ORDER_REFUND_STATUS_BADGE,
  PAYMENT_METHOD_TEXT,
  PLAN_TYPE_TEXT,
  REFUND_RECORD_STATUS_TEXT,
  REFUND_RECORD_STATUS_BADGE,
} from '@/types';

interface OrderDetailDrawerProps {
  order: AdminOrderRow | null;
  onClose: () => void;
}

function Field({ label, value, mono }: { label: string; value: string | number | null; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium break-all ${mono ? 'font-mono' : ''}`}>{value ?? '-'}</p>
    </div>
  );
}

export function OrderDetailDrawer({ order, onClose }: OrderDetailDrawerProps) {
  // 退款流水（订单打开时拉取；未执行迁移的旧库返回空列表）
  const refundsQuery = useQuery({
    queryKey: ['admin', 'orders', order?.id, 'refunds'],
    queryFn: () => api.get<{ items: RefundRecord[] }>(`/orders/${order!.id}/refunds`),
    enabled: !!order,
  });

  const syncMutation = useMutation({
    mutationFn: (refundNo: string) =>
      api.post<{ synced: boolean; gatewayStatus?: string }>(`/orders/${order!.id}/refunds/${refundNo}/sync`, {}),
    onSuccess: (data) => {
      toast.success(data.gatewayStatus ? `网关状态：${data.gatewayStatus}，已同步` : '已同步');
      refundsQuery.refetch();
    },
    onError: (err: Error) => toast.error(err.message || '同步失败'),
  });

  if (!order) return null;

  const hasRefunded = Number(order.refund_amount) > 0;

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            订单详情
            <Badge variant={ORDER_STATUS_BADGE[order.status as OrderStatus]}>
              {ORDER_STATUS_TEXT[order.status as OrderStatus] || order.status}
            </Badge>
            {order.refund_status && (
              <Badge variant={ORDER_REFUND_STATUS_BADGE[order.refund_status as RefundStatus]}>
                {ORDER_REFUND_STATUS_TEXT[order.refund_status as RefundStatus]}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 text-sm font-semibold">订单信息</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Field label="订单号" value={order.id} mono />
              <Field label="方案" value={order.plan_name || PLAN_TYPE_TEXT[order.plan_type] || order.plan_type} />
              <Field label="金额" value={formatAmount(order.amount)} />
              {hasRefunded && (
                <>
                  <Field label="已退款" value={formatAmount(order.refund_amount)} />
                  <Field label="退款时间" value={formatDateTime(order.refunded_at)} />
                </>
              )}
              <Field label="支付方式" value={PAYMENT_METHOD_TEXT[order.payment_method] || order.payment_method || '-'} />
              <Field label="网关交易号" value={order.gateway_trade_no} mono />
              <Field label="创建时间" value={formatDateTime(order.created_at)} />
              <Field label="支付时间" value={formatDateTime(order.paid_at)} />
              <Field label="完成时间" value={formatDateTime(order.completed_at)} />
              <Field label="过期时间" value={formatDateTime(order.expires_at)} />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="mb-3 text-sm font-semibold">用户信息</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Field label="用户 ID" value={order.user_id} mono />
              <Field label="用户邮箱" value={order.user_email} />
            </div>
          </div>

          {refundsQuery.data && refundsQuery.data.items.length > 0 && (
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-semibold">退款流水</h3>
              <div className="space-y-2">
                {refundsQuery.data.items.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border bg-muted/20 px-3 py-2 text-xs">
                    <Badge variant={REFUND_RECORD_STATUS_BADGE[r.status]}>
                      {REFUND_RECORD_STATUS_TEXT[r.status] || r.status}
                    </Badge>
                    <span className="font-mono">{r.refund_no}</span>
                    <span className="font-medium text-destructive">-{formatAmount(r.amount)}</span>
                    {r.reason && <span className="text-muted-foreground">{r.reason}</span>}
                    <span className="ml-auto text-muted-foreground">{formatDateTime(r.created_at)}</span>
                    {r.operator_email && <span className="text-muted-foreground">操作：{r.operator_email}</span>}
                    {r.status === 'processing' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 px-2 text-xs"
                        disabled={syncMutation.isPending}
                        onClick={() => syncMutation.mutate(r.refund_no)}
                      >
                        <RefreshCw className="h-3 w-3" /> 同步状态
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
