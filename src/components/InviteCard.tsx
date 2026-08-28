import React, { useState } from 'react';
import { Gift, Copy, Check, Users as UsersIcon, Share2 } from 'lucide-react';
import { buildInviteLink } from '../lib/referralService';
import type { ReferralStats } from '../types';

interface InviteCardProps {
  inviteCode: string | null | undefined;
  baseUrl?: string;           // 部署域名，如 https://resume.xnkun.com
  stats?: ReferralStats;
  onCopied?: () => void;
}

/** 复制到剪贴板（微信 WebView 兼容降级） */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export const InviteCard: React.FC<InviteCardProps> = ({ inviteCode, baseUrl = '', stats, onCopied }) => {
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);
  const link = buildInviteLink(inviteCode, baseUrl);
  const s = stats || { invitedCount: 0, bonusCount: 0 };

  const handleCopy = async (type: 'link' | 'code', text: string) => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(type);
      onCopied?.();
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <div className="rounded-[2rem] border border-amber-100 bg-gradient-to-br from-amber-50/80 to-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
          <Gift className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-display font-extrabold text-slate-900">邀请好友 · 免费导出</h3>
          <p className="text-[11px] text-slate-500 font-medium">
            好友注册成功，你和 TA 各得 1 次免费导出（每人最多得 2 次）
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm font-bold text-slate-800 select-all">
          {inviteCode || '——'}
        </div>
        <button
          onClick={() => handleCopy('code', inviteCode || '')}
          disabled={!inviteCode}
          className="px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
        >
          {copied === 'code' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied === 'code' ? '已复制' : '复制码'}
        </button>
      </div>

      {link && (
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 truncate">
            {link}
          </div>
          <button
            onClick={() => handleCopy('link', link)}
            className="px-4 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
          >
            {copied === 'link' ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied === 'link' ? '已复制' : '复制链接'}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl bg-white/70 border border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <UsersIcon className="w-4 h-4 text-slate-400" />
          已邀请 {s.invitedCount} 位好友
        </div>
        <div className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
          已获得 {s.bonusCount}/2 次免费导出
        </div>
      </div>
    </div>
  );
};
