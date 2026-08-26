import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { Download, FileText, Layout, Eye, Settings2, Github, Award, Menu, X, LogOut, User as UserIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import logo from './assets/logo.svg';
import { ResumeEditor } from './components/ResumeEditor';
import { ResumePreview } from './components/ResumePreview';
import { ResumeScoring } from './components/ResumeScoring';
import { SEO } from './components/SEO';
import { AuthModal } from './components/AuthModal';
import { UpgradeModal } from './components/UpgradeModal';
import { ExportModal } from './components/ExportModal';
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
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [agreementInitialTab, setAgreementInitialTab] = useState<'service' | 'privacy'>('service');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

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

        // 登录前访问了受保护页面（如 /dashboard）则跳回目标页；否则留在原页面
        if (pendingLoginRedirect.current) {
          navigate(pendingLoginRedirect.current);
          pendingLoginRedirect.current = null;
        }
        // 未登录时在模板中心选中了模板：登录成功后自动应用该模板进入编辑器
        if (pendingTemplateId.current) {
          const tid = pendingTemplateId.current;
          pendingTemplateId.current = null;
          void applyTemplateAndEnter(tid, normalizedUser.uid);
        }
        setAuthLoading(false);
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

  // Use a ref to track the last saved data to prevent infinite loops if loading triggers a save
  const lastSavedDataRef = useRef<string>('');

  useEffect(() => {
    if (!user || !activeResumeId) return;
    
    const dataStr = JSON.stringify(data);
    if (dataStr === lastSavedDataRef.current) return;

    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const activeResume = resumes.find(r => r.id === activeResumeId);
        const name = activeResume ? activeResume.name : '我的简历';
        const score = activeResume ? activeResume.score : 85;
        const status = activeResume ? activeResume.status : 'draft';

        await saveResumeWithId(user.uid, activeResumeId, name, data, score, status, templateId);
        
        // Update local list
        setResumes(prev => prev.map(r => r.id === activeResumeId ? { ...r, data, templateId, updatedAt: new Date().toISOString() } : r));

        lastSavedDataRef.current = dataStr;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        setSaveStatus('error');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [data, user, activeResumeId]);

  const handleEditResume = (id: string) => {
    const res = resumes.find(r => r.id === id);
    if (res) {
      setActiveResumeId(id);
      setData(res.data);
      setTemplateId(res.templateId || 'modern');
      lastSavedDataRef.current = JSON.stringify(res.data);
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

  // PDF 导出：改用浏览器原生打印（输出矢量文字，手机/PC 均弹系统打印对话框可「另存为 PDF」，
  // 彻底避开 html2canvas 截图方案的"照片感"/空白页/被拦截问题）
  const handleExportPDF = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${data.personalInfo.fullName || 'Resume'}_简历`,
    pageStyle: '@page { size: A4 portrait; margin: 0; }',
    onBeforePrint: async () => { setExporting(true); setExportMessage(''); setExportError(null); },
    onAfterPrint: () => setExporting(false),
    onPrintError: () => { setExporting(false); setExportError('导出失败，请稍后重试'); },
  });

  // 打印前先确保预览节点已挂载：手机编辑态预览列 hidden 时 componentRef 为空，
  // 先切到预览，等一帧再打印（沿用原「预览未就绪自动重试」逻辑）
  const tryExportPDF = () => {
    if (!componentRef.current) {
      setExportError(null);
      setExportMessage(null);
      setExporting(true);
      setActiveTab('preview');
      setTimeout(() => {
        if (componentRef.current) {
          handleExportPDF();
        } else {
          setExporting(false);
          setExportError('预览未就绪，请切换到预览页后重试');
        }
      }, 300);
      return;
    }
    handleExportPDF();
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

    try {
      await refreshResumesList(uid);
    } catch (err) {
      console.error("Failed to refresh resumes list", err);
    }

    navigate(PAGE_PATH.builder);
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
                onClick={() => navigate(PAGE_PATH.dashboard)}
                className="p-2 text-slate-400 hover:text-slate-900 bg-white shadow-sm border border-slate-100 rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-3xl font-display font-bold tracking-tight text-slate-800">简历编辑器</h2>
                <p className="text-slate-400 text-sm font-medium">草稿: {data.personalInfo.fullName || '新简历'}</p>
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
                {saveStatus !== 'idle' && (
                  <div className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-all",
                    saveStatus === 'saving' && "text-blue-500 animate-pulse",
                    saveStatus === 'saved' && "text-green-500",
                    saveStatus === 'error' && "text-red-500"
                  )}>
                    {saveStatus === 'saving' && '正在保存...'}
                    {saveStatus === 'saved' && '已保存'}
                    {saveStatus === 'error' && '保存失败'}
                  </div>
                )}
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
                      const newQuota = (appUser?.remainingPdfExports ?? 0) - 1;
                      setAppUser(prev => prev ? { ...prev, remainingPdfExports: newQuota } : prev);
                      // 配额消耗持久化到 users 表，刷新后不丢失
                      void updateUser(user.uid, { remaining_pdf_exports: newQuota });
                      tryExportPDF();
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
                    onClick={() => navigate(PAGE_PATH.dashboard)}
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
                    onClick={handleSignOut}
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
                    onClick={() => { navigate(PAGE_PATH.dashboard); setMobileMenuOpen(false); }}
                    className="py-2.5 bg-white border border-slate-200 text-slate-705 hover:text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-1"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>个人中心</span>
                  </button>
                  <button 
                    onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} 
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

