import React, { useState } from 'react';
import { Gift, Copy, Check, Users as UsersIcon, Share2, History, UserCheck, AlertTriangle, Ban } from 'lucide-react';
import { buildInviteLink } from '../lib/referralService';
import { InviteHowItWorks } from './InviteHowItWorks';
import type { ReferralStats, ReferralRecord } from '../types';

interface InviteCardProps {
  inviteCode: string | null | undefined;
  baseUrl?: string;           // 部署域名，如 https://resume.xnkun.com
  stats?: ReferralStats;
  history?: ReferralRecord[]; // 获得奖励记录
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 获得奖励记录列表 */
const RewardHistory: React.FC<{ history: ReferralRecord[] }> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center">
        <History className="w-6 h-6 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-400 font-medium">还没有邀请记录，快去分享你的专属链接吧</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {history.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 truncate">
              <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">{r.inviteeEmail || '新用户'}</span>
              {r.deviceSuspect && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full shrink-0">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  疑似同设备
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
              {formatDate(r.createdAt)}
            </p>
          </div>
          <div className="shrink-0 ml-2">
            {r.status === 'revoked' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">
                <Ban className="w-3 h-3" />
                已撤销
              </span>
            ) : r.inviterBonus === 1 ? (
              <span className="inline-flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                +1 次导出
              </span>
            ) : (
              <span className="inline-flex items-center text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                已达上限
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export const InviteCard: React.FC<InviteCardProps> = ({ inviteCode, baseUrl = '', stats, history = [], onCopied }) => {
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

      <div className="flex items-center justify-between rounded-2xl bg-white/70 border border-slate-100 px-4 py-3 mb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <UsersIcon className="w-4 h-4 text-slate-400" />
          已邀请 {s.invitedCount} 位好友
        </div>
        <div className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
          已获得 {s.bonusCount}/2 次免费导出
        </div>
      </div>

      {/* 获得奖励记录 */}
      <div className="mb-6">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5" />
          获得奖励记录
        </h4>
        <RewardHistory history={history} />
      </div>

      {/* 活动玩法说明（与首页保持一致） */}
      <div className="border-t border-slate-100 pt-5">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 text-center">
          玩法说明
        </h4>
        <InviteHowItWorks />
      </div>
    </div>
  );
};
