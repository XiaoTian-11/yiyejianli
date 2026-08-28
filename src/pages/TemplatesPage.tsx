import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TEMPLATES } from '../constants';
import { SEO } from '../components/SEO';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Star,
  CheckCircle2,
  ArrowRight,
  Eye,
  X,
  Filter
} from 'lucide-react';
import { TemplateId, MembershipTier, ResumeData } from '../types';
import { cn } from '../lib/utils';
import { TemplateMiniature } from '../components/TemplateMiniature';

interface TemplatesPageProps {
  onSelect: (id: TemplateId) => void;
  userTier: MembershipTier;
  initialPreviewTemplateId?: TemplateId;
  data?: ResumeData;
  onTriggerUpgrade?: (reason?: string) => void;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({ onSelect, userTier, initialPreviewTemplateId, data, onTriggerUpgrade }) => {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  // 手机端筛选栏折叠（默认收起，模板首屏直接可见）
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [previewTemplate, setPreviewTemplate] = useState<any>(() => {
    if (initialPreviewTemplateId) {
      return TEMPLATES.find(t => t.id === initialPreviewTemplateId) || null;
    }
    return null;
  });

  const categories = ['全部', '互联网', '金融财务', '医疗健康', '创意设计', '建筑工程'];
  const roles = ['高管/VP', '管理岗', '执行层/IC'];
  const stages = ['在校生/应届生', '职场新人 (1-3年)', '资深/专家'];
  const scenarios = ['跨行转岗', '职业断层/空窗期', '学术/科研转行'];

  const filteredTemplates = TEMPLATES.filter(tmpl => {
    // 1. Industry Category filter
    if (selectedCategory !== '全部') {
      if (selectedCategory === '互联网') {
        if (!['modern', 'tech_focused', 'executive', 'student'].includes(tmpl.id)) return false;
      } else if (selectedCategory === '创意设计') {
        if (!['minimal', 'modern', 'creative_designer'].includes(tmpl.id)) return false;
      } else if (selectedCategory === '金融财务') {
        if (!['classic', 'executive', 'finance_elite'].includes(tmpl.id)) return false;
      } else if (selectedCategory === '医疗健康') {
        if (!['classic', 'executive', 'medical_academic'].includes(tmpl.id)) return false;
      } else if (selectedCategory === '建筑工程') {
        if (!['classic', 'executive', 'engineering_tech'].includes(tmpl.id)) return false;
      }
    }

    // 2. Role filter
    if (selectedRole) {
      if (selectedRole === '高管/VP' || selectedRole === '管理岗') {
        if (!['executive', 'modern', 'finance_elite', 'engineering_tech'].includes(tmpl.id)) return false;
      } else if (selectedRole === '执行层/IC') {
        if (!['modern', 'tech_focused', 'minimal', 'creative_designer', 'medical_academic'].includes(tmpl.id)) return false;
      }
    }

    // 3. Stage filter
    if (selectedStage) {
      if (selectedStage === '在校生/应届生') {
        if (!['student', 'minimal', 'medical_academic'].includes(tmpl.id)) return false;
      } else if (selectedStage === '职场新人 (1-3年)') {
        if (!['modern', 'minimal', 'classic', 'creative_designer'].includes(tmpl.id)) return false;
      } else if (selectedStage === '资深/专家') {
        if (!['executive', 'tech_focused', 'modern', 'finance_elite', 'engineering_tech'].includes(tmpl.id)) return false;
      }
    }

    // 4. Scenario filter
    if (selectedScenario) {
      if (selectedScenario === '跨行转岗') {
        if (!['modern', 'executive', 'creative_designer'].includes(tmpl.id)) return false;
      } else if (selectedScenario === '职业断层/空窗期') {
        if (!['classic', 'modern', 'engineering_tech'].includes(tmpl.id)) return false;
      } else if (selectedScenario === '学术/科研转行') {
        if (!['classic', 'tech_focused', 'medical_academic'].includes(tmpl.id)) return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-6">
      <SEO 
        title="简历模板中心" 
        description="浏览壹页简历精心设计的专业简历模板。适配 ATS 系统，涵盖互联网、金融、医疗等多种热门行业。"
        keywords="简历模板, 专业简历, ATS简历, 简历样例, 简历设计, 壹页简历模板"
      />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* 手机端「筛选」开关（桌面端隐藏） */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden flex items-center justify-between w-full px-4 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm font-bold text-slate-700"
          >
            <span className="flex items-center gap-2"><Filter className="w-4 h-4 text-slate-400" /> 筛选条件</span>
            <span className="text-slate-400 text-xs">{mobileFilterOpen ? '收起' : '展开'}</span>
          </button>

          {/* Sidebar：手机端默认收起（点击筛选按钮展开） */}
          <aside className={`w-full lg:w-72 flex flex-col gap-8 ${mobileFilterOpen ? '' : 'hidden lg:flex'}`}>
            <section className="space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-1">筛选条件</h3>
              
              <div className="space-y-4">
                <FilterGroup title="所属行业" items={categories} selected={selectedCategory} onSelect={(val) => setSelectedCategory(val || '全部')} type="pill" />
                <FilterGroup title="职位职级" items={roles} selected={selectedRole} onSelect={setSelectedRole} type="checkbox" />
                <FilterGroup title="职业阶段" items={stages} selected={selectedStage} onSelect={setSelectedStage} type="list" />
                <FilterGroup title="特殊场景" items={scenarios} selected={selectedScenario} onSelect={setSelectedScenario} type="radio" />
              </div>
            </section>

            {/* Pro Promotion Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-8 text-white space-y-6 relative overflow-hidden group border border-white/5 shadow-2xl">
              <div className="relative z-10 space-y-3">
                <div className="w-10 h-10 bg-macaron-mint rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-macaron-mint/20 mb-4">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <h4 className="text-xl font-bold tracking-tight">解锁全站模板</h4>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  升级为尊享会员，立即可用 50+ 套由顶级设计师打造的求职利器。
                </p>
                <button
                  onClick={() => onTriggerUpgrade?.('templates')}
                  className="w-full py-3.5 bg-white text-slate-900 rounded-xl font-black text-xs hover:scale-105 active:scale-95 transition-all mt-4 tracking-widest uppercase"
                >
                  立即查看会员方案
                </button>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-macaron-mint/5 blur-[50px] rounded-full group-hover:scale-150 transition-transform duration-700" />
            </div>
          </aside>

          {/* Main Area */}
          <main className="flex-1 space-y-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-display font-bold text-slate-900">简历模板中心</h1>
                <p className="text-slate-500 text-sm">由招聘专家设计，适配 ATS 系统，提升 50% 面试邀约率。</p>
              </div>
              <div className="flex items-center gap-4">
                <CustomSelect 
                  label="排序方式" 
                  options={['使用最多', '最新发布', '评分最高']} 
                  defaultValue="使用最多" 
                />
              </div>
            </header>

            {filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredTemplates.map((tmpl, index) => (
                  <TemplateCard 
                    key={tmpl.id} 
                    tmpl={tmpl} 
                    index={index} 
                    onPreview={() => setPreviewTemplate(tmpl)}
                    userTier={userTier}
                    onSelect={onSelect}
                    data={data}
                    onTriggerUpgrade={onTriggerUpgrade}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[2rem] border border-slate-100 shadow-sm text-center">
                <Search className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">暂无匹配模板</h3>
                <p className="text-slate-400 text-xs mt-1">请尝试清除部分筛选条件以展示更多模板。</p>
                <button 
                  onClick={() => {
                    setSelectedCategory('全部');
                    setSelectedRole(null);
                    setSelectedStage(null);
                    setSelectedScenario(null);
                  }}
                  className="mt-4 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition-all"
                >
                  重置筛选条件
                </button>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 pt-12">
              <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <PaginationButton active>1</PaginationButton>
              <PaginationButton>2</PaginationButton>
              <PaginationButton>3</PaginationButton>
              <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </main>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewTemplate(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-4xl h-full bg-white shadow-2xl flex flex-col"
            >
              <header className="px-4 md:px-8 py-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-2xl font-bold text-slate-800">{previewTemplate.name}</h3>
                  <p className="text-slate-500 text-sm">{previewTemplate.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 justify-end">
                  <button
                    onClick={() => {
                      if (previewTemplate.isPremium && userTier !== 'member') {
                        onTriggerUpgrade?.('templates');
                        return;
                      }
                      onSelect(previewTemplate.id as TemplateId);
                      setPreviewTemplate(null);
                    }}
                    className={cn(
                      "px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 whitespace-nowrap",
                      previewTemplate.isPremium && userTier !== 'member'
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                        : "bg-slate-900 text-white"
                    )}
                  >
                    {previewTemplate.isPremium && userTier !== 'member' ? '会员专属模板' : '立即使用此模板'} <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </header>
              <div className="flex-1 overflow-auto bg-slate-50 p-12">
                <div className="max-w-2xl mx-auto bg-white shadow-2xl rounded-sm aspect-[1/1.414] overflow-hidden relative border border-slate-100">
                  <TemplateMiniature templateId={previewTemplate.id} scale="full" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FilterGroup = ({ title, items, selected, onSelect, type }: { title: string, items: string[], selected?: string | null, onSelect?: (s: string | null) => void, type: 'pill' | 'checkbox' | 'list' | 'radio' }) => (
  <div className="space-y-4">
    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h4>
    <div className={cn(
      "flex flex-wrap gap-2",
      (type === 'list' || type === 'radio') && "flex-col gap-1"
    )}>
      {items.map(item => {
        const isActive = selected === item;
        if (type === 'pill') {
          return (
            <button
              key={item}
              onClick={() => onSelect?.(item)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer",
                isActive 
                  ? "bg-macaron-mint text-[#2d5a4c] border-macaron-mint" 
                  : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
              )}
            >
              {item}
            </button>
          );
        }
        if (type === 'checkbox') {
          return (
            <button 
              key={item} 
              onClick={() => onSelect?.(isActive ? null : item)}
              className="flex items-center gap-3 cursor-pointer group px-1 py-1 text-left w-full"
            >
              <div className="w-5 h-5 rounded-md border-2 border-slate-200 group-hover:border-blue-400 flex items-center justify-center transition-all bg-white shrink-0">
                {isActive && <div className="w-3 h-3 bg-macaron-mint rounded-[2px]" />}
              </div>
              <span className={cn("text-sm font-medium transition-colors", isActive ? "text-slate-800" : "text-slate-450 group-hover:text-slate-700")}>{item}</span>
            </button>
          );
        }
        if (type === 'radio') {
          return (
            <button
              key={item}
              onClick={() => onSelect?.(isActive ? null : item)}
              className={cn(
                "text-left px-3 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center justify-between cursor-pointer w-full",
                isActive 
                  ? "bg-macaron-mint/20 text-[#2d5a4c] border-macaron-mint shadow-sm" 
                  : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
              )}
            >
              <span>{item}</span>
              <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center bg-white shrink-0">
                {isActive && <div className="w-2.5 h-2.5 bg-macaron-mint rounded-full" />}
              </div>
            </button>
          );
        }
        // 'list' type or general button
        return (
          <button
            key={item}
            onClick={() => onSelect?.(isActive ? null : item)}
            className={cn(
              "text-left px-3 py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer w-full",
              isActive 
                ? "bg-macaron-mint/20 text-[#2d5a4c] border-macaron-mint shadow-sm" 
                : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
            )}
          >
            {item}
          </button>
        );
      })}
    </div>
  </div>
);

const CustomSelect = ({ label, options, defaultValue }: { label: string, options: string[], defaultValue: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(defaultValue);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-slate-200 transition-all font-bold text-sm text-slate-700"
      >
        <span className="text-slate-400 font-medium">{label}:</span>
        {selected}
        <ChevronRight className={cn("w-4 h-4 text-slate-400 transition-transform", isOpen ? "rotate-90" : "rotate-0")} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-48 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl p-2 z-50 overflow-hidden"
            >
              {options.map(opt => (
                <button
                  key={opt}
                  onClick={() => { setSelected(opt); setIsOpen(false); }}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all",
                    selected === opt 
                      ? "bg-slate-900 text-white" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {opt}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const TemplateCard: React.FC<any> = ({ tmpl, index, onPreview, userTier, onSelect, onTriggerUpgrade }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.05 }}
    onClick={onPreview}
    className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-2xl hover:shadow-slate-200 transition-all hover:-translate-y-1 cursor-pointer"
  >
    <div className="p-4 overflow-hidden">
      <div className="aspect-[3/4] bg-white rounded-[1.8rem] relative overflow-hidden border border-slate-100 shadow-inner">
        {/* Real Template High-Fidelity Preview Miniature */}
        <TemplateMiniature templateId={tmpl.id} scale="thumbnail" />

        {/* Status Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {tmpl.isPremium && (
            <Badge color="bg-gradient-to-r from-amber-400 to-amber-600" icon={<Star className="w-3 h-3 fill-current" />}>
              会员专属
            </Badge>
          )}
          {index === 0 && <Badge color="bg-slate-900" icon={<CheckCircle2 className="w-3 h-3" />}>ATS 100% 兼容</Badge>}
          {index === 1 && <Badge color="bg-macaron-mint text-[#2d5a4c]" icon={<Star className="w-3 h-3" />}>HR 强烈推荐</Badge>}
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all flex flex-col items-center justify-center gap-3 px-4 text-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="w-[85%] py-2.5 bg-white text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all text-xs"
          >
            <Eye className="w-4 h-4" /> {tmpl.isPremium && userTier !== 'member' ? '查看详情' : '预览模板'}
          </button>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (tmpl.isPremium && userTier !== 'member') {
                onTriggerUpgrade?.('templates');
                return;
              }
              onSelect(tmpl.id);
            }}
            className="w-[85%] py-2.5 bg-macaron-mint text-[#2d5a4c] rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all text-xs shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4" /> 立即使用此模板
          </button>
        </div>
      </div>
    </div>
    
    <div className="px-8 pb-8 pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900 truncate">{tmpl.name}</h3>
        <div className="flex items-center gap-1 text-macaron-mint font-bold text-sm">
          <Star className="w-4 h-4 fill-current" />
          {4.7 + index * 0.1 > 5 ? 5.0 : (4.7 + index * 0.1).toFixed(1)}
        </div>
      </div>
      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
        {tmpl.description}
      </p>
      
      <div className="flex flex-wrap gap-2 pt-2">
        {tmpl.tags?.map((tag: string) => (
          <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
            {tag}
          </span>
        ))}
      </div>
    </div>
  </motion.div>
);

const Badge = ({ children, color, icon }: { children: React.ReactNode, color: string, icon?: React.ReactNode }) => (
  <div className={cn(
    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-black/5",
    color
  )}>
    {icon}
    {children}
  </div>
);

const PaginationButton = ({ children, active }: { children: React.ReactNode, active?: boolean }) => (
  <button className={cn(
    "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all",
    active ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
  )}>
    {children}
  </button>
);
