import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, CheckCircle2, AlertCircle, X, ArrowRight, Loader2, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDemoLogin?: () => void;
  onOpenAgreement?: (tab: 'service' | 'privacy') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onDemoLogin, onOpenAgreement }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFriendlyErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return '该邮箱已被注册，请直接登录';
      case 'auth/invalid-email':
        return '输入的邮箱格式不正确';
      case 'auth/weak-password':
        return '密码长度太短，至少需要6个字符';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return '邮箱或密码不正确，请重新输入';
      default:
        return '操作失败，请重试';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic Validation
    if (!email || !password) {
      setError('请完整填写所有必填字段');
      setLoading(false);
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('两次填写的密码不一致');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err.code) || err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl z-[110] overflow-hidden border border-white/50"
          >
            <div className="p-8">
              <header className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-display font-bold">
                    {mode === 'login' ? '登录 壹页简历' : '注册 壹页简历'}
                  </h3>
                  <p className="text-slate-500 text-xs">
                    {mode === 'login' ? '使用邮箱密码登录您的账户' : '创建一个全新的求职设计账户'}
                  </p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </header>

              {/* Mode Selector Tabs */}
              <div className="flex bg-slate-100/60 p-1 rounded-2xl border border-slate-200/50 mb-6">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    mode === 'login'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  已有账号登录
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    mode === 'register'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  新用户注册
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">电子邮箱 (Email)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="zhang.yue@example.com"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all text-xs"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">登录密码 (Password)</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="不少于 6 位安全密码"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all text-xs"
                      required
                    />
                  </div>
                </div>

                {mode === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">确认安全密码 (Confirm Password)</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="再次输入以确认新密码"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all text-xs"
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  disabled={loading}
                  className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-xl shadow-slate-200/50 text-xs mt-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? '立即安全登录' : '同意服务并立即注册'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo Sign In Button Option */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                <button
                  onClick={async () => {
                    if (onDemoLogin) {
                      onDemoLogin();
                      return;
                    }

                    setLoading(true);
                    try {
                      const { signInAnonymously } = await import('firebase/auth');
                      await signInAnonymously(auth);
                      onClose();
                    } catch (err: any) {
                      console.error(err);
                      if (err.code === 'auth/operation-not-allowed') {
                        setError('线上演示模式未在 Firebase 控制台启用。请联系开发人员或选择其他方式登录。');
                      } else {
                        setError('游客登录失败');
                      }
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full py-2.5 bg-slate-900/5 hover:bg-slate-900/10 text-slate-700 rounded-2xl text-[11px] font-semibold hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                  免注册，以“游客登录”立即体验
                </button>
                <p className="text-[9.5px] text-slate-400 text-center px-4 leading-relaxed">
                  * 游客模式支持临时本地保存。若需深度同步或订阅高级服务，推荐使用个人邮箱地址注册。
                </p>
              </div>
            </div>
            <footer className="px-8 py-3 bg-slate-50/80 text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center border-t border-slate-100">
              登录即代表您同意{' '}
              <button 
                type="button"
                onClick={() => onOpenAgreement?.('service')}
                className="text-blue-600 hover:underline cursor-pointer font-extrabold"
              >
                服务协议
              </button>{' '}
              和{' '}
              <button 
                type="button"
                onClick={() => onOpenAgreement?.('privacy')}
                className="text-blue-600 hover:underline cursor-pointer font-extrabold"
              >
                隐私政策
              </button>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
