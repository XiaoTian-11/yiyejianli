import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Crown, CreditCard, ShieldCheck, Loader2, Download, Sparkles, Zap } from 'lucide-react';
import { PLANS } from '../constants';
import { cn } from '../lib/utils';

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
  const [qrcodeLoading, setQrcodeLoading] = useState(false);

  const selectedPlan = PLANS.find((p) => p.type === selectedPlanId) || PLANS[0];
  const isOneTime = selectedPlan?.category === 'one_time';

  const handleSelectPlan = () => {
    setQrcodeLoading(true);
    setStep('pay');
    setTimeout(() => {
      setQrcodeLoading(false);
    }, 800);
  };

  const handleCompletePayment = () => {
    setStep('success');
    setTimeout(() => {
      onPurchaseSuccess(selectedPlanId);
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl z-[210] overflow-hidden border border-slate-100"
          >
            {/* Header */}
            <div className="relative p-6 pb-2">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-2xl border border-blue-200 text-blue-500">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-extrabold text-slate-900">
                    导出简历
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    选择适合的方式获取无水印 PDF 导出
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 pt-2">
              {step === 'plans' && (
                <div className="space-y-4 mt-2">
                  {/* Plan Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PLANS.map((plan) => {
                      const isSelected = selectedPlanId === plan.type;
                      return (
                        <div
                          key={plan.type}
                          onClick={() => setSelectedPlanId(plan.type)}
                          className={cn(
                            "p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between",
                            isSelected
                              ? "border-blue-500 bg-blue-50/20 shadow-lg shadow-blue-500/5 ring-4 ring-blue-50/50"
                              : "border-slate-100 hover:border-slate-300 hover:bg-slate-50/50"
                          )}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className={cn(
                                "text-[10px] font-black tracking-widest uppercase",
                                plan.category === 'one_time' ? 'text-blue-500' : 'text-slate-400'
                              )}>
                                {plan.category === 'one_time' ? '单次' : plan.name}
                              </span>
                              {plan.highlight && (
                                <span className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full">
                                  最受欢迎
                                </span>
                              )}
                            </div>
                            <div className="flex items-baseline gap-0.5 mt-1">
                              <span className="text-xs font-bold font-mono">¥</span>
                              <span className="text-2xl font-display font-extrabold text-slate-900">
                                {plan.price}
                              </span>
                            </div>
                            {plan.category === 'subscription' && (
                              <span className="text-[10px] text-pink-500 font-extrabold block">
                                仅需 {plan.dailyPrice}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                              {plan.target}
                            </span>
                          </div>

                          <div className="mt-2 text-[10px] text-slate-600 space-y-1 bg-white/60 p-2 rounded-xl border border-slate-100/30">
                            {plan.type === 'single_export' ? (
                              <div className="flex items-center gap-1.5 font-medium">
                                <Check className="w-3 h-3 text-blue-500 shrink-0" />
                                <span>无水印 PDF 导出 × 1 次</span>
                              </div>
                            ) : (
                              plan.features.slice(0, 2).map((feat, i) => (
                                <div key={i} className="flex items-center gap-1.5 font-medium">
                                  <Check className="w-3 h-3 text-blue-500 shrink-0" />
                                  <span className="truncate">{feat}</span>
                                </div>
                              ))
                            )}
                            {plan.exportQuota && (
                              <div className="flex items-center gap-1.5 font-medium">
                                <Check className="w-3 h-3 text-blue-500 shrink-0" />
                                <span>{plan.exportQuota} 次 PDF 导出</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Feature Banner */}
                  <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100/50 flex flex-wrap gap-3 justify-around text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="font-bold text-slate-600">14 套专业模板</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-bold text-slate-600">无水印超清 PDF</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-bold text-slate-600">智能 ATS 优化</span>
                    </div>
                  </div>

                  {/* Action + Agreement */}
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[10px] text-slate-400 font-medium select-none">
                      * 即代表您同意《
                      <button
                        type="button"
                        onClick={() => onOpenAgreement?.('service')}
                        className="text-amber-600 hover:underline cursor-pointer font-bold bg-transparent border-none p-0 inline"
                      >
                        服务协议
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
                      className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                      {isOneTime ? '立即购买' : '立即订阅'}
                    </button>
                  </div>
                </div>
              )}

              {step === 'pay' && (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  {qrcodeLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 space-y-4">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      <p className="text-slate-500 text-xs font-bold">正在安全加载支付通道...</p>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-extrabold text-[#111827] text-lg mb-1">微信 / 支付宝 扫码支付</h4>
                      <p className="text-slate-500 text-xs mb-6 font-medium">
                        {isOneTime ? '购买：' : '订阅套餐：'}
                        <span className="text-slate-800 font-bold">{selectedPlan?.name || '单次导出'}</span> —
                        实付金额：<span className="text-blue-600 font-bold text-sm">¥{selectedPlan?.price}</span>
                      </p>

                      {/* Simulated QR Code */}
                      <div className="relative p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center shadow-lg shadow-slate-100 mb-6 group">
                        <div className="w-48 h-48 bg-white rounded-2xl border-2 border-slate-200/60 p-3 flex flex-col justify-between relative overflow-hidden">
                          <div className="grid grid-cols-6 gap-1 w-full h-full opacity-90 transition-all group-hover:scale-95 duration-500">
                            {[...Array(36)].map((_, idx) => (
                              <div
                                key={idx}
                                className={cn(
                                  "rounded-sm",
                                  (idx % 3 === 0 || idx % 4 === 0 || idx < 6 || idx > 30 || idx % 7 === 1)
                                    ? "bg-slate-900"
                                    : "bg-slate-100"
                                )}
                              />
                            ))}
                          </div>
                          <div className="absolute inset-x-0 bottom-4 w-fit mx-auto bg-slate-900 border border-amber-300 text-amber-300 text-[10px] py-1 px-3 rounded-full flex items-center gap-1 shadow font-bold">
                            <Crown className="w-3 h-3 fill-current" />
                            <span>安全认证支付</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 max-w-sm w-full mx-auto">
                        <button
                          onClick={handleCompletePayment}
                          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-100 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          已完成支付 (模拟确认)
                        </button>
                        <button
                          onClick={() => setStep('plans')}
                          className="w-full py-3 text-slate-500 hover:text-slate-800 text-xs font-bold transition-all"
                        >
                          返回重新选择
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 'success' && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-16 h-16 bg-gradient-to-tr from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl text-white"
                  >
                    <Check className="w-8 h-8 stroke-[3]" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">购买成功！</h3>
                    <p className="text-slate-500 text-xs mt-1">
                      {isOneTime ? (
                        <>已获得 <span className="text-blue-600 font-bold">1 次 PDF 导出机会</span></>
                      ) : (
                        <>您的账户已升级为 <span className="text-amber-600 font-bold">尊享会员 ({selectedPlan?.name})</span></>
                      )}
                    </p>
                  </div>
                  <p className="text-[#64748b] text-[11px] animate-pulse">
                    {isOneTime ? '即将开始导出，请稍候...' : '正在解锁会员功能，请稍候...'}
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
