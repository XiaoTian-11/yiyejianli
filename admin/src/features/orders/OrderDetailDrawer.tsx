import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatAmount, formatDateTime } from '@/lib/utils';
import type { AdminOrderRow, OrderStatus } from '@/types';
import {
  ORDER_STATUS_TEXT,
  ORDER_STATUS_BADGE,
  PAYMENT_METHOD_TEXT,
  PLAN_TYPE_TEXT,
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
  if (!order) return null;

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            订单详情
            <Badge variant={ORDER_STATUS_BADGE[order.status as OrderStatus]}>
              {ORDER_STATUS_TEXT[order.status as OrderStatus] || order.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 text-sm font-semibold">订单信息</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Field label="订单号" value={order.id} mono />
              <Field label="方案" value={order.plan_name || PLAN_TYPE_TEXT[order.plan_type] || order.plan_type} />
              <Field label="金额" value={formatAmount(order.amount)} />
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
