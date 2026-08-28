import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, LogOut } from 'lucide-react';

interface LeaveConfirmModalProps {
  isOpen: boolean;
  /** 正在编辑的简历名，展示用 */
  resumeName?: string;
  /** 「保存并离开」：立即保存后离开 */
  onSave: () => void;
  /** 「不保存，离开」：恢复最后已保存版本并离开 */
  onDiscard: () => void;
  /** 取消（留在编辑器继续编辑） */
  onCancel: () => void;
}

/**
 * 离开编辑器二次确认弹窗。
 * 仅当存在「未落盘改动」（1 秒自动保存窗口内刚改完）时出现。
 * 「保存并离开」→ 立即保存；「不保存，离开」→ 丢弃本次改动。
 */
export const LeaveConfirmModal: React.FC<LeaveConfirmModalProps> = ({
  isOpen,
  resumeName,
  onSave,
  onDiscard,
  onCancel,
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
            onClick={onCancel}
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
                onClick={onCancel}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-500">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-extrabold text-slate-900">
                    离开编辑器
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    您有未保存的修改{resumeName ? `（${resumeName}）` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 pb-5 pt-3">
              <p className="text-sm text-slate-600 leading-relaxed">
                离开前是否保存本次修改？未保存的更改将丢失。
              </p>
            </div>

            {/* Footer */}
            <div className="px-5 pb-6 pt-3 shrink-0 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-6 py-3 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-all"
              >
                留在编辑器
              </button>
              <button
                onClick={onDiscard}
                className="px-6 py-3 border border-red-200 text-red-500 rounded-2xl text-xs font-bold hover:bg-red-50 transition-all"
              >
                不保存，离开
              </button>
              <button
                onClick={onSave}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Save className="w-3 h-3" />
                保存并离开
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
