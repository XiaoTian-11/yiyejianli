import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, CreditCard, ShieldCheck, Download, Sparkles, Zap } from 'lucide-react';
import { PLANS } from '../constants';
import { cn } from '../lib/utils';
import { PayWithQR } from './PayWithQR';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseSuccess: (planType: string) => void;
  onOpenAgreement?: (tab: 'service' | 'privacy') => void;
}

type ExportStep = 'plans' | 'pay' | 'success';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onPurchaseSuccess,
  onOpenAgreement,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('single_export');
  const [step, setStep] = useState<ExportStep>('plans');

  const selectedPlan = PLANS.find((p) => p.type === selectedPlanId) || PLANS[0];
  const isOneTime = selectedPlan?.category === 'one_time';

  const handleSelectPlan = () => {
    setStep('pay');
  };

  const handlePaymentSuccess = (orderId: string) => {
    onPurchaseSuccess(selectedPlanId);
    setStep('success');
    setTimeout(() => {
      setStep('plans');
    }, 2000);
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg flex flex-col max-h-[92vh] bg-white rounded-[2rem] shadow-2xl z-[210] overflow-hidden border border-slate-100"
          >
            {/* Header（固定，不随内容滚动） */}
            <div className="relative p-5 pb-1 shrink-0">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 rounded-xl border border-blue-200 text-blue-500">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-extrabold text-slate-900">
                    导出简历
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    选择适合的方式获取无水印 PDF 导出
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 pt-2 flex-1 overflow-y-auto">
              {step === 'plans' && (
                <div className="space-y-4">
                  {/* Dual Column Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PLANS.map((plan) => {
                      const isSelected = selectedPlanId === plan.type;
                      return (
                        <div
                          key={plan.type}
                          onClick={() => setSelectedPlanId(plan.type)}
                          className={cn(
                            "p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between",
                            isSelected
                              ? "border-blue-500 bg-blue-50/20 shadow-lg shadow-blue-500/5 ring-4 ring-blue-50/50"
                              : "border-slate-100 hover:border-slate-300 hover:bg-slate-50/50"
                          )}
                        >
                          {plan.highlight && (
                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-md">
                              最受欢迎
                            </span>
                          )}
                          <div className="mb-3">
                            <span className="text-slate-400 text-[9px] font-black tracking-widest uppercase">
                              {plan.category === 'one_time' ? '单次导出' : plan.name}
                            </span>
                            <div className="flex items-baseline gap-0.5 mt-1">
                              <span className="text-[10px] font-bold font-mono">¥</span>
                              <span className="text-2xl font-display font-extrabold text-slate-900">
                                {plan.price}
                              </span>
                              {plan.category === 'subscription' && (
                                <span className="text-[9px] text-pink-500 font-extrabold ml-1">
                                  {plan.dailyPrice}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 block italic font-medium">
                              {plan.target}
                            </span>
                          </div>

                          <div className="text-[9px] text-slate-600 space-y-1 bg-white/60 p-2 rounded-xl border border-slate-100/30">
                            {plan.type === 'single_export' ? (
                              <div className="flex items-center gap-1.5 font-medium">
                                <Check className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                                <span>无水印 PDF × 1</span>
                              </div>
                            ) : (
                              plan.features.slice(0, 2).map((feat, i) => (
                                <div key={i} className="flex items-center gap-1.5 font-medium">
                                  <Check className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                                  <span className="truncate">{feat}</span>
                                </div>
                              ))
                            )}
                            {plan.exportQuota && (
                              <div className="flex items-center gap-1.5 font-medium">
                                <Check className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                                <span>{plan.exportQuota} 次导出</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Feature tags */}
                  <div className="flex gap-2 justify-center text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-indigo-400" />14 套模板</span>
                    <span className="text-slate-200">|</span>
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" />无水印 PDF</span>
                    <span className="text-slate-200">|</span>
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" />ATS 优化</span>
                  </div>

                </div>
              )}

              {step === 'pay' && (
                <div className="flex flex-col items-center justify-center py-2">
                  <h4 className="font-extrabold text-slate-900 text-base mb-1">选择支付方式</h4>
                  <PayWithQR
                    planType={selectedPlanId}
                    onSuccess={handlePaymentSuccess}
                    onBack={() => setStep('plans')}
                    compact
                  />
                </div>
              )}

              {step === 'success' && (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="w-12 h-12 bg-gradient-to-tr from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg text-white">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </motion.div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">购买成功！</h3>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {isOneTime ? (
                        <>已获得 <span className="text-blue-600 font-bold">1 次 PDF 导出机会</span></>
                      ) : (
                        <>已升级为 <span className="text-amber-600 font-bold">尊享会员</span></>
                      )}
                    </p>
                  </div>
                  <p className="text-slate-400 text-[10px] animate-pulse">
                    {isOneTime ? '即将开始导出...' : '正在解锁会员功能...'}
                  </p>
                </div>
              )}
            </div>

            {/* 固定底部 CTA：不随内容滚动，悬浮在弹窗底部 */}
            {step === 'plans' && (
              <div className="px-5 pb-5 pt-3 shrink-0 border-t border-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] text-slate-400 font-medium select-none leading-snug">
                    * 即代表您同意
                    <button type="button" onClick={() => onOpenAgreement?.('service')} className="text-amber-600 hover:underline cursor-pointer font-bold bg-transparent border-none p-0 inline mx-0.5">服务协议</button>
                    》
                  </p>
                  <button
                    onClick={handleSelectPlan}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-black shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <CreditCard className="w-3 h-3 text-amber-400" />
                    {selectedPlan?.category === 'one_time' ? '立即购买' : '立即订阅'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
