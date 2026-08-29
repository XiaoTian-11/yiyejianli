import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer } from 'lucide-react';

interface ExportConfirmModalProps {
  isOpen: boolean;
  /** 剩余导出次数，正文展示用 */
  remaining: number;
  /** 「继续导出」：扣配额 + 打印 + 关弹窗 */
  onConfirm: () => void;
  /** 「取消」/点遮罩/点 X */
  onClose: () => void;
  /** 活动总开关（开启且额度 0 时展示邀请引导） */
  referralEnabled?: boolean;
  /** 点邀请引导 → 跳个人中心邀请卡片 */
  onOpenInvite?: () => void;
}

/**
 * 次费用户导出前的二次确认弹窗。
 * 扣配额动作在 onConfirm 回调里发生——点取消分文不扣。
 * 配额一经确认消耗不退回（浏览器打印 API 无法区分「打印成功」与「用户取消」，
 * 退配额会造成「打完也退」的资损漏洞），弹窗内小字管理用户预期。
 */
export const ExportConfirmModal: React.FC<ExportConfirmModalProps> = ({
  isOpen,
  remaining,
  onConfirm,
  onClose,
  referralEnabled,
  onOpenInvite,
}) => {
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg flex flex-col bg-white rounded-[2rem] shadow-2xl z-[210] overflow-hidden border border-slate-100"
          >
            {/* Header */}
            <div className="relative p-5 pb-1 shrink-0">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 rounded-xl border border-blue-200 text-blue-500">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-extrabold text-slate-900">
                    确认导出 PDF
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    本次导出将消耗 1 次导出机会
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 pb-5 pt-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">当前剩余导出次数</span>
                <span className="text-xs font-bold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full">
                  {remaining} 次
                </span>
              </div>

              {remaining === 0 && referralEnabled && (
                <button
                  onClick={onOpenInvite}
                  className="mt-3 w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left hover:bg-amber-100/70 transition-colors"
                >
                  <p className="text-xs font-bold text-amber-700">剩余 0 次？邀请好友即可免费获得导出额度</p>
                  <p className="text-[10px] text-amber-600 mt-0.5">好友注册成功，你和 TA 各得 1 次免费导出（每人最多 2 次）→</p>
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-6 pt-3 shrink-0 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-all"
              >
                取消
              </button>
              <button
                onClick={onConfirm}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                继续导出
              </button>
            </div>

            <p className="px-5 pb-4 text-[10px] text-slate-400 text-center">
              导出次数一经消耗不予退还
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
