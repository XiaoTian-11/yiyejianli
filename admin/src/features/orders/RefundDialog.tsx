import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TriangleAlert } from 'lucide-react';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AdminOrderRow } from '@/types';
import { formatAmount, cn } from '@/lib/utils';

interface RefundDialogProps {
  order: AdminOrderRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface RefundResponse {
  order: AdminOrderRow;
  user: { tier: string; member_until: string | null; remaining_pdf_exports: number } | null;
  refund: { refundNo: string; amount: number; status: string; alreadyRefunded: boolean };
}

export function RefundDialog({ order, onClose, onSuccess }: RefundDialogProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const refundable = order ? Math.max(0, (order.amount || 0) - (Number(order.refund_amount) || 0)) : 0;

  useEffect(() => {
    if (order) {
      setAmount(String(refundable.toFixed(2)));
      setReason('');
    }
  }, [order, refundable]);

  const mutation = useMutation({
    mutationFn: (payload: { amount: number; reason?: string }) =>
      api.post<RefundResponse>(`/orders/${order!.id}/refund`, payload),
    onSuccess: (data) => {
      if (data.refund.alreadyRefunded) {
        toast.info('该退款单已处理过，未重复退款');
      } else {
        toast.success(`退款成功：${formatAmount(data.refund.amount)}${data.user ? '，已同步收回该订单权益' : ''}`);
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      onSuccess();
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || '退款失败');
    },
  });

  if (!order) return null;

  const amountNum = Number(amount);
  const invalid =
    !Number.isFinite(amountNum) ||
    amountNum <= 0 ||
    amountNum > refundable + 0.001 ||
    // 微信退款金额以分为单位，超过两位小数无法表示
    !/^\d+(\.\d{1,2})?$/.test(amount);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (invalid) {
      toast.error(`退款金额必须在 0.01 ~ ${refundable.toFixed(2)} 元之间（最多两位小数）`);
      return;
    }
    mutation.mutate({ amount: amountNum, reason: reason.trim() || undefined });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>订单退款</DialogTitle>
          <DialogDescription className="truncate font-mono">{order.id}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">用户</span>
              <span className="truncate pl-2">{order.user_email || order.user_id}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">方案</span>
              <span>{order.plan_name || order.plan_type}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">订单金额</span>
              <span className="font-medium">{formatAmount(order.amount)}</span>
            </div>
            {Number(order.refund_amount) > 0 && (
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">已退款</span>
                <span className="font-medium text-destructive">{formatAmount(order.refund_amount)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t pt-1.5">
              <span className="text-muted-foreground">可退余额</span>
              <span className="font-semibold">{formatAmount(refundable)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="refund-amount">退款金额（元）</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setAmount(refundable.toFixed(2))}
              >
                全额
              </Button>
            </div>
            <Input
              id="refund-amount"
              type="number"
              step="0.01"
              min={0.01}
              max={refundable}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`0.01 ~ ${refundable.toFixed(2)}`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="refund-reason">退款原因（可选，会提交给微信）</Label>
            <Input
              id="refund-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={80}
              placeholder="如：用户申请、重复支付"
            />
          </div>

          <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <TriangleAlert className="h-4 w-4 shrink-0 text-destructive" />
            <p className="text-xs leading-5 text-destructive">
              确认退款后将收回该订单发放的全部权益（会员时长 / 导出次数），其他订单权益不受影响。提交后立即生效。
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" variant="destructive" disabled={mutation.isPending || invalid} className={cn(mutation.isPending && 'opacity-80')}>
              {mutation.isPending ? '退款中...' : '确认退款'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
