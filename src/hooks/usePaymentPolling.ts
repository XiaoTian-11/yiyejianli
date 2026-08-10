import { useEffect, useRef, useState } from 'react';
import { queryOrder } from '../lib/paymentApi';

export type PaymentStatus = 'pending' | 'paid' | 'timeout';

/**
 * 轮询订单支付状态：
 * - completed → 'paid'
 * - expired / cancelled → 'timeout'
 * - 超过 timeoutMs（默认 5 分钟）→ 'timeout'
 */
export function usePaymentPolling(
  orderId: string | null,
  opts?: { intervalMs?: number; timeoutMs?: number }
): PaymentStatus {
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const intervalMs = opts?.intervalMs ?? 2000;
  const timeoutMs = opts?.timeoutMs ?? 5 * 60 * 1000;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    const startTime = Date.now();

    const stop = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    const poll = async () => {
      if (cancelled) return;
      if (Date.now() - startTime > timeoutMs) {
        stop();
        setStatus('timeout');
        return;
      }
      try {
        const data = await queryOrder(orderId);
        if (data.status === 'completed') {
          stop();
          setStatus('paid');
          return;
        }
        if (data.status === 'expired' || data.status === 'cancelled') {
          stop();
          setStatus('timeout');
          return;
        }
      } catch {
        // 网络抖动忽略，继续轮询
      }
    };

    poll();
    timerRef.current = setInterval(poll, intervalMs);

    return () => {
      cancelled = true;
      stop();
    };
  }, [orderId, intervalMs, timeoutMs]);

  return status;
}
