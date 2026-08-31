import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, ArrowRight, Layout } from 'lucide-react';

interface ReferralWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 「去模板中心」：关闭弹窗并跳转 */
  onGoTemplates: () => void;
}

/**
 * 被邀请新用户注册成功后的奖励欢迎弹窗。
 * 提示「你和好友各获得 1 次免费导出」，引导去模板中心开始制作简历。
 */
export const ReferralWelcomeModal: React.FC<ReferralWelcomeModalProps> = ({
  isOpen,
  onClose,
  onGoTemplates,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[220]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[2rem] shadow-2xl z-[230] overflow-hidden border border-amber-100"
          >
            <div className="relative p-6">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>

              {/* 图标区 */}
              <div className="flex flex-col items-center text-center pt-2">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200 mb-4"
                >
                  <Gift className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-display font-extrabold text-slate-900">
                  🎉 欢迎加入壹页简历！
                </h3>
                <p className="text-sm font-bold text-amber-600 mt-2">
                  你和好友各获得 1 次免费导出额度
                </p>
                <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                  现在就可以挑选一款心仪的模板开始制作简历，
                  <br />
                  完成后直接免费导出 PDF。
                </p>
              </div>

              {/* CTA */}
              <div className="mt-6 space-y-2.5">
                <button
                  onClick={onGoTemplates}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                >
                  <Layout className="w-4 h-4" />
                  去模板中心开始制作
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 text-slate-400 hover:text-slate-600 text-[11px] font-bold transition-colors"
                >
                  稍后再说
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
