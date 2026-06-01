import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  CreditCard,
  QrCode
} from 'lucide-react';
import { cn } from '../lib/utils';

interface PaymentPageProps {
  onBack: () => void;
  onSuccess: () => void;
  planId: string;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({ onBack, onSuccess, planId }) => {
  const [method, setMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [isProcessing, setIsProcessing] = useState(false);

  const planInfo = planId === 'annual' 
    ? { name: '年度尊享会员', price: 144, originalPrice: 299, period: '年' }
    : { name: '季度会员', price: 49, originalPrice: 99, period: '季度' };

  const handlePay = () => {
    setIsProcessing(true);
    // Simulate payment process
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold transition-all mb-12 group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-all" /> 返回
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Order Summary */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-display font-bold text-slate-900">确认订单</h1>
              <p className="text-slate-500 italic">您正在为您的职业前程进行一项明智的投资。</p>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between pb-8 border-b border-slate-50">
                <div className="space-y-1">
                  <h3 className="font-bold text-xl text-slate-800">{planInfo.name}</h3>
                  <p className="text-slate-400 text-sm">有效期: 365 天</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-slate-400 line-through text-sm">¥{planInfo.originalPrice}</span>
                    <span className="text-3xl font-black text-slate-900">¥{planInfo.price}</span>
                  </div>
                  <p className="text-[10px] font-black text-macaron-mint uppercase tracking-widest mt-1">已优惠 ¥{planInfo.originalPrice - planInfo.price}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">包含权益</h4>
                <div className="grid grid-cols-1 gap-3">
                  {["专家简历润色", "ATS 兼容性优化", "高级模板全解锁", "简历打分建议"].map((f, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                      <div className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 flex items-center gap-4 text-xs font-bold text-slate-400 bg-slate-50 -mx-10 -mb-10 p-10 rounded-b-[2.5rem]">
                <ShieldCheck className="w-5 h-5 text-[#2d5a4c]" />
                <span>由壹页简历安全支付中心提供技术支持</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-800">选择支付方式</h2>
            
            <div className="space-y-4">
              <PaymentMethodButton 
                active={method === 'wechat'} 
                onClick={() => setMethod('wechat')}
                icon={<div className="w-10 h-10 bg-[#07c160] rounded-xl flex items-center justify-center text-white"><QrCode className="w-6 h-6" /></div>}
                label="微信支付"
                description="使用微信扫码支付"
              />
              <PaymentMethodButton 
                active={method === 'alipay'} 
                onClick={() => setMethod('alipay')}
                icon={<div className="w-10 h-10 bg-[#1677ff] rounded-xl flex items-center justify-center text-white"><CreditCard className="w-6 h-6" /></div>}
                label="支付宝支付"
                description="支持余额、花呗、银行卡"
              />
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8 shadow-2xl shadow-blue-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400 uppercase tracking-widest text-xs">实付金额</span>
                <span className="text-4xl font-display font-black">¥{planInfo.price.toFixed(2)}</span>
              </div>

              <button 
                onClick={handlePay}
                disabled={isProcessing}
                className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    立即支付 <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <p>极速到账</p>
                <div className="w-1 h-1 bg-slate-700 rounded-full" />
                <p>安全加密</p>
                <div className="w-1 h-1 bg-slate-700 rounded-full" />
                <p>发票支持</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentMethodButton = ({ active, onClick, icon, label, description }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, description: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-6 p-6 rounded-[2rem] border-2 transition-all text-left",
      active 
        ? "border-blue-600 bg-white shadow-xl shadow-blue-50 ring-4 ring-blue-50" 
        : "border-slate-100 bg-white hover:border-slate-200"
    )}
  >
    {icon}
    <div className="flex-1">
      <h4 className="font-bold text-slate-800">{label}</h4>
      <p className="text-xs text-slate-400 font-medium">{description}</p>
    </div>
    <div className={cn(
      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
      active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200"
    )}>
      {active && <CheckCircle2 className="w-4 h-4" />}
    </div>
  </button>
);
