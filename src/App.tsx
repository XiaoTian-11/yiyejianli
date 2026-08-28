import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { Download, FileText, Layout, Eye, Settings2, Github, Award, Menu, X, LogOut, User as UserIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { generateResumePDF, downloadBlob } from './lib/pdfExport';
import logo from './assets/logo.svg';
import { ResumeEditor } from './components/ResumeEditor';
import { ResumePreview } from './components/ResumePreview';
import { ResumeScoring } from './components/ResumeScoring';
import { SEO } from './components/SEO';
import { AuthModal } from './components/AuthModal';
import { UpgradeModal } from './components/UpgradeModal';
import { ExportModal } from './components/ExportModal';
import { ExportConfirmModal } from './components/ExportConfirmModal';
import { LeaveConfirmModal } from './components/LeaveConfirmModal';
import { AgreementModal } from './components/AgreementModal';
import { auth, onAuthStateChanged, signOut } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import { saveResume, getResume, getResumesList, saveResumeWithId, deleteResume, renameResume, createNewResume, ResumeDocument } from './lib/supabaseService';
import { getUser, checkAndDowngrade, updateUser } from './lib/supabaseUserService';
import { getMyOrders, ClientOrder } from './lib/orderService';
import { getOauthUrl, getCachedOpenid, saveOpenidCache } from './lib/paymentApi';
import { DashboardPage } from './components/DashboardPage';
import { PaymentPage } from './components/PaymentPage';
import { LandingPage } from './pages/LandingPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { PricingPage } from './pages/PricingPage';
import { INITIAL_DATA } from './constants';
import { INDUSTRY_SAMPLES, TEMPLATE_INDUSTRY_MAP } from './constants/industrySamples';
import { ResumeData, TemplateId, Page, User as AppUser, PlanType } from './types';
import { cn } from './lib/utils';
import { getPlanByType, calculateRenewedMemberUntil, deriveCurrentPlan } from './lib/pricing';
import { PAGE_PATH, isProtectedPath } from './lib/routes';
import { motion, AnimatePresence } from 'motion/react';

// Removed local Page type definition

interface AuthGateProps {
  authLoading: boolean;
  user: User | any | null;
  currentPath: string;
  onRequestLogin: (path?: string) => void;
  children: React.ReactNode;
}

/**
 * 受保护页面守卫：未登录访问时自动弹一次登录框（同路径只提示一次），
 * 显示占位牌；登录成功后由 onAuthStateChanged 跳回目标页。
 * authLoading 为 true 时（会话仍在恢复）不触发提示，避免误弹。
 */
const AuthGate: React.FC<AuthGateProps> = ({ authLoading, user, currentPath, onRequestLogin, children }) => {
  const promptedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (currentPath === promptedPathRef.current) return; // 同路径只提示一次
    promptedPathRef.current = currentPath;
    if (!user) onRequestLogin(currentPath);
  }, [authLoading, user, currentPath]);

  if (authLoading) {
    return (
      <div className="py-40 text-center text-slate-400 text-sm font-bold">
        正在验证登录状态...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-40 text-center">
        <p className="text-slate-500 text-sm font-bold mb-4">此页面需要登录后访问</p>
        <button
          onClick={() => onRequestLogin(currentPath)}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200"
        >
          立即登录
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  // authLoading 兜底首帧竞态：user 异步加载期间，守卫须先等它变为 false，
  // 否则已登录用户刷新 /dashboard 会被误判为未登录而误弹登录框
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedLandingTemplate, setSelectedLandingTemplate] = useState<TemplateId | undefined>(undefined);
  const [data, setData] = useState<ResumeData>(INITIAL_DATA);
  const [templateId, setTemplateId] = useState<TemplateId>('modern');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | any>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  // 当前生效的会员套餐（从最近一笔已完成的订阅订单推导），用于定价页精确标记“当前持有”
  const [currentPlan, setCurrentPlan] = useState<PlanType | undefined>(undefined);
  const pendingLoginRedirect = useRef<string | null>(null);
  // 未登录用户在模板中心选中模板时先记住模板 id，登录成功后自动应用该模板进入编辑器
  const pendingTemplateId = useRef<TemplateId | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('month');
  const [showScoring, setShowScoring] = useState(false);
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string>('templates');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  // 次费用户导出前的二次确认弹窗（点「继续导出」才扣配额并打印）
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
  // 离开编辑器二次确认弹窗（仅当有未落盘改动时出现）
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  // 待执行的离开动作（「保存并离开」/「不保存离开」后执行）
  const leaveActionRef = useRef<{ type: 'navigate'; to: string } | { type: 'signout' } | null>(null);
  // 切换简历时待切换的目标简历 id（确认保存后切换过去）
  const pendingResumeIdRef = useRef<string | null>(null);
  // 是否有未落盘改动（data 与 lastSavedDataRef 不一致）
  const hasUnsavedRef = useRef(false);
  // 自动保存防抖 timer（弹离开确认框时取消，避免确认期间自动保存丢弃的改动）
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [agreementInitialTab, setAgreementInitialTab] = useState<'service' | 'privacy'>('service');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  // 模板中心点"立即使用"→ 创建简历并进入编辑器期间的全屏 loading（建单是网络请求，给用户即时反馈）
  const [creatingResume, setCreatingResume] = useState(false);

  const openAgreement = (tab: 'service' | 'privacy', e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setAgreementInitialTab(tab);
    setIsAgreementModalOpen(true);
  };

  const triggerUpgrade = (reason: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setUpgradeReason(reason);
    setIsUpgradeModalOpen(true);
  };

  const refreshResumesList = async (uId: string) => {
    try {
      const list = await getResumesList(uId);
      setResumes(list);
      return list;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const refreshOrders = async (uId: string) => {
    const list = await getMyOrders(uId);
    setOrders(list);
    return list;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // 规范化 Supabase User：添加 uid 别名兼容旧代码
        const normalizedUser: any = { ...currentUser, uid: currentUser.id };
        setUser(normalizedUser);
        // 会话已恢复即放行守卫（authLoading 只代表"会话是否就绪"，不等待数据加载，
        // 否则 checkAndDowngrade 提前 return 时 authLoading 会卡在 true 导致受保护页面白屏）
        setAuthLoading(false);
        // 登录后统一跳转：跳回访问的目标页（pendingLoginRedirect） / 应用模板进编辑器（pendingTemplateId）。
        // 必须在 checkedUser 提前 return 之前也执行——否则 users 表有记录（checkedUser 存在）时
        // 登录后不跳转、停留原页（复现：模板中心点模板 → 登录 → 没进编辑器）。
        const handlePostLoginJump = () => {
          if (pendingLoginRedirect.current) {
            navigate(pendingLoginRedirect.current);
            pendingLoginRedirect.current = null;
          }
          if (pendingTemplateId.current) {
            const tid = pendingTemplateId.current;
            pendingTemplateId.current = null;
            void applyTemplateAndEnter(tid, normalizedUser.uid);
          }
        };
        // Load list and set active
        const list = await refreshResumesList(normalizedUser.uid);
        refreshOrders(normalizedUser.uid);
        if (list.length > 0) {
          setActiveResumeId(list[0].id);
          setData(list[0].data);
          lastSavedDataRef.current = JSON.stringify(list[0].data);
        } else {
          setActiveResumeId(null);
          setData(INITIAL_DATA);
          lastSavedDataRef.current = JSON.stringify(INITIAL_DATA);
        }

        // 从 Supabase users 表读取会员信息，表不存在时降级为默认值
        try {
          const { user: userData, error } = await getUser(normalizedUser.uid);
          if (userData && !error) {
            // 账户已被管理员禁用：自动登出并提示
            if (userData.status === 'disabled') {
              alert('您的账户已被管理员禁用，无法继续使用平台。如有疑问请联系客服。');
              signOut(auth);
              return;
            }
            // 检查会员是否过期
            const { user: checkedUser, downgraded } = await checkAndDowngrade(normalizedUser.uid);
            if (checkedUser) {
              setAppUser({
                ...checkedUser,
                email: currentUser.email || checkedUser.email,
              });
              if (downgraded) {
                console.log('Membership expired, auto-downgraded to free');
              }
              handlePostLoginJump();
              return;
            }
          }
        } catch (e) {
          console.warn('Failed to load user tier from Supabase, using defaults:', e);
        }

        // 降级方案：users 表不存在或查询失败时使用默认值
        setAppUser({
          id: normalizedUser.uid,
          email: currentUser.email || 'user@example.com',
          tier: 'free',
          remainingPdfExports: 0,
          remainingPngExports: 0,
          remainingAtsChecks: 0,
        });

        handlePostLoginJump();
      } else {
        setUser(null);
        setAppUser(null);
        setResumes([]);
        setOrders([]);
        setActiveResumeId(null);
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 微信内"进站预授权"：首次进入时提前静默授权拿 openid 并缓存，
  // 之后点"立即支付"直接用缓存 openid 调起，无需在付款关键步骤再跳授权。
  // 只在微信内置浏览器 + 已登录（拿到 uid 才有缓存意义）+ 未缓存 openid 时触发一次；
  // 预授权回跳（state=pre:）带 openid，这里只存缓存不触发支付。
  const preauthStartedRef = useRef(false);
  useEffect(() => {
    if (preauthStartedRef.current) return;
    const ua = navigator.userAgent;
    if (!/MicroMessenger/i.test(ua)) return;
    if (authLoading) return;
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const uid = user.uid || user.id;
    const openidInUrl = params.get('openid');
    const isPreauthReturn = params.get('openid') && params.get('p') !== null;
    if (openidInUrl) {
      // 预授权回跳：存缓存；若恰好是支付页且有 plan 参数，则交给支付组件处理
      saveOpenidCache(openidInUrl, uid);
    }
    if (isPreauthReturn) {
      // 预授权回跳完成：清理 URL 上的 openid/p 残留
      const url = new URL(window.location.href);
      url.searchParams.delete('openid');
      url.searchParams.delete('p');
      window.history.replaceState({}, '', url.toString());
    }
    if (getCachedOpenid(uid)) return; // 已有缓存（含本次回跳刚存的），无需再预授权
    preauthStartedRef.current = true;
    const current = location.pathname + location.search;
    const back = current.startsWith('/') ? current : '/';
    getOauthUrl(undefined, back)
      .then((oauthUrl) => {
        window.location.href = oauthUrl;
      })
      .catch((err) => {
        console.warn('预授权获取地址失败，跳过（支付时可再授权）:', err);
        preauthStartedRef.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, location.pathname, location.search]);

  // 依据订单与会员状态推导当前生效套餐：
  // 会员有效（tier=member）时取最近一笔已完成的订阅订单作为“当前持有”套餐，
  // 避免定价页把未购买的季卡/年卡/终身卡/学生年卡也误标为“当前持有”。
  useEffect(() => {
    setCurrentPlan(deriveCurrentPlan(orders, appUser?.tier || 'guest'));
  }, [orders, appUser]);

  const handleSignOut = () => {
    signOut(auth).then(() => {
      setResumes([]);
      setActiveResumeId(null);
      navigate('/');
      setIsAuthModalOpen(false);
    });
  };

  // 统一离开入口：若当前编辑器有未落盘改动，弹确认框；否则直接执行动作。
  const requestLeave = (action: { type: 'navigate'; to: string } | { type: 'signout' }) => {
    if (hasUnsavedRef.current && activeResumeId) {
      // 取消未决的自动保存 timer，避免确认框打开期间把要丢弃的改动自动存库
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      leaveActionRef.current = action;
      setIsLeaveConfirmOpen(true);
      return;
    }
    doLeave(action);
  };

  // 执行实际离开动作（保存/不保存确认后，或无未保存改动时直接调用）
  const doLeave = (action: { type: 'navigate'; to: string } | { type: 'signout' }) => {
    if (action.type === 'signout') {
      handleSignOut();
    } else {
      navigate(action.to);
    }
  };

  // 「保存并离开」：先立即保存，再执行待办动作（可能是切换简历）
  const onLeaveSave = async () => {
    setIsLeaveConfirmOpen(false);
    // 传入当前 data，确保保存的是最新改动（不用等 dataRef 异步同步）
    await performSave(data);
    // 若是切换简历：保存当前后切到目标简历
    if (pendingResumeIdRef.current) {
      const targetId = pendingResumeIdRef.current;
      pendingResumeIdRef.current = null;
      const res = resumes.find(r => r.id === targetId);
      if (res) {
        setActiveResumeId(targetId);
        setData(res.data);
        setTemplateId(res.templateId || 'modern');
        lastSavedDataRef.current = JSON.stringify(res.data);
        hasUnsavedRef.current = false;
      }
      return; // 已在 builder，无需额外 navigate
    }
    const a = leaveActionRef.current;
    leaveActionRef.current = null;
    if (a) doLeave(a);
  };

  // 「不保存离开」：恢复最后已保存版本（丢弃本次改动），再执行待办动作
  const onLeaveDiscard = () => {
    setIsLeaveConfirmOpen(false);
    // 若是切换简历：直接切到目标简历，当前改动丢弃
    if (pendingResumeIdRef.current) {
      const targetId = pendingResumeIdRef.current;
      pendingResumeIdRef.current = null;
      const res = resumes.find(r => r.id === targetId);
      if (res) {
        setActiveResumeId(targetId);
        setData(res.data);
        setTemplateId(res.templateId || 'modern');
        lastSavedDataRef.current = JSON.stringify(res.data);
        hasUnsavedRef.current = false;
      }
      return;
    }
    const res = resumes.find(r => r.id === activeResumeId);
    if (res) {
      setData(res.data);
      lastSavedDataRef.current = JSON.stringify(res.data);
    }
    hasUnsavedRef.current = false;
    const a = leaveActionRef.current;
    leaveActionRef.current = null;
    if (a) doLeave(a);
  };

  // Use a ref to track the last saved data to prevent infinite loops if loading triggers a save
  const lastSavedDataRef = useRef<string>('');

  // 最新 data 的镜像：防抖 timer 回调 / cleanup flush 时从这里读，
  // 避免闭包捕获旧的 data
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);
  // 卸载后不再 setSaveStatus（React 18+ 不警告，但避免无意义更新）。
  // mount 时必须重置回 true：StrictMode 双挂载会先跑一次 cleanup（置 false），
  // 第二次 mount 若不重置，mountedRef 永远为 false，saveStatus 永远不会更新。
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // 执行保存：内容与上次落盘一致则跳过；先占位 lastSavedDataRef 防并发重复保存。
  // overrideData 供「保存并离开」等需要立即保存当前最新 data 的场景传入。
  const performSave = async (overrideData?: ResumeData) => {
    const uid = user?.uid;
    const rid = activeResumeId;
    if (!uid || !rid) return;
    const dataToSave = overrideData || dataRef.current;
    const dataStr = JSON.stringify(dataToSave);
    if (dataStr === lastSavedDataRef.current) return;
    lastSavedDataRef.current = dataStr;
    if (mountedRef.current) setSaveStatus('saving');
    try {
      const activeResume = resumes.find(r => r.id === rid);
      const name = activeResume ? activeResume.name : '我的简历';
      const score = activeResume ? activeResume.score : 85;
      const status = activeResume ? activeResume.status : 'draft';

      await saveResumeWithId(uid, rid, name, dataToSave, score, status, templateId);

      // Update local list
      setResumes(prev => prev.map(r => r.id === rid ? { ...r, data: dataToSave, templateId, updatedAt: new Date().toISOString() } : r));

      hasUnsavedRef.current = false;
      if (mountedRef.current) {
        setSaveStatus('saved');
        setTimeout(() => { if (mountedRef.current) setSaveStatus('idle'); }, 2000);
      }
    } catch (err) {
      if (mountedRef.current) setSaveStatus('error');
      // 失败则放行下次重试
      lastSavedDataRef.current = '';
      hasUnsavedRef.current = true;
    }
  };

  useEffect(() => {
    if (!user || !activeResumeId) return;

    const dataStr = JSON.stringify(data);
    if (dataStr === lastSavedDataRef.current) {
      hasUnsavedRef.current = false;
      return;
    }
    // 有未落盘改动：标记待确认，1 秒防抖自动保存
    hasUnsavedRef.current = true;
    const timer = setTimeout(performSave, 1000);
    // 记录 timer，供「离开确认弹窗」打开时取消（避免确认期间自动保存把要丢弃的改动存进去）
    autoSaveTimerRef.current = timer;

    return () => {
      clearTimeout(timer);
      if (autoSaveTimerRef.current === timer) autoSaveTimerRef.current = null;
      // 离开编辑器/切换简历时的保存由「离开确认弹窗」控制（requestLeave），
      // 这里不再自动 flush，避免静默保存未确认的改动。
    };
  }, [data, user, activeResumeId]);

  // 浏览器刷新/关闭标签页兜底：有未落盘改动时提示（无法完全拦截，仅警告）
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const handleEditResume = (id: string) => {
    const res = resumes.find(r => r.id === id);
    if (res) {
      // 切换简历：若当前有未落盘改动且目标简历不同 → 先确认
      if (hasUnsavedRef.current && activeResumeId && activeResumeId !== id) {
        // 取消未决的自动保存 timer
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
          autoSaveTimerRef.current = null;
        }
        leaveActionRef.current = { type: 'navigate', to: PAGE_PATH.builder };
        setIsLeaveConfirmOpen(true);
        // 保存后 handleEditResume 需重新以 id 为目标——用 pendingResumeIdRef 记录
        pendingResumeIdRef.current = id;
        return;
      }
      setActiveResumeId(id);
      setData(res.data);
      setTemplateId(res.templateId || 'modern');
      lastSavedDataRef.current = JSON.stringify(res.data);
      hasUnsavedRef.current = false;
      navigate(PAGE_PATH.builder);
    }
  };

  const handleRenameResume = async (id: string, newName: string) => {
    if (!user) return;
    try {
      await renameResume(user.uid, id, newName);
      await refreshResumesList(user.uid);
    } catch (err) {
      console.error('Failed to rename resume:', err);
    }
  };

  const handleDeleteResume = async (id: string) => {
    if (!user) return;
    try {
      await deleteResume(user.uid, id);
      const list = await refreshResumesList(user.uid);
      
      // If deleted resume was active, load another one
      if (activeResumeId === id) {
        if (list.length > 0) {
          setActiveResumeId(list[0].id);
          setData(list[0].data);
          lastSavedDataRef.current = JSON.stringify(list[0].data);
        } else {
          setActiveResumeId(null);
          setData(INITIAL_DATA);
          lastSavedDataRef.current = JSON.stringify(INITIAL_DATA);
        }
      }
    } catch (err) {
      console.error('Failed to delete resume:', err);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const componentRef = useRef<HTMLDivElement>(null);

  // PDF 导出：前端截图生成 PDF 文件直接下载（html-to-image + jspdf）。
  // 不依赖浏览器打印对话框 → 微信内置浏览器也能直接下载/打开 PDF，
  // 且不受「切换纸张大小」影响（固定 A4）。
  const generateAndDownloadPDF = async (): Promise<void> => {
    setExporting(true);
    setExportMessage('');
    setExportError(null);
    try {
      // 收集所有简历页节点（ResumePreview 的多页 .resume-print-page）
      const pageEls = Array.from(document.querySelectorAll<HTMLElement>('.resume-print-page'));
      if (pageEls.length === 0) {
        setExportError('预览未就绪，请切换到预览页后重试');
        setExporting(false);
        return;
      }
      const { blob } = await generateResumePDF(pageEls);
      const name = (data.personalInfo.fullName || 'Resume').trim() || 'Resume';
      downloadBlob(blob, `${name}_简历.pdf`);
      setExportMessage('PDF 已生成，请查看下载');
    } catch (err) {
      console.error('导出 PDF 失败:', err);
      setExportError('导出失败，请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  // 导出前先确保预览节点已挂载：手机编辑态预览列 hidden 时 .resume-print-page 不存在，
  // 先切到预览，等一帧再导出（沿用原「预览未就绪自动重试」逻辑）
  const tryExportPDF = () => {
    if (!document.querySelector('.resume-print-page')) {
      setExportError(null);
      setExportMessage(null);
      setActiveTab('preview');
      setTimeout(() => {
        if (document.querySelector('.resume-print-page')) {
          void generateAndDownloadPDF();
        } else {
          setExportError('预览未就绪，请切换到预览页后重试');
        }
      }, 300);
      return;
    }
    void generateAndDownloadPDF();
  };

  // 扣 1 次导出配额并触发导出。仅在用户于确认弹窗点「继续导出」或支付成功后自动导出时调用。
  // 注意：截图生成 PDF 是可感知完成的操作，若失败不扣（成功才扣，公平且避免资损）。
  const consumeQuotaAndExport = () => {
    const newQuota = (appUser?.remainingPdfExports ?? 0) - 1;
    setAppUser(prev => prev ? { ...prev, remainingPdfExports: newQuota } : prev);
    // 配额消耗持久化到 users 表，刷新后不丢失
    void updateUser(user!.uid, { remaining_pdf_exports: newQuota });
    tryExportPDF();
  };

  const handlePurchaseSuccess = async (planType: string) => {
    if (!user) return;
    const uid = user.uid || user.id;

    // 乐观更新 UI：单次导出 +1 次配额；订阅则升级为会员
    if (planType === 'single_export') {
      setAppUser(prev => prev ? {
        ...prev,
        remainingPdfExports: (prev.remainingPdfExports || 0) + 1,
      } : prev);
      setIsExportModalOpen(false);
      setTimeout(() => {
        tryExportPDF();
      }, 500);
    } else {
      setAppUser(prev => prev ? {
        ...prev,
        tier: 'member',
        memberUntil: calculateRenewedMemberUntil(planType, prev.memberUntil),
        remainingPdfExports: 999,
      } : prev);
      setIsExportModalOpen(false);
    }

    // 从服务端拉取权威用户数据（支付回调 completeOrder 已写入 users 表），
    // 避免本地状态与服务端不一致导致刷新后权益丢失
    const { user: fresh } = await getUser(uid);
    if (fresh) setAppUser({ ...fresh, email: user.email || fresh.email });
    // 刷新"我的订单"列表
    refreshOrders(uid);
  };

  // 自动保存状态徽章：预览列 header 与编辑列 header（手机编辑态预览列隐藏，
  // 编辑列也需可见）共用同一渲染。
  const SaveStatusBadge = ({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) => (
    status === 'idle' ? null : (
      <div className={cn(
        "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-all",
        status === 'saving' && "text-blue-500 animate-pulse",
        status === 'saved' && "text-green-500",
        status === 'error' && "text-red-500"
      )}>
        {status === 'saving' && '正在保存...'}
        {status === 'saved' && '已保存'}
        {status === 'error' && '保存失败'}
      </div>
    )
  );

  const NavLink = ({ page, label }: { page: Page; label: string }) => {
    const active = pathname === PAGE_PATH[page];
    return (
      <button
        onClick={() => {
          setSelectedLandingTemplate(undefined);
          navigate(PAGE_PATH[page]);
          setMobileMenuOpen(false);
        }}
        className={cn(
          "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 relative group",
          active
            ? "text-blue-600"
            : "text-slate-500 hover:text-slate-900"
        )}
      >
        {label}
        {active && (
          <motion.div
            layoutId="nav-pill"
            className="absolute inset-0 bg-blue-50/50 -z-10 rounded-xl border border-blue-100"
          />
        )}
      </button>
    );
  };

  // 未登录访问受保护页面时：记录要跳回的目标路径并弹出登录框，登录成功后由
  // onAuthStateChanged 统一跳转（单一出口，避免登录成功瞬间 onClose 与 user 竞态）
  const requestLogin = (redirectTo?: string, opts?: { keepPendingTemplate?: boolean }) => {
    if (redirectTo && isProtectedPath(redirectTo)) {
      pendingLoginRedirect.current = redirectTo;
    }
    // 非“模板中心选模板”发起的登录会覆盖之前遗留的“登录后应用模板”意图，
    // 避免用户登录后误入编辑器并意外新建简历；模板选择流程需显式保留
    if (!opts?.keepPendingTemplate) {
      pendingTemplateId.current = null;
    }
    setIsAuthModalOpen(true);
  };

  // 模板页选中模板 → 创建简历并进入编辑器
  const handleTemplateSelect = async (id: TemplateId) => {
    // 未登录时：记住所选模板并弹登录框；登录成功后由 onAuthStateChanged 统一
    // 执行“应用该模板 → 创建简历 → 进入编辑器”，避免“点了没反应”
    if (!user) {
      pendingTemplateId.current = id;
      requestLogin(PAGE_PATH.builder, { keepPendingTemplate: true });
      return;
    }
    try {
      await applyTemplateAndEnter(id, user.uid);
    } catch (overallErr) {
      console.error("Error during template selection:", overallErr);
    }
  };

  // 应用所选模板：创建简历并进入编辑器（登录后 / 直接点击共用）
  const applyTemplateAndEnter = async (id: TemplateId, uid: string) => {
    setTemplateId(id);
    setCreatingResume(true);

    const templateNames: Record<string, string> = {
      modern: '现代简约简历',
      classic: '经典学术简历',
      minimal: '极简创意简历',
      executive: '大厂高通过率简历',
      student: '应届生校招简历',
      tech_focused: '开源极客简历',
      finance_elite: '金融精英简历',
      medical_academic: '医疗科研简历',
      creative_designer: '创意视觉设计简历',
      engineering_tech: '工程建设大厂简历'
    };
    const newName = `${templateNames[id] || '求职简历'}_${new Date().toLocaleDateString('zh-CN', {month:'numeric', day:'numeric'})}`;

    const industryKey = TEMPLATE_INDUSTRY_MAP[id] || 'product';
    const initialIndustryData = INDUSTRY_SAMPLES[industryKey]?.data || INITIAL_DATA;

    // createNewResume 失败时兜底为本地临时 id，保证编辑/保存流程不中断
    let newId = '';
    try {
      newId = await createNewResume(uid, newName, id, initialIndustryData);
    } catch (err) {
      console.error("Failed to create resume in storage", err);
    }
    if (!newId) {
      newId = 'temp_' + Math.random().toString(36).substring(2, 9) + '_' + uid;
    }

    setActiveResumeId(newId);
    setData(initialIndustryData);
    lastSavedDataRef.current = JSON.stringify(initialIndustryData);

    // 立即进入编辑器，不再阻塞等待列表刷新——此前 createNewResume + refreshResumesList
    // 两次串行网络请求让跳转变慢；列表改后台异步刷新，减少一次网络往返
    navigate(PAGE_PATH.builder);
    setCreatingResume(false);
    refreshResumesList(uid);
  };

  // 定价页选中方案 → 跳转支付页
  const handleSelectPlan = (id: string) => {
    if (!user) {
      requestLogin(PAGE_PATH.payment);
      return;
    }
    setSelectedPlanId(id);
    navigate(PAGE_PATH.payment);
  };

  // OAuth 授权回跳是整页刷新（微信内从 open.weixin.qq.com 回来），selectedPlanId 状态会丢失、
  // 重置为默认 'month'。URL 上的 ?plan= 才是权威来源（服务端从 state 还原），此处同步回状态，
  // 保证 /payment 上的套餐与自动支付、激活会员用的套餐一致。
  useEffect(() => {
    if (location.pathname !== PAGE_PATH.payment) return;
    const planParam = new URLSearchParams(location.search).get('plan');
    if (planParam && getPlanByType(planParam as any)) {
      setSelectedPlanId(planParam);
    }
  }, [location.pathname, location.search]);

  // 路由切换时回到页面顶部（模拟传统多页跳转体验）
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // 直接访问 /builder（URL 直达/刷新）且已登录但没有简历时，自动创建一份草稿，
  // 否则编辑器里的内容因缺少简历 id 而无法保存。依赖 authLoading 保证在会话恢复
  // 完成（activeResumeId 已定）后才判断，避免与简历列表加载产生竞态。
  useEffect(() => {
    if (authLoading || !user || activeResumeId || location.pathname !== PAGE_PATH.builder) return;
    let cancelled = false;
    const create = async () => {
      try {
        const newId = await createNewResume(user.uid, '我的简历', 'modern', data);
        if (cancelled) return;
        setActiveResumeId(newId);
      } catch (err) {
        console.error('Failed to auto-create resume:', err);
      }
    };
    create();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, activeResumeId, location.pathname]);

  const renderBuilder = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-4 md:p-8"
    >
      <SEO
        title="在线简历编辑器"
        description="在线编辑专业简历，支持实时预览与智能诊断，一键导出 PDF，打造属于你的一页纸简历。"
        keywords="在线简历, 简历编辑器, 简历制作, 简历预览, PDF导出, 壹页简历"
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Editor */}
        <div className={cn(
          "lg:col-span-5 space-y-6 transition-all duration-500",
          activeTab === 'preview' ? 'hidden lg:block' : 'block'
        )}>
          <header className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => requestLeave({ type: 'navigate', to: PAGE_PATH.dashboard })}
                className="p-2 text-slate-400 hover:text-slate-900 bg-white shadow-sm border border-slate-100 rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-3xl font-display font-bold tracking-tight text-slate-800">简历编辑器</h2>
                <p className="text-slate-400 text-sm font-medium">草稿: {data.personalInfo.fullName || '新简历'}</p>
                <SaveStatusBadge status={saveStatus} />
              </div>
            </div>
            <div className="flex items-center bg-slate-100/50 p-1 rounded-2xl border border-slate-200">
               <button
                onClick={() => setActiveTab('edit')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
                  activeTab === 'edit'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <Settings2 className="w-4 h-4" />
                编辑
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
                  activeTab === 'preview'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <Eye className="w-4 h-4" />
                预览
              </button>
            </div>
          </header>

          {/* 编辑区独立滚动容器：桌面端固定高度 + overflow-y-auto，右侧预览区固定可见；
              移动端（<lg）保持单列 Tab 切换，不套固定高度 */}
          <div className="space-y-6 lg:max-h-[calc(100vh-230px)] lg:overflow-y-auto lg:pr-1 lg:scrollbar-hide">

          {/* Collapsible Resume Scoring & Diagnosis Panel */}
          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-1">
            <button
              onClick={() => setShowScoring(!showScoring)}
              className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/30">
                  <Award className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs tracking-tight">智能简历 AI 诊断评估</h4>
                  <p className="text-slate-400 text-[10px]">诊断内容完整度、关键词匹配度与通过率</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-600 px-2 py-0.5 bg-blue-50 border border-blue-100/40 rounded-full animate-pulse">
                  实时分析中
                </span>
                <span className="text-xs text-slate-400 font-extrabold pr-1">
                  {showScoring ? '收起诊断' : '展开诊断'}
                </span>
              </div>
            </button>
            
            <AnimatePresence>
              {showScoring && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 border-t border-slate-50 bg-white rounded-2xl mt-1">
                    <ResumeScoring data={data} onChange={setData} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="glass rounded-[2rem] p-2 overflow-hidden shadow-2xl shadow-slate-200/50">
            <ResumeEditor
              data={data}
              onChange={setData}
              userTier={appUser?.tier || 'guest'}
              onTriggerUpgrade={(reason) => triggerUpgrade(reason || 'sections')}
            />
          </div>
          </div>
        </div>

        {/* Preview */}
        <div className={cn(
          "lg:col-span-7 transition-all duration-500",
          activeTab === 'edit' ? 'hidden lg:block' : 'block'
        )}>
          <div className="sticky top-28 space-y-6">
            <header className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-display font-bold tracking-tight text-slate-800">预览</h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100/50 text-green-600 rounded-full text-xs font-bold border border-green-200">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  实时
                </div>
                <SaveStatusBadge status={saveStatus} />
              </div>
              <div className="flex items-center gap-3">
                {/* Mobile Back To Editor */}
                <button
                  onClick={() => setActiveTab('edit')}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-750 rounded-2xl text-xs font-bold shadow-sm transition-all hover:bg-slate-50"
                >
                  <Settings2 className="w-3.5 h-3.5 text-blue-500" />
                  返回编辑
                </button>

                <button
                  onClick={() => {
                    if (exporting) return;
                    if (!user) {
                      setIsAuthModalOpen(true);
                      return;
                    }
                    // 导出权限检查
                    if (appUser?.tier === 'member') {
                      tryExportPDF();
                    } else if ((appUser?.remainingPdfExports ?? 0) > 0) {
                      // 次费用户先二次确认，点「继续导出」才扣配额（避免打印框取消白扣次数）
                      setIsExportConfirmOpen(true);
                    } else {
                      console.log('No export quota, showing purchase modal...');
                      setIsExportModalOpen(true);
                    }
                  }}
                  disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-slate-900 disabled:opacity-60 disabled:pointer-events-none text-white rounded-2xl text-xs sm:text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {exporting ? '导出中...' : '导出 PDF'}
                </button>
              </div>
            </header>
            {(exportMessage || exportError) && (
              <div className={cn(
                "text-xs font-bold mt-1.5 text-center sm:text-right mr-2",
                exportError ? "text-red-500" : "text-blue-600"
              )}>
                {exportError || exportMessage}
              </div>
            )}
            
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-macaron-pink/20 via-macaron-lavender/20 to-macaron-blue/20 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
              <div className="relative glass rounded-[2rem] overflow-hidden shadow-2xl h-[calc(100vh-180px)] lg:h-[820px] p-2">
                <div className="h-full rounded-2xl overflow-hidden border border-slate-100">
                   <ResumePreview ref={componentRef} data={data} templateId={templateId} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-macaron-blue/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-macaron-pink/10 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Navigation */}
      <nav className={cn(
        "fixed top-6 left-0 right-0 z-50 px-6 transition-all duration-500",
      )}>
        <div className={cn(
          "max-w-7xl mx-auto rounded-3xl transition-all duration-500 border overflow-hidden",
          scrolled 
            ? "glass shadow-2xl py-2 px-4 border-white/40" 
            : "bg-white/50 backdrop-blur-sm py-4 px-6 border-slate-100 shadow-sm"
        )}>
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(PAGE_PATH.home)}
              className="flex items-center gap-2 group"
            >
              <img src={logo} alt="壹页简历" className="h-8 w-auto group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-display font-extrabold tracking-tighter">
                壹页简历
              </span>
            </button>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-2">
              <NavLink page="home" label="首页" />
              <NavLink page="templates" label="模板" />
              <NavLink page="pricing" label="定价" />
              <div className="w-px h-6 bg-slate-200 mx-2" />
              
              {user ? (
                <div className="flex items-center gap-3 ml-2">
                  <button
                    onClick={() => requestLeave({ type: 'navigate', to: PAGE_PATH.dashboard })}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 border rounded-xl transition-all",
                      pathname === PAGE_PATH.dashboard
                        ? "bg-blue-50 border-blue-200 text-blue-600"
                        : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <UserIcon className={cn("w-4 h-4", pathname === PAGE_PATH.dashboard ? "text-blue-500" : "text-slate-400")} />
                    <span className="text-xs font-bold">
                      {user.phoneNumber || user.email || '普通账户'}
                    </span>
                  </button>
                  <button
                    onClick={() => requestLeave({ type: 'signout' })}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="退出登录"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => requestLogin(PAGE_PATH.dashboard)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-900 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  登录
                </button>
              )}

              <button
                onClick={() => navigate(PAGE_PATH.templates)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200"
              >
                开始制作
              </button>
            </div>

            {/* Mobile Toggle */}
            <button 
              className="md:hidden p-2 text-slate-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-6 top-28 z-40 md:hidden glass rounded-[2rem] p-6 shadow-2xl border border-white/50 flex flex-col gap-1.5"
          >
            {/* Nav Links */}
            <button onClick={() => { navigate(PAGE_PATH.home); setMobileMenuOpen(false); }} className="text-base font-bold p-3.5 text-left border-b border-slate-100 flex items-center justify-between hover:bg-slate-55 rounded-xl transition-all">
              <span>首页</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button onClick={() => { navigate(PAGE_PATH.templates); setMobileMenuOpen(false); }} className="text-base font-bold p-3.5 text-left border-b border-slate-100 flex items-center justify-between hover:bg-slate-55 rounded-xl transition-all">
              <span>模板中心</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button onClick={() => { navigate(PAGE_PATH.pricing); setMobileMenuOpen(false); }} className="text-base font-bold p-3.5 text-left border-b border-slate-100 flex items-center justify-between hover:bg-slate-55 rounded-xl transition-all">
              <span>定价方案</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Auth / Account status & buttons */}
            {user ? (
              <div className="mt-2 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-extrabold text-xs">
                    用
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">当前登录身份</p>
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {user.phoneNumber || user.email || '已登录账号'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => { requestLeave({ type: 'navigate', to: PAGE_PATH.dashboard }); setMobileMenuOpen(false); }}
                    className="py-2.5 bg-white border border-slate-200 text-slate-705 hover:text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-1"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>个人中心</span>
                  </button>
                  <button
                    onClick={() => { requestLeave({ type: 'signout' }); setMobileMenuOpen(false); }}
                    className="py-2.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>退出登录</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-1 gap-2">
                <button
                  onClick={() => { requestLogin(PAGE_PATH.dashboard); setMobileMenuOpen(false); }}
                  className="w-full py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-2xl font-bold text-sm transition-all"
                >
                  注册 / 登录账户
                </button>
              </div>
            )}
            
            <button 
              onClick={() => { navigate(PAGE_PATH.templates); setMobileMenuOpen(false); }} 
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm mt-3 flex items-center justify-center gap-1 shadow-lg shadow-slate-900/10"
            >
              <span>立即在线制作</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-24 min-h-[calc(100vh-100px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* 显式传 location：AnimatePresence 退出动画期间，Routes 仍按"旧"location 渲染旧页 */}
            <Routes location={location}>
              <Route path="/" element={
                <LandingPage
                  data={data}
                  onStart={() => {
                    setSelectedLandingTemplate(undefined);
                    navigate(PAGE_PATH.templates);
                  }}
                  onSelectTemplate={(id) => {
                    setSelectedLandingTemplate(id);
                    navigate(PAGE_PATH.templates);
                  }}
                />
              } />
              <Route path="/templates" element={
                <TemplatesPage
                  userTier={appUser?.tier || 'guest'}
                  initialPreviewTemplateId={selectedLandingTemplate}
                  data={data}
                  onTriggerUpgrade={(reason) => triggerUpgrade(reason || 'templates')}
                  onSelect={handleTemplateSelect}
                />
              } />
              <Route path="/pricing" element={
                <PricingPage
                  currentTier={appUser?.tier || 'guest'}
                  currentPlan={currentPlan}
                  onSelectPlan={handleSelectPlan}
                />
              } />
              <Route path="/payment" element={
                <AuthGate currentPath="/payment" onRequestLogin={requestLogin} authLoading={authLoading} user={user}>
                  <PaymentPage
                    planId={selectedPlanId}
                    onBack={() => navigate(PAGE_PATH.pricing)}
                    onSuccess={() => {
                      // 支付成功：持久化会员权益并刷新订单（服务端已写库，这里重拉权威数据）
                      void handlePurchaseSuccess(selectedPlanId);
                      navigate(PAGE_PATH.dashboard);
                    }}
                  />
                </AuthGate>
              } />
              <Route path="/builder" element={
                <AuthGate currentPath="/builder" onRequestLogin={requestLogin} authLoading={authLoading} user={user}>
                  {renderBuilder()}
                </AuthGate>
              } />
              <Route path="/dashboard" element={
                <AuthGate currentPath="/dashboard" onRequestLogin={requestLogin} authLoading={authLoading} user={user}>
                  <DashboardPage
                    user={user}
                    appUser={appUser}
                    resumes={resumes}
                    orders={orders}
                    onNewResume={() => navigate(PAGE_PATH.templates)}
                    onEditResume={handleEditResume}
                    onDeleteResume={handleDeleteResume}
                    onRenameResume={handleRenameResume}
                    onGoToPayment={(planId) => {
                      if (!user) {
                        requestLogin();
                        return;
                      }
                      setSelectedPlanId(planId);
                      navigate(PAGE_PATH.payment);
                    }}
                    onGoToTemplates={() => navigate(PAGE_PATH.templates)}
                    onTriggerUpgrade={(reason) => triggerUpgrade(reason || 'limit')}
                  />
                </AuthGate>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 创建简历并进入编辑器期间的全屏 loading 反馈 */}
      {creatingResume && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl px-8 py-6 flex items-center gap-4">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <div>
              <p className="text-sm font-bold text-slate-800">正在创建您的简历...</p>
              <p className="text-[11px] text-slate-400 mt-0.5">正在应用模板，请稍候</p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onOpenAgreement={openAgreement}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onPurchaseSuccess={(planType) => { void handlePurchaseSuccess(planType); }}
        onOpenAgreement={openAgreement}
      />

      <ExportConfirmModal
        isOpen={isExportConfirmOpen}
        remaining={appUser?.remainingPdfExports ?? 0}
        onConfirm={() => {
          setIsExportConfirmOpen(false);
          consumeQuotaAndExport();
        }}
        onClose={() => setIsExportConfirmOpen(false)}
      />

      <LeaveConfirmModal
        isOpen={isLeaveConfirmOpen}
        resumeName={resumes.find(r => r.id === activeResumeId)?.name}
        onSave={() => void onLeaveSave()}
        onDiscard={onLeaveDiscard}
        onCancel={() => { setIsLeaveConfirmOpen(false); pendingResumeIdRef.current = null; }}
      />

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onSuccess={(selectedType?: string) => { void handlePurchaseSuccess(selectedType || 'month'); }}
        reason={upgradeReason}
        onOpenAgreement={openAgreement}
      />

      <AgreementModal
        isOpen={isAgreementModalOpen}
        onClose={() => setIsAgreementModalOpen(false)}
        initialTab={agreementInitialTab}
      />

      {/* Global Footer */}
      <footer className="py-20 px-6 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <img src={logo} alt="壹页简历" className="h-8 w-auto" />
              <span className="text-2xl font-display font-extrabold tracking-tighter">壹页简历</span>
            </div>
            <p className="text-slate-500 max-w-sm italic">
              壹页简历为您量身定制专业简历。开启您的职场新篇章。
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 glass rounded-xl text-slate-400 hover:text-blue-500 transition-colors">
                <Github className="w-5 h-5" />
              </a>
               <a href="#" className="p-2 glass rounded-xl text-slate-400 hover:text-blue-500 transition-colors">
                <Layout className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold uppercase text-xs tracking-widest text-slate-400">产品</h4>
            <ul className="space-y-2 text-slate-600 font-medium">
              <li><button onClick={() => navigate(PAGE_PATH.templates)} className="hover:text-blue-600 transition-colors">模板大厅</button></li>
              <li><button onClick={() => {
                if (!user) {
                  requestLogin(PAGE_PATH.builder);
                  return;
                }
                navigate(PAGE_PATH.builder);
              }} className="hover:text-blue-600 transition-colors">在线制作</button></li>
              <li><button onClick={() => navigate(PAGE_PATH.pricing)} className="hover:text-blue-600 transition-colors">价格方案</button></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold uppercase text-xs tracking-widest text-slate-400">公司</h4>
            <ul className="space-y-2 text-slate-600 font-medium">
              <li><a href="#" className="hover:text-blue-600 transition-colors">关于我们</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">加入我们</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">联系支持</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <p>© 2024 壹页简历. 保留所有权利。</p>
          <div className="flex gap-8">
            <button 
              onClick={(e) => openAgreement('privacy', e)} 
              className="hover:text-slate-900 transition-colors pointer-events-auto cursor-pointer"
            >
              隐私政策
            </button>
            <button 
              onClick={(e) => openAgreement('service', e)} 
              className="hover:text-slate-900 transition-colors pointer-events-auto cursor-pointer"
            >
              服务协议
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-4 pb-2 text-center text-xs font-bold text-slate-400">
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-900 transition-colors"
          >
            苏ICP备2026060474号
          </a>
        </div>
      </footer>
    </div>
  );
}

