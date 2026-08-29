import React from 'react';
import { Award, Gift, Copy, UserPlus } from 'lucide-react';
import { InviteHowItWorks } from './InviteHowItWorks';

interface InviteSectionProps {
  /** 是否已登录（已登录点 CTA 进个人中心邀请卡片；未登录弹登录框） */
  isLoggedIn?: boolean;
  onStart: () => void;              // 未登录：打开登录/注册弹窗
  onGoInvite?: () => void;          // 已登录：跳个人中心邀请卡片
  onCopyLink?: () => void;          // 已登录：复制自己的邀请链接
}

/**
 * 官网首页「邀请好友 · 免费导出」活动板块。
 * 展示受活动总开关控制（App.tsx 里 referralEnabled 为 false 时不渲染本组件）。
 */
export const InviteSection: React.FC<InviteSectionProps> = ({
  isLoggedIn = false,
  onStart,
  onGoInvite,
  onCopyLink,
}) => {
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40" id="landing-invite">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-[2.5rem] border border-amber-100 bg-white/80 backdrop-blur-xl p-8 md:p-14 shadow-xl relative overflow-hidden">
          <div className="absolute right-[-40px] top-[-40px] w-64 h-64 bg-amber-100/40 blur-[80px] rounded-full" />

          <div className="text-center space-y-4 mb-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold border border-amber-200">
              <Award className="w-3.5 h-3.5" />
              邀请有礼
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900">
              邀请好友 · 免费导出
            </h2>
            <p className="text-slate-500 font-medium">
              分享你的专属邀请链接，好友注册成功，你和 TA 各得 1 次免费导出
            </p>
          </div>

          {/* 三步玩法（与个人中心共用） */}
          <div className="mb-10 max-w-4xl mx-auto">
            <InviteHowItWorks />
          </div>

          {/* CTA */}
          <div className="text-center">
            {isLoggedIn ? (
              <button
                onClick={onGoInvite || onCopyLink}
                className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                <Copy className="w-4 h-4" />
                复制邀请链接
              </button>
            ) : (
              <button
                onClick={onStart}
                className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                <UserPlus className="w-4 h-4" />
                立即邀请好友
              </button>
            )}
            <p className="mt-3 text-[11px] text-slate-400 font-medium">
              登录后进入「个人中心 → 邀请好友」即可复制链接或邀请码分享给好友
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
