import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Crown, CreditCard, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { PLANS } from '../constants';
import { cn } from '../lib/utils';
import { PayWithQR } from './PayWithQR';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (selectedPlanType?: string) => void;
  reason?: string;
  onOpenAgreement?: (tab: 'service' | 'privacy') => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onSuccess, reason, onOpenAgreement }) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('month');
  const [step, setStep] = useState<'plans' | 'pay' | 'success'>('plans');

  const selectedPlan = PLANS.find((p) => p.type === selectedPlanId) || PLANS[1];

  const handleSelectPlan = () => {
    setStep('pay');
  };

  const handlePaymentSuccess = (orderId: string) => {
    onSuccess(selectedPlanId);
    setStep('success');
    setTimeout(() => {
      onClose();
      setStep('plans');
    }, 2000);
  };

  const getReasonText = () => {
    if (!reason) return '尊享会员全功能解锁';
    switch (reason) {
      case 'templates':
        return '此模板为会员专属，开通会员立即使用全部精美排版';
      case 'limit':
        return '免费简历制作额度已满，开通尊享会员解锁30个版本上限';
      case 'sections':
        return '自定义板块数量达到限制，开通尊享会员解锁无限创意自定义板块';
      case 'ats':
        return 'ATS高通过率检测与智能建议是会员专属的高级分析工具';
      case 'translate':
        return '每日 AI 翻译次数已达上限，开通会员每日可翻译 20 次';
      default:
        return reason;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200]"
          />

          {/* Modal Centered */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl z-[210] overflow-hidden border border-slate-100"
          >
            {/* Header Area */}
            <div className="relative p-8 pb-4">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-500 animate-pulse">
                  <Crown className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-extrabold text-slate-900 flex items-center gap-1.5">
                    升级壹页简历尊享会员
                  </h3>
                  <p className="text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-full inline-block mt-1">
                    ✨ {getReasonText()}
                  </p>
                </div>
              </div>
            </div>

            {/* Main content body */}
            <div className="px-8 pb-8 pt-2">
              {step === 'plans' && (
                <div className="space-y-6">
                  {/* Grid or List of plans */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PLANS.map((plan) => {
                      const isSelected = selectedPlanId === plan.type;
                      return (
                        <div
                          key={plan.type}
                          onClick={() => setSelectedPlanId(plan.type)}
                          className={cn(
                            "p-5 rounded-3xl border-2 transition-all cursor-pointer relative flex flex-col justify-between",
                            isSelected
                              ? "border-blue-500 bg-blue-50/20 shadow-lg shadow-blue-500/5 ring-4 ring-blue-50/50"
                              : "border-slate-100 hover:border-slate-300 hover:bg-slate-50/50"
                          )}
                        >
                          {plan.highlight && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-md">
                              最受欢迎
                            </span>
                          )}
                          <div className="mb-4">
                            <span className="text-slate-400 text-[10px] font-black tracking-widest uppercase">
                              {plan.name}
                            </span>
                            <div className="flex items-baseline gap-0.5 mt-1">
                              <span className="text-xs font-bold font-mono">¥</span>
                              <span className="text-3.5xl font-display font-extrabold text-slate-900">
                                {plan.price}
                              </span>
                            </div>
                            <span className="text-[10px] text-pink-500 font-extrabold mt-0.5 block">
                              仅需 {plan.dailyPrice}
                            </span>
                            <span className="text-[11px] text-slate-500 mt-2 block italic font-medium">
                              {plan.target}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-600 space-y-1 bg-white/60 p-2.5 rounded-xl border border-slate-100/30">
                            {plan.features.slice(0, 3).map((feat, i) => (
                              <div key={i} className="flex items-center gap-1.5 font-medium">
                                <Check className="w-3 h-3 text-blue-500 shrink-0" />
                                <span className="truncate">{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Core Rights List Banner */}
                  <div className="bg-slate-50/80 p-4 rounded-3xl border border-slate-100/50 flex flex-col sm:flex-row gap-4 justify-around">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1 px-1.5 bg-indigo-50 text-indigo-500 rounded-lg">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">14 套会员专属精美模板</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="p-1 px-1.5 bg-emerald-50 text-emerald-500 rounded-lg">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">无限次无水印超清 PDF 导出</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="p-1 px-1.5 bg-amber-50 text-amber-500 rounded-lg">
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">智能 ATS 初筛竞争力优化（即将上线）</span>
                    </div>
                  </div>

                  {/* Bottom Select Action */}
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-[11px] text-slate-400 font-medium select-none">
                      * 开通即代表您同意《
                      <button 
                        type="button" 
                        onClick={() => onOpenAgreement?.('service')} 
                        className="text-amber-600 hover:underline cursor-pointer font-bold bg-transparent border-none p-0 inline"
                      >
                        壹页简历服务协议
                      </button>
                      》与《
                      <button 
                        type="button" 
                        onClick={() => onOpenAgreement?.('privacy')} 
                        className="text-amber-600 hover:underline cursor-pointer font-bold bg-transparent border-none p-0 inline"
                      >
                        隐私政策
                      </button>
                      》
                    </p>
                    <button
                      onClick={handleSelectPlan}
                      className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      立即订阅「{selectedPlan.name}」
                    </button>
                  </div>
                </div>
              )}

              {step === 'pay' && (
                <div className="flex flex-col items-center justify-center py-2">
                  <h4 className="font-extrabold text-[#111827] text-lg mb-1">微信扫码支付</h4>
                  <p className="text-slate-500 text-xs mb-3 font-medium">
                    订阅套餐：<span className="text-slate-800 font-bold">{selectedPlan.name}</span>
                  </p>
                  <PayWithQR
                    planType={selectedPlanId}
                    onSuccess={handlePaymentSuccess}
                    onBack={() => setStep('plans')}
                    compact
                  />
                </div>
              )}

              {step === 'success' && (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-tr from-macaron-mint to-emerald-500 rounded-full flex items-center justify-center shadow-xl text-white">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">支付激活成功！</h3>
                    <p className="text-slate-500 text-xs mt-1">
                      您的账户已经升级为：<span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded ml-1">尊享会员 ({selectedPlan?.name || '月卡会员'})</span>
                    </p>
                  </div>
                  <p className="text-[#64748b] text-[11px] animate-pulse">
                    正在解锁尊享高订工具服务，请稍候...
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
