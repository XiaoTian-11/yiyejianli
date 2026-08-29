import React from 'react';
import { Link2, UserPlus, Gift } from 'lucide-react';

/**
 * 邀请活动「三步玩法」说明卡片。
 * 首页 InviteSection 与个人中心邀请卡片共用，保证玩法文案一致。
 */
export const InviteHowItWorks: React.FC = () => {
  const steps = [
    { icon: <Link2 className="w-5 h-5 text-blue-600" />, title: '① 复制链接', desc: '复制你的专属链接或 6 位邀请码，分享给好友' },
    { icon: <UserPlus className="w-5 h-5 text-emerald-600" />, title: '② 好友注册', desc: '好友通过你的链接打开注册，或手动输入你的邀请码' },
    { icon: <Gift className="w-5 h-5 text-amber-600" />, title: '③ 各得 1 次', desc: '注册成功，你和 TA 各 +1 次免费导出（每人最多得 2 次）' },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {steps.map((step, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
              {step.icon}
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1.5">{step.title}</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-[11px] text-slate-400 font-medium">
        每位好友成功注册，你和 TA 各 +1 次免费导出；每人最多通过邀请获得 2 次
      </p>
    </div>
  );
};
