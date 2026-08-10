import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  FileText, 
  CreditCard, 
  User as UserIcon, 
  Settings, 
  Plus, 
  ChevronRight, 
  Star, 
  Clock, 
  CheckCircle2,
  Edit3,
  Edit2,
  Download,
  Trash2,
  Wallet
} from 'lucide-react';
import { cn } from '../lib/utils';
import { DashboardSection, User as AppUser } from '../types';
import { ResumeDocument, formatTimeAgo } from '../lib/supabaseService';
import { ClientOrder, ORDER_STATUS_TEXT } from '../lib/orderService';
import { PLANS } from '../constants';
import { SEO } from './SEO';

interface DashboardPageProps {
  user: any;
  appUser: AppUser | null;
  resumes: ResumeDocument[];
  orders: ClientOrder[];
  onNewResume: () => void;
  onEditResume: (id: string) => void;
  onDeleteResume: (id: string) => Promise<void>;
  onRenameResume: (id: string, newName: string) => Promise<void>;
  onGoToPayment: (planId: string) => void;
  onGoToTemplates: () => void;
  onTriggerUpgrade?: (reason?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  appUser,
  resumes,
  orders,
  onNewResume,
  onEditResume,
  onDeleteResume,
  onRenameResume,
  onGoToPayment,
  onGoToTemplates,
  onTriggerUpgrade
}) => {
  const [activeSection, setActiveSection] = useState<DashboardSection>('resumes');
  
  // States for rename and delete features
  const [editingResumeId, setEditingResumeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingResumeId, setDeletingResumeId] = useState<string | null>(null);

  const handleTriggerRename = (id: string, currentName: string) => {
    setEditingResumeId(id);
    setEditingName(currentName);
  };

  const handleSaveRename = async () => {
    if (editingResumeId && editingName.trim()) {
      await onRenameResume(editingResumeId, editingName.trim());
      setEditingResumeId(null);
      setEditingName('');
    }
  };

  const handleTriggerDelete = (id: string) => {
    setDeletingResumeId(id);
  };

  const handleConfirmDelete = async () => {
    if (deletingResumeId) {
      await onDeleteResume(deletingResumeId);
      setDeletingResumeId(null);
    }
  };

  const renderContent = () => {
    const resumeLimit = appUser?.tier === 'member' ? 30 : 5;
    const canCreateMoreResumes = resumes.length < resumeLimit;
    const handleLimitReached = () => {
      if (onTriggerUpgrade) {
        onTriggerUpgrade('limit');
      } else {
        alert(`您的简历版本数量已达到上限 (${resumeLimit})，请升级会员或删除部分简历。`);
      }
    };

    switch (activeSection) {
      case 'overview':
        return (
          <Overview 
            resumes={resumes} 
            orders={orders} 
            onNew={canCreateMoreResumes ? onGoToTemplates : handleLimitReached} 
            onEdit={onEditResume} 
            onRename={handleTriggerRename}
            onDelete={handleTriggerDelete}
            onManagePlan={() => setActiveSection('members')}
            appUser={appUser}
          />
        );
      case 'resumes':
        return (
          <ResumesView 
            resumes={resumes} 
            onNew={canCreateMoreResumes ? onGoToTemplates : handleLimitReached} 
            onEdit={onEditResume} 
            onRename={handleTriggerRename}
            onDelete={handleTriggerDelete}
            resumeLimit={resumeLimit}
          />
        );
      case 'members':
        return <MemberCenter appUser={appUser} onUpgrade={onGoToPayment} />;
      case 'orders':
        return <OrdersView orders={orders} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Clock className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-xs">即将上线</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen relative">
      <SEO
        title="个人中心 - 我的简历与会员"
        description="管理我的简历、查看订单记录与会员权益，随时续费升级，掌握求职进度。"
        keywords="壹页简历, 个人中心, 我的简历, 会员中心, 简历管理, 订单查询"
      />
      {/* Sidebar - Fixed on Desktop */}
      <aside className="lg:w-72 w-full lg:fixed lg:left-0 lg:top-24 lg:bottom-0 bg-white/40 backdrop-blur-xl border-r border-slate-100 lg:overflow-y-auto z-30">
        <div className="p-8 space-y-10">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4 group">
              <div className="absolute -inset-1 bg-gradient-to-r from-macaron-pink/20 to-blue-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-2xl overflow-hidden ring-4 ring-slate-50 transition-transform group-hover:rotate-3 group-hover:scale-105">
                <img 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <h3 className="font-display font-black text-slate-800 text-lg">壹页简历用户</h3>
            <p className="text-slate-400 text-xs font-medium mt-1">
              ID: {user?.uid ? `${user.uid.slice(0, 6)}...${user.uid.slice(-4)}` : '未登录'}
            </p>
            {appUser?.tier === 'member' ? (
              <span className="mt-3 px-3 py-1 bg-amber-50 rounded-full text-amber-600 text-[10px] font-black uppercase tracking-wider border border-amber-200/50 flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                尊享会员
              </span>
            ) : (
              <span className="mt-3 px-3 py-1 bg-slate-100 rounded-full text-slate-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                普通用户
              </span>
            )}
            {appUser?.tier === 'member' && appUser.memberUntil && (
              <p className="mt-1.5 text-[11px] text-slate-400 font-medium">
                {appUser.memberUntil.startsWith('2099')
                  ? '终身会员 · 永久有效'
                  : `会员有效期至 ${new Date(appUser.memberUntil).toLocaleDateString()}`}
              </p>
            )}
          </div>

          <div className="space-y-2">
            {[
              { id: 'resumes', label: '我的简历', icon: FileText },
              { id: 'members', label: '会员中心', icon: Star },
              { id: 'orders', label: '我的订单', icon: CreditCard },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as DashboardSection)}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 relative group",
                    isActive 
                      ? "text-blue-600 font-extrabold" 
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-blue-500" : "text-slate-400")} />
                  {item.label}
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-blue-50/50 -z-10 rounded-2xl border border-blue-100/50"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-72 min-h-screen">
        <div className="max-w-6xl mx-auto p-6 md:p-12 lg:p-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Modals for Rename and Delete actions */}
      <AnimatePresence>
        {editingResumeId && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 border border-slate-100"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-2">修改简历名称</h3>
              <p className="text-slate-400 text-xs mb-6Leading-relaxed">给当前这一版简历起一个清楚易辨识的名字吧。</p>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                placeholder="例如：高级开发工程师求职简历 2026"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100/50 focus:border-blue-300 outline-none transition-all text-sm mb-6 font-medium"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveRename();
                  }
                }}
              />
              <div className="flex gap-4">
                <button
                  onClick={() => { setEditingResumeId(null); setEditingName(''); }}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-[0.98]"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveRename}
                  disabled={!editingName.trim()}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  更新名称
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingResumeId && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 border border-slate-100"
            >
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6 border border-red-100/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">确认删除此简历？</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                此操作将从您的云端存储中彻底移除此份简历的所有内容与配置项，不可撤销。
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeletingResumeId(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-[0.98]"
                >
                  我在想想
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-red-100 active:bg-red-700"
                >
                  彻底删除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ResumesView: React.FC<{ 
  resumes: ResumeDocument[], 
  onNew: () => void, 
  onEdit: (id: string) => void, 
  onRename: (id: string, name: string) => void,
  onDelete: (id: string) => void,
  title?: string, 
  description?: string, 
  resumeLimit?: number 
}> = ({ resumes, onNew, onEdit, onRename, onDelete, title = "我的简历", description = "管理您的所有简历版本，随时进行编辑与导出。", resumeLimit = 5 }) => (
  <section className="space-y-8">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div className="space-y-2">
        <h2 className="text-4xl font-display font-bold text-slate-800">{title}</h2>
        <p className="text-slate-500 italic">{description}</p>
      </div>
      <div className="px-4 py-2 bg-slate-100 rounded-2xl flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">版本额度</span>
          <span className="text-sm font-bold text-slate-700">{resumes.length} / {resumeLimit}</span>
        </div>
        <div className="w-px h-8 bg-slate-200" />
        {resumes.length >= resumeLimit ? (
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">已达上限</span>
        ) : (
          <span className="text-[10px] font-black text-macaron-mint uppercase tracking-widest">额度充足</span>
        )}
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {resumes.map(resume => (
        <ResumeCard 
          key={resume.id} 
          resume={resume} 
          onClick={() => onEdit(resume.id)} 
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
      <button 
        onClick={onNew}
        className="border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4 hover:border-blue-200 hover:bg-blue-50/30 transition-all group min-h-[360px]"
      >
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
          <Plus className="w-8 h-8" />
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-700">开始制作新简历</p>
          <p className="text-xs text-slate-400 mt-1">定制最新版本简历</p>
        </div>
      </button>
    </div>
  </section>
);

const Overview: React.FC<{
  resumes: ResumeDocument[],
  orders: ClientOrder[],
  onNew: () => void,
  onEdit: (id: string) => void,
  onRename: (id: string, name: string) => void,
  onDelete: (id: string) => void,
  onManagePlan: () => void,
  appUser: AppUser | null
}> = ({ resumes, orders, onNew, onEdit, onRename, onDelete, onManagePlan, appUser }) => (
  <div className="space-y-16">
    {/* Member Banner */}
    <div className={cn(
      "rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden",
      appUser?.tier === 'member' ? "bg-[#101c2e]" : "bg-gradient-to-br from-slate-800 to-slate-900"
    )}>
      <div className="relative z-10 space-y-4">
        <h3 className="text-3xl font-bold font-display">
          {appUser?.tier === 'member' ? '会员权益生效中' : '升级尊享会员'}
        </h3>
        <p className="text-slate-300">
          {appUser?.tier === 'member' 
            ? `您的尊享会员订阅有效期至 ${appUser.memberUntil ? new Date(appUser.memberUntil).toLocaleDateString() : '永久'}。`
            : '解锁无限制导出、高级模板、ATS 检测等全部核心功能。'}
        </p>
        <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-macaron-mint" />
            ATS 兼容性检测
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-macaron-mint" />
            无限制下载
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-macaron-mint" />
            30 版简历管理
          </div>
        </div>
      </div>
      <button 
        onClick={onManagePlan}
        className={cn(
          "relative z-10 px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all text-[#101c2e]",
          appUser?.tier === 'member' ? "bg-macaron-mint" : "bg-white"
        )}
      >
        {appUser?.tier === 'member' ? '管理套餐' : '立即升级'}
      </button>
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
    </div>

    {/* Resumes Summary */}
    <ResumesView 
      resumes={resumes.slice(0, 2)} 
      onNew={onNew} 
      onEdit={onEdit} 
      onRename={onRename}
      onDelete={onDelete}
      title="最近编辑" 
      description="继续完善您的简历草稿。"
    />

    {/* Orders */}
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">最近订单</h2>
      </div>
      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-50">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm font-medium">
              暂无订单，去开通会员或购买导出吧。
            </div>
          ) : orders.slice(0, 3).map(order => (
            <div key={order.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-macaron-mint/30 rounded-xl flex items-center justify-center text-[#2d5a4c]">
                  {order.planType === 'single_export' ? <FileText className="w-6 h-6" /> : <Star className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{orderPlanName(order.planType)}</h4>
                  <p className="text-xs text-slate-400 font-medium">订单编号 {order.id} • {formatOrderDate(order.createdAt)}</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="font-black text-slate-900">¥{order.amount.toFixed(2)}</p>
                <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 ${ORDER_STATUS_STYLE[order.status].cls}`}>
                  {ORDER_STATUS_TEXT[order.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full py-4 bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-all border-t border-slate-100">
          查看所有订单
        </button>
      </div>
    </section>
  </div>
);

const ResumeCard: React.FC<{ 
  resume: ResumeDocument, 
  onClick: () => void,
  onRename: (id: string, name: string) => void,
  onDelete: (id: string) => void
}> = ({ resume, onClick, onRename, onDelete }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-2xl hover:shadow-slate-200 transition-all hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
    >
      <div className="p-4">
        <div className="aspect-[3/4] bg-slate-100 rounded-[1.5rem] relative overflow-hidden flex items-center justify-center">
          {/* Mock Preview Content */}
          <div className="absolute inset-0 p-4 space-y-2 scale-[0.3] origin-top-left opacity-30">
            <div className="w-1/2 h-8 bg-black rounded-lg" />
            <div className="w-3/4 h-4 bg-slate-400 rounded-full" />
            <div className="w-full h-4 bg-slate-300 rounded-full" />
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-square bg-slate-200 rounded-2xl" />
              <div className="space-y-2">
                <div className="w-full h-4 bg-slate-300 rounded-full" />
                <div className="w-full h-4 bg-slate-300 rounded-full" />
                <div className="w-1/2 h-4 bg-slate-300 rounded-full" />
              </div>
            </div>
            <div className="w-full h-40 bg-slate-50 rounded-3xl" />
          </div>

          <span className="text-slate-400 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
            点击进入编辑
          </span>

          {/* Tags */}
          <div className="absolute top-4 right-4 flex gap-2">
            {resume.status === 'new' && (
              <div className="px-3 py-1 bg-macaron-mint text-[#2d5a4c] rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                最新
              </div>
            )}
            {resume.status === 'draft' && (
              <div className="px-3 py-1 bg-slate-400 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                草稿
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="px-8 pb-8 space-y-4">
        <div>
          <div className="flex items-center gap-1.5 min-w-0 pr-1">
            <h4 className="font-bold text-slate-800 text-lg truncate" title={resume.name}>{resume.name}</h4>
            <button 
              onClick={(e) => { e.stopPropagation(); onRename(resume.id, resume.name); }}
              className="p-1 text-slate-400 hover:text-blue-500 transition-colors inline-flex items-center shrink-0 cursor-pointer"
              title="重命名简历"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">{formatTimeAgo(resume.updatedAt)}</p>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">评分</span>
            <span className="text-xl font-display font-black text-slate-900">{resume.score}</span>
          </div>
          <div className="flex gap-1">
             <button 
               onClick={(e) => { e.stopPropagation(); onDelete(resume.id); }}
               className="p-2 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
               title="删除简历"
             >
              <Trash2 className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrdersView: React.FC<{ orders: ClientOrder[] }> = ({ orders }) => (
  <div className="space-y-8">
     <div className="space-y-2">
      <h2 className="text-4xl font-display font-bold">我的订单</h2>
      <p className="text-slate-500 italic">查看您的所有消费记录与服务详情。</p>
    </div>

    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50">
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">项目</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">订单号</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">日期</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">金额</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">状态</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {orders.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-8 py-16 text-center text-slate-400 text-sm font-medium">
                暂无订单记录，去开通会员或购买导出吧。
              </td>
            </tr>
          ) : orders.map(order => {
            const style = ORDER_STATUS_STYLE[order.status];
            return (
              <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6">
                  <span className="font-bold text-slate-800">{orderPlanName(order.planType)}</span>
                </td>
                <td className="px-8 py-6">
                  <span className="text-sm font-medium text-slate-500 font-mono">{order.id}</span>
                </td>
                <td className="px-8 py-6">
                  <span className="text-sm font-medium text-slate-500">{formatOrderDate(order.createdAt)}</span>
                </td>
                <td className="px-8 py-6 text-right">
                  <span className="font-black text-slate-900">¥{order.amount.toFixed(2)}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center justify-center">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${style.cls}`}>
                      {style.text}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

const MemberCenter: React.FC<{ onUpgrade: (id: string) => void, appUser: AppUser | null }> = ({ onUpgrade, appUser }) => (
  <div className="space-y-12">
    <div className="space-y-4">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
        <Star className="w-3 h-3 fill-current" />
        会员中心
      </div>
      <h2 className="text-4xl font-display font-bold">
        {appUser?.tier === 'member' ? '尊享会员 · 权益中心' : '开启更优职场旅程'}
      </h2>
      <p className="text-slate-500 max-w-2xl italic text-lg leading-relaxed">
        {appUser?.tier === 'member' 
          ? '您已解锁全部高级功能，壹页简历为您提供最专业的求职助力。' 
          : '升级到尊享会员，解锁专家顾问润色、简历打分、高级模板等特权，助您在职场脱颖而出。'}
      </p>
    </div>

    {/* Current Plan Card - More Prominent Style */}
    <div className="bg-gradient-to-br from-slate-900 via-[#1a2b45] to-slate-900 rounded-[3rem] p-1 scale-[1.02] shadow-[0_32px_64px_-12px_rgba(16,28,46,0.3)]">
      <div className="bg-white/5 backdrop-blur-3xl rounded-[2.9rem] p-12 relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-macaron-mint text-[#0f3429] rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-macaron-mint/20 border border-white/20">
                  {appUser?.tier === 'member' ? '当前生效套餐' : '可解锁方案'}
                </span>
                {appUser?.tier === 'member' && <span className="flex h-2 w-2 rounded-full bg-macaron-mint animate-pulse" />}
              </div>
              <div className="space-y-1">
                <h3 className="text-6xl font-black text-white tracking-tighter">
                  {appUser?.tier === 'member' ? '年度尊享会员' : '壹页简历尊享版'}
                </h3>
                <p className="text-blue-200/60 font-medium text-lg">
                  {appUser?.tier === 'member' 
                    ? `全功能解锁 · ${appUser.memberUntil ? new Date(appUser.memberUntil).toLocaleDateString() : '永久'} 到期` 
                    : '专业模板 · 无限导出 · ATS检测'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5">
               {[
                 "无限次简历无水印 PDF 导出",
                 "ATS 兼容性检测与深度评分",
                 "解锁所有 500+ 套精选高级模板",
                 "30 个简历版本管理，云端极速同步"
               ].map((feature, i) => (
                 <div key={i} className="flex items-center gap-4 text-slate-200 font-bold group">
                   <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-macaron-mint group-hover:bg-macaron-mint group-hover:text-[#101c2e] transition-all border border-white/5">
                     <CheckCircle2 className="w-5 h-5" />
                   </div>
                   <span className="text-base">{feature}</span>
                 </div>
               ))}
            </div>
          </div>
          <div className="bg-white rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center space-y-8 shadow-2xl shadow-black/20">
            <div className="space-y-3">
              <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">会员价格方案</p>
              <div className="flex flex-col items-center">
                <div className="flex items-baseline gap-3">
                  <span className="text-slate-300 line-through text-2xl font-bold">¥299</span>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-black text-slate-900">¥</span>
                    <span className="text-7xl font-black text-slate-900 tracking-tighter">99</span>
                  </div>
                </div>
                <span className="text-slate-400 font-bold mt-1">年度订阅 / 省 ¥200</span>
              </div>
            </div>
            <button 
              onClick={() => onUpgrade('year')}
              className="w-full py-6 bg-slate-900 text-white rounded-[1.5rem] font-black text-xl hover:scale-[1.03] active:scale-95 transition-all shadow-2xl shadow-slate-200 hover:shadow-macaron-mint/20"
            >
              {appUser?.tier === 'member' ? '续费或升级' : '立即开通会员'}
            </button>
            <div className="flex items-center gap-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
              <CheckCircle2 className="w-4 h-4 text-macaron-mint" /> 支付成功后立即生效
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-macaron-mint/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)] pointer-events-none" />
      </div>
    </div>

    {/* Pricing Toggle View Mockup */}
    <div className="py-20 text-center space-y-12">
      <h3 className="text-2xl font-bold text-slate-800">对比所有方案</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto">
        <PlanPreview title="基础版" price="免费" features={["1 份简易模板", "实时预览"]} />
        <PlanPreview title="季度会员" price="¥49" features={["无限模板", "内容优化", "PDF 导出"]} highlight onSelect={() => onUpgrade('quarter')} />
        <PlanPreview title="年度尊享" price="¥144" features={["所有高级功能", "1对1咨询折扣", "优先支持"]} onSelect={() => onUpgrade('year')} />
      </div>
    </div>
  </div>
);

const PlanPreview: React.FC<{ title: string, price: string, features: string[], highlight?: boolean, onSelect?: () => void }> = ({ title, price, features, highlight, onSelect }) => (
  <div className={cn(
    "p-8 rounded-[2rem] border transition-all relative overflow-hidden group",
    highlight ? "border-blue-200 bg-blue-50/50 shadow-xl" : "border-slate-100 bg-white"
  )}>
    <h4 className="font-bold text-lg mb-2">{title}</h4>
    <div className="flex items-baseline gap-1 mb-8">
      <span className="text-3xl font-black">{price}</span>
      {price !== '免费' && <span className="text-slate-400 font-bold text-sm">/期</span>}
    </div>
    <div className="space-y-3 mb-8">
      {features.map((f, i) => (
        <div key={i} className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <CheckCircle2 className="w-4 h-4 text-blue-500" />
          {f}
        </div>
      ))}
    </div>
    {price !== '免费' && (
      <button
        onClick={onSelect}
        className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:scale-105 transition-all"
      >
        立即购买
      </button>
    )}
  </div>
);

/** 订单状态 → 徽章样式 */
const ORDER_STATUS_STYLE: Record<ClientOrder['status'], { text: string; cls: string }> = {
  pending: { text: '待支付', cls: 'bg-amber-50 text-amber-600' },
  paid: { text: '已支付', cls: 'bg-blue-50 text-blue-600' },
  completed: { text: '已完成', cls: 'bg-macaron-mint/30 text-[#2d5a4c]' },
  expired: { text: '已过期', cls: 'bg-slate-100 text-slate-500' },
  cancelled: { text: '已取消', cls: 'bg-slate-100 text-slate-400' },
};

/** 订单方案类型 → 展示名（优先读取真实 PLANS，找不到时回退到通用文案） */
const orderPlanName = (planType: string): string =>
  PLANS.find((p) => p.type === planType)?.name || '服务订单';

/** ISO 时间 → YYYY年M月D日 */
const formatOrderDate = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};
