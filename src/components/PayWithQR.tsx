import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import QRCode from 'qrcode';
import {
  Loader2, ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle, Crown,
  MessageCircle, Wallet, ChevronRight, XCircle,
} from 'lucide-react';
import { createOrder, confirmMockPayment, getOauthUrl, type CreateOrderResult } from '../lib/paymentApi';
import { usePaymentPolling } from '../hooks/usePaymentPolling';
import { getPlanByType } from '../lib/pricing';
import { cn } from '../lib/utils';

// ============================================================================
// 支付组件（v2：选方式 → 点支付 → 才创建订单）
//
// 流程：
//   1. 展示订单信息 + 支付方式（微信默认 / 支付宝未开通），不自动建单
//   2. 点「立即支付」才创建订单：
//      - 微信内（MicroMessenger）→ 公众号 OAuth 取 openid → JSAPI 直接调起
//      - 其他环境 → Native 扫码（展示二维码 + 轮询）
//   3. mock 模式 → 显示模拟支付按钮
// ============================================================================

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

const WECHAT_OAUTH_KEY = 'yjl_wechat_pay_intent';

/** 是否在微信内置浏览器内 */
const isWeChatBrowser = (): boolean => /MicroMessenger/i.test(navigator.userAgent);

/** 微信 JSAPI 调起（WeixinJSBridge） */
function invokeWechatPay(params: NonNullable<CreateOrderResult['jsapiParams']>): Promise<'ok' | 'cancel'> {
  return new Promise((resolve, reject) => {
    const doInvoke = () => {
      try {
        (window as any).WeixinJSBridge.invoke(
          'getBrandWCPayRequest',
          {
            appId: params.appId,
            timeStamp: params.timeStamp,
            nonceStr: params.nonceStr,
            package: params.package,
            signType: params.signType,
            paySign: params.paySign,
          },
          (res: any) => {
            const msg = res?.err_msg || '';
            if (msg === 'get_brand_wcpay_request:ok') resolve('ok');
            else if (msg === 'get_brand_wcpay_request:cancel') resolve('cancel');
            else reject(new Error(msg || '微信支付调起失败'));
          }
        );
      } catch (e: any) {
        reject(e);
      }
    };
    if ((window as any).WeixinJSBridge) {
      doInvoke();
    } else {
      document.addEventListener('WeixinJSBridgeReady', doInvoke, { once: true });
      // 兜底：JSBridge 未注入（非微信环境误判）时不卡死
      setTimeout(() => {
        if (!(window as any).WeixinJSBridge) {
          reject(new Error('微信支付组件未就绪，请刷新后重试'));
        }
      }, 3000);
    }
  });
}

export const PayWithQR: React.FC<PayWithQRProps> = ({ planType, userId, onSuccess, onBack, compact }) => {
  const [method, setMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [order, setOrder] = useState<CreateOrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [paying, setPaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const plan = getPlanByType(planType as any);
  const inWeChat = isWeChatBrowser();

  const status = usePaymentPolling(order?.orderId ?? null);
  const paidNotified = useRef(false);

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

  // 轮询到已支付 → 通知父级（只通知一次）
  useEffect(() => {
    if (status === 'paid' && order && !paidNotified.current) {
      paidNotified.current = true;
      onSuccess(order.orderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, order]);

  // 清除 URL 上的 openid / oauth_error 参数（授权回调残留）
  const cleanUrl = useCallback(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('openid') || url.searchParams.has('oauth_error')) {
      url.searchParams.delete('openid');
      url.searchParams.delete('oauth_error');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // 微信内 + OAuth 回调带回 openid + 有支付意图 → 自动继续 JSAPI 支付
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openid = params.get('openid');
    const intent = sessionStorage.getItem(WECHAT_OAUTH_KEY);
    if (openid && intent === planType) {
      sessionStorage.removeItem(WECHAT_OAUTH_KEY);
      setPaying(true);
      createOrder({ userId, planType, paymentMethod: 'wechat', channel: 'jsapi', openid })
        .then(async (result) => {
          setOrder(result);
          if (result.jsapiParams) {
            const r = await invokeWechatPay(result.jsapiParams);
            if (r === 'cancel') {
              setError('您已取消支付，可再次点击支付');
            }
          }
        })
        .catch((e: Error) => setError(e.message))
        .finally(() => {
          setPaying(false);
          cleanUrl();
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 模拟支付确认（仅 mock provider）
  const handleMockPay = async () => {
    if (!order) return;
    setConfirming(true);
    try {
      const result = await confirmMockPayment(order.orderId);
      if (result?.ok) {
        paidNotified.current = true;
        onSuccess(order.orderId);
        return;
      }
      setError('支付确认失败，请刷新后重试');
    } catch (e: any) {
      setError(e.message || '支付确认失败');
    } finally {
      setConfirming(false);
    }
  };

  // 点击「立即支付」
  const handlePay = async () => {
    setError(null);
    if (method === 'alipay') {
      setError('支付宝支付暂未开通，请使用微信支付');
      return;
    }
    if (creating) return;
    setCreating(true);
    try {
      // 微信内 → 需要 openid（OAuth 获取）→ JSAPI 调起
      if (inWeChat) {
        const params = new URLSearchParams(window.location.search);
        const openid = params.get('openid');
        if (!openid) {
          sessionStorage.setItem(WECHAT_OAUTH_KEY, planType);
          const oauthUrl = await getOauthUrl();
          window.location.href = oauthUrl; // 跳转授权，回调带回 openid 后自动继续
          return;
        }
        setPaying(true);
        const result = await createOrder({ userId, planType, paymentMethod: 'wechat', channel: 'jsapi', openid });
        setOrder(result);
        if (result.jsapiParams) {
          const r = await invokeWechatPay(result.jsapiParams);
          if (r === 'cancel') setError('您已取消支付，可再次点击支付');
        }
        cleanUrl();
        return;
      }

      // 其他环境 → Native 扫码
      const result = await createOrder({ userId, planType, paymentMethod: 'wechat' });
      setOrder(result);
    } catch (e: any) {
      setError(e.message || '创建订单失败，请稍后重试');
    } finally {
      setCreating(false);
      setPaying(false);
    }
  };

  // ---- 错误态 ----
  if (error && !order) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-red-500 font-bold">{error}</p>
        <button
          onClick={() => { setError(null); }}
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

  // ---- 已创建订单 ----
  if (order) {
    return (
      <div className={cn('flex flex-col items-center text-center', compact ? 'py-1' : 'py-4')}>
        {error && (
          <div className="mb-3 w-full max-w-xs mx-auto flex items-center justify-center gap-1.5 text-xs text-red-500 font-bold bg-red-50 py-2 px-3 rounded-xl">
            <XCircle className="w-3.5 h-3.5 shrink-0" /> {error}
          </div>
        )}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-slate-500 text-sm font-bold">{plan?.name || '订单'}</span>
          <span className="text-blue-600 font-extrabold">¥{order.amount}</span>
        </div>

        {/* mock：模拟支付按钮 */}
        {order.provider === 'mock' ? (
          <>
            <p className="text-slate-400 text-[11px] mb-3 font-medium">
              模拟订单号 {order.orderId}
            </p>
            <div className="space-y-2 w-full max-w-xs mx-auto">
              <button
                onClick={handleMockPay}
                disabled={confirming}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {confirming ? '确认中...' : '模拟支付成功（演示）'}
              </button>
              {onBack && (
                <button onClick={onBack} className="w-full py-2 text-slate-500 hover:text-slate-800 text-[11px] font-bold transition-all flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> 返回重新选择
                </button>
              )}
            </div>
          </>
        ) : inWeChat ? (
          // 微信内：JSAPI 已调起，等待支付结果
          <div className="flex flex-col items-center py-6 space-y-3">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"
            >
              <Loader2 className="w-6 h-6 animate-spin" />
            </motion.div>
            <p className="text-slate-500 text-sm font-bold">
              {status === 'paid' ? '支付成功！' : '正在等待支付结果...'}
            </p>
            <p className="text-[11px] text-slate-400">
              {status === 'timeout' ? '支付超时，请重新下单' : '请在微信支付窗口完成付款'}
            </p>
            {status === 'paid' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 text-green-600 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" /> 支付成功！
              </motion.div>
            )}
            {status === 'timeout' && (
              <button
                onClick={() => { setOrder(null); setError(null); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                重新支付
              </button>
            )}
            {onBack && (
              <button onClick={onBack} className="text-slate-400 hover:text-slate-700 text-[11px] font-bold flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> 返回
              </button>
            )}
          </div>
        ) : (
          // 外部环境：展示二维码 + 轮询
          <>
            <p className="text-slate-400 text-[11px] mb-3 font-medium">
              微信扫码支付 · 订单号 {order.orderId}
            </p>
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
            {status === 'paid' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 text-green-600 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" /> 支付成功！
              </motion.div>
            )}
            {status === 'timeout' && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-[11px] text-red-500 font-bold">支付超时，请重新下单</p>
                <button
                  onClick={() => { setOrder(null); setError(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  重新支付
                </button>
              </div>
            )}
            {onBack && (
              <button onClick={onBack} className="mt-2 w-full py-2 text-slate-500 hover:text-slate-800 text-[11px] font-bold transition-all flex items-center justify-center gap-1">
                <ArrowLeft className="w-3 h-3" /> 返回重新选择
              </button>
            )}
          </>
        )}

        <p className="mt-3 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
          <ShieldCheck className="w-3 h-3" />
          {order.provider === 'mock' ? '模拟支付模式 · 数据会真实写入订单与会员系统' : '微信支付 APIv3 加密传输'}
        </p>
      </div>
    );
  }

  // ---- 初始：选择支付方式 + 立即支付 ----
  return (
    <div className={cn('flex flex-col w-full', compact ? 'py-1' : 'py-4')}>
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-slate-500 text-sm font-bold">{plan?.name || '订单'}</span>
          <span className="text-blue-600 font-extrabold">¥{plan?.price.toFixed(2)}</span>
        </div>
        <p className="text-slate-400 text-[11px] font-medium">选择支付方式后点击立即支付</p>
      </div>

      {/* 支付方式选择 */}
      <div className="space-y-2 w-full max-w-xs mx-auto">
        <button
          onClick={() => { setMethod('wechat'); setError(null); }}
          className={cn(
            'w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left',
            method === 'wechat'
              ? 'border-emerald-500 bg-emerald-50/60 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300'
          )}
        >
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', method === 'wechat' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600')}>
            <MessageCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">微信支付</p>
            <p className="text-[10px] text-slate-400 font-medium">
              {inWeChat ? '微信内直接支付' : '扫码支付 / 微信内直接支付'}
            </p>
          </div>
          {method === 'wechat' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        </button>

        <button
          onClick={() => { setMethod('alipay'); setError('支付宝支付暂未开通，请使用微信支付'); }}
          className={cn(
            'w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left opacity-80',
            method === 'alipay'
              ? 'border-blue-500 bg-blue-50/60 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300'
          )}
        >
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', method === 'alipay' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600')}>
            <Wallet className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">支付宝</p>
            <p className="text-[10px] text-amber-500 font-medium">暂未开通</p>
          </div>
          {method === 'alipay' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-red-500 font-bold">
          <XCircle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      {/* 立即支付 */}
      <div className="space-y-2 w-full max-w-xs mx-auto mt-4">
        <button
          onClick={handlePay}
          disabled={creating || paying}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] shadow-xl shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
        >
          {(creating || paying) ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          {(creating || paying) ? '正在调起支付...' : '立即支付'}
        </button>
        {onBack && (
          <button onClick={onBack} className="w-full py-2 text-slate-500 hover:text-slate-800 text-[11px] font-bold transition-all flex items-center justify-center gap-1">
            <ArrowLeft className="w-3 h-3" /> 返回重新选择
          </button>
        )}
      </div>
    </div>
  );
};
