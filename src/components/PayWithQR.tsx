import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import QRCode from 'qrcode';
import { Loader2, ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle, Crown, QrCode } from 'lucide-react';
import { createOrder, confirmMockPayment, type CreateOrderResult } from '../lib/paymentApi';
import { usePaymentPolling } from '../hooks/usePaymentPolling';
import { getPlanByType } from '../lib/pricing';
import { cn } from '../lib/utils';

interface PayWithQRProps {
  planType: string;
  userId?: string;
  /** 支付成功回调（订单已完成落库） */
  onSuccess: (orderId: string) => void;
  /** 返回上一步/重新选择 */
  onBack?: () => void;
  /** 紧凑模式（弹窗内） */
  compact?: boolean;
}

export const PayWithQR: React.FC<PayWithQRProps> = ({ planType, userId, onSuccess, onBack, compact }) => {
  const [order, setOrder] = useState<CreateOrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const plan = getPlanByType(planType as any);
  const status = usePaymentPolling(order?.orderId ?? null);

  // 创建订单
  useEffect(() => {
    let cancelled = false;
    setCreating(true);
    setError(null);
    createOrder({ userId, planType })
      .then((result) => {
        if (cancelled) return;
        setOrder(result);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setCreating(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planType, userId]);

  // 渲染二维码
  useEffect(() => {
    if (order?.codeUrl && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, order.codeUrl, {
        width: compact ? 168 : 220,
        margin: 1,
        errorCorrectionLevel: 'M',
      }).catch(() => {/* 二维码渲染失败时保留空白，不影响支付流程 */});
    }
  }, [order?.codeUrl, compact]);

  // 轮询到已支付 → 通知父级
  useEffect(() => {
    if (status === 'paid' && order) {
      onSuccess(order.orderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, order]);

  // 模拟支付确认（仅 mock provider）
  const handleMockPay = async () => {
    if (!order) return;
    setConfirming(true);
    try {
      const result = await confirmMockPayment(order.orderId);
      if (result?.ok) {
        onSuccess(order.orderId);
        return;
      }
      // 服务端可能因订单已过期等原因失败
      setError('支付确认失败，请刷新后重试');
    } catch (e: any) {
      setError(e.message || '支付确认失败');
    } finally {
      setConfirming(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-red-500 font-bold">{error}</p>
        <button
          onClick={() => { setError(null); setOrder(null); setCreating(true); }}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
        >
          重试
        </button>
        {onBack && (
          <button onClick={onBack} className="text-slate-400 hover:text-slate-700 text-[11px] font-bold flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> 返回
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center text-center', compact ? 'py-1' : 'py-4')}>
      {creating || !order ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <p className="text-slate-500 text-xs font-bold">正在创建支付订单...</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-slate-500 text-sm font-bold">{plan?.name || '订单'}</span>
            <span className="text-blue-600 font-extrabold">¥{order.amount}</span>
          </div>
          <p className="text-slate-400 text-[11px] mb-3 font-medium">
            微信扫码支付 · 订单号 {order.orderId}
          </p>

          {/* 二维码 */}
          <div className={cn('p-3 bg-slate-50 rounded-2xl border border-slate-100', compact ? 'mb-3' : 'mb-4')}>
            <div className={cn('bg-white rounded-xl border-2 border-slate-200/60 flex items-center justify-center relative', compact ? 'w-40 h-40' : 'w-52 h-52')}>
              <canvas ref={canvasRef} className="rounded-lg" />
              <div className="absolute inset-x-0 bottom-1.5 w-fit mx-auto bg-slate-900 border border-amber-300 text-amber-300 text-[8px] py-0.5 px-2 rounded-full flex items-center gap-0.5 shadow font-bold">
                <Crown className="w-2.5 h-2.5 fill-current" />
                <span>安全认证</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 mb-3 font-medium">
            请使用微信「扫一扫」完成支付
          </p>

          <div className="space-y-2 w-full max-w-xs mx-auto">
            {order.provider === 'mock' ? (
              <button
                onClick={handleMockPay}
                disabled={confirming}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
                {confirming ? '确认中...' : '模拟支付成功（演示）'}
              </button>
            ) : (
              <button
                disabled
                className="w-full py-2.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                等待支付结果...
              </button>
            )}
            {onBack && (
              <button onClick={onBack} className="w-full py-2 text-slate-500 hover:text-slate-800 text-[11px] font-bold transition-all flex items-center justify-center gap-1">
                <ArrowLeft className="w-3 h-3" /> 返回重新选择
              </button>
            )}
          </div>

          <p className="mt-3 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
            <ShieldCheck className="w-3 h-3" />
            {order.provider === 'mock' ? '模拟支付模式 · 数据会真实写入订单与会员系统' : '微信支付 APIv3 加密传输'}
          </p>

          {/* 成功提示动画（轮询到 paid 但父级尚未关闭时闪现） */}
          {status === 'paid' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-4 flex items-center gap-1.5 text-green-600 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" /> 支付成功！
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};
