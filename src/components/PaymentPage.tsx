import React from 'react';
import { ChevronLeft, ShieldCheck, CheckCircle2, Sparkles, Clock, Smartphone } from 'lucide-react';
import { PayWithQR } from './PayWithQR';
import { getPlanByType } from '../lib/pricing';
import { SEO } from './SEO';

interface PaymentPageProps {
  onBack: () => void;
  onSuccess: (orderId: string) => void;
  planId: string;
}

const DURATION_TEXT: Record<string, string> = {
  single_export: '单次使用，即买即用',
  week: '有效期 7 天',
  month: '有效期 30 天',
  quarter: '有效期 90 天',
  year: '有效期 365 天',
  student_year: '有效期 365 天（学生特惠）',
  lifetime: '永久有效',
};

export const PaymentPage: React.FC<PaymentPageProps> = ({ onBack, onSuccess, planId }) => {
  // 从 PLANS 读取真实方案数据（服务端按同一份常量计价，杜绝前端价格被篡改）
  const plan = getPlanByType(planId as any) || getPlanByType('month')!;
  const duration = DURATION_TEXT[plan.type] || DURATION_TEXT.month;

  return (
    <div className="min-h-screen bg-[#f8fafc] py-20 px-6">
      <SEO
        title="确认订单 - 会员购买"
        description="选择适合你的会员方案，安全支付即享壹页简历的导出与会员权益。"
        keywords="壹页简历, 会员购买, 简历导出, 订单支付, 简历会员"
      />
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
                  <h3 className="font-bold text-xl text-slate-800">{plan.name}</h3>
                  <p className="text-slate-400 text-sm flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {duration}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-3xl font-black text-slate-900">¥{plan.price}</span>
                  </div>
                  {plan.type === 'single_export' ? (
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">单次 · 无水印 PDF</p>
                  ) : (
                    <p className="text-[10px] font-black text-macaron-mint uppercase tracking-widest mt-1">折合 {plan.dailyPrice}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">包含权益</h4>
                <div className="grid grid-cols-1 gap-3">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                      <div className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 flex items-center gap-4 text-xs font-bold text-slate-400 bg-slate-50 -mx-10 -mb-10 p-10 rounded-b-[2.5rem]">
                <ShieldCheck className="w-5 h-5 text-[#2d5a4c]" />
                <span>由壹页简历安全支付中心提供技术支持 · 金额以支付网关实际结算为准</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-800">选择支付方式</h2>

            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-6 shadow-2xl shadow-blue-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400 uppercase tracking-widest text-xs">实付金额</span>
                <span className="text-4xl font-display font-black">¥{plan.price.toFixed(2)}</span>
              </div>

              <div className="bg-white rounded-[2rem] px-6 py-8">
                <PayWithQR
                  planType={plan.type}
                  onSuccess={onSuccess}
                  onBack={onBack}
                />
              </div>

              <div className="flex items-center justify-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <p className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> 微信内一键支付</p>
                <div className="w-1 h-1 bg-slate-700 rounded-full" />
                <p>安全加密</p>
                <div className="w-1 h-1 bg-slate-700 rounded-full" />
                <p>即时到账</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-center font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              支付完成后自动开通，刷新页面会员权益依然生效
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
