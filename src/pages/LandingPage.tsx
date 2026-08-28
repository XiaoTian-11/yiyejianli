import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronRight, 
  Award, 
  Layout, 
  Download, 
  ShieldCheck, 
  Rocket, 
  Briefcase,
  TrendingUp,
  UserCheck,
  HeartHandshake,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Sparkles,
  Zap,
  Palette,
  Microscope
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { TemplateMiniature } from '../components/TemplateMiniature';
import { InviteSection } from '../components/InviteSection';
import { TemplateId, ResumeData } from '../types';

interface HeroProps {
  onStart: () => void;
  onSelectTemplate?: (templateId: TemplateId) => void;
  data?: ResumeData;
  referralEnabled?: boolean;   // 活动总开关（关闭则不渲染板块）
  isLoggedIn?: boolean;        // 是否已登录（CTA 分流）
  onGoInvite?: () => void;     // 已登录点 CTA → 个人中心邀请卡片
}

export const LandingPage: React.FC<HeroProps> = ({ onStart, onSelectTemplate, referralEnabled, isLoggedIn, onGoInvite }) => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [compareTab, setCompareTab] = useState<'spacing' | 'ats' | 'onepage'>('spacing');

  return (
    <div className="relative overflow-hidden">
      <SEO
        title="专业一页纸简历生成器 - 打造高通过率求职简历"
        description="壹页简历是一款专为求职者量身打造的极简、专业的一页纸简历生成工具。提供多款贴合大厂招聘初筛要求的专业模板，支持双语排版与智能优化，助您在简历初筛中展现优势。"
        keywords="一页纸简历, 简历模板, 简历生成器, ATS简历, 简历制作, 求职简历, 壹页简历"
      />
      
      {/* 氛围感十足的流光背景 */}
      <div className="absolute inset-0 -z-10 bg-slate-50/50 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-100/30 blur-[130px] rounded-full animate-pulse pb-10" />
        <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] bg-amber-100/20 blur-[120px] rounded-full animate-pulse delay-1000" />
        <div className="absolute top-[40%] left-[25%] w-[35%] h-[35%] bg-emerald-50/20 blur-[100px] rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* 左侧文案与交互按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-7 space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200/60 bg-white/60 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-md">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>严苛契合大厂 HR 阅卷初筛规范</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[1.1] text-slate-900">
              极简至上，高度聚焦<br />
              <span className="bg-gradient-to-r from-blue-600 via-emerald-600 to-indigo-600 bg-clip-text text-transparent">一页纸打动招聘核心</span>
            </h1>
            
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
              普通简历常因跨设备格式变形、臃肿冗长、信息密度低而在初筛中被迅速忽略。
              <strong>壹页简历</strong>完美融合黄金视觉比例和结构化STAR业绩描述逻辑，助您用几分钟锁定印刷级排版，突围海量求职竞争。
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={onStart}
                className="group relative px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all hover:scale-[1.03] active:scale-95 shadow-xl shadow-slate-250 flex items-center justify-center gap-1.5"
                id="landing-hero-start-btn"
              >
                <span>立即在线制作</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={onStart}
                className="px-8 py-4 bg-white/80 backdrop-blur-md text-slate-700 hover:text-slate-900 rounded-2xl font-bold hover:bg-white transition-all border border-slate-200 shadow-sm flex items-center justify-center"
                id="landing-hero-templates-btn"
              >
                浏览黄金排版
              </button>
            </div>

            {/* 本地真实感用户反馈 */}
            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100">
              <div className="flex -space-x-3">
                {['#fee2e2', '#e0f2fe', '#ecfdf5', '#f3e8ff'].map((bgColor, idx) => {
                  const label = ['FIN', 'DEV', 'MKT', 'EXE'][idx];
                  return (
                    <div 
                      key={idx} 
                      className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-700 shadow-sm"
                      style={{ backgroundColor: bgColor }}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
              <div className="text-sm text-slate-500 font-medium">
                本周已有超过 <span className="text-slate-900 font-extrabold font-mono">3,200</span> 位精英学者与雇员登录设计他们的求职金钥匙
              </div>
            </div>
          </motion.div>

          {/* 右侧：高度专业的简历黄金规范诊断面板（纯净无代码） */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
            className="lg:col-span-5 relative"
            id="landing-hero-spec-panel"
          >
            <div className="relative z-10 bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl border border-white/60 flex flex-col min-h-[480px]">
              
              {/* 模拟顶边栏 */}
              <div className="h-10 border-b border-slate-100 flex items-center px-2 justify-between select-none shrink-0 mb-5">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                </div>
                <div className="bg-slate-50 border border-slate-100 font-medium text-[10px] text-slate-500 rounded-lg py-1 px-3.5 tracking-wider truncate">
                  壹页 A4 视觉规格质检系统
                </div>
                <div className="w-6" />
              </div>

              {/* 信息与诊断详情 */}
              <div className="flex-1 flex flex-col space-y-5 justify-between">
                
                {/* 评分面板 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">版记呼吸留白比</span>
                    <div className="flex items-baseline gap-1 mt-1.5">
                      <span className="text-3xl font-black text-slate-900 font-display">99.8</span>
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md ml-1">优异</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" style={{ width: '99%' }} />
                    </div>
                  </div>

                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">跨系统字型兼容度</span>
                    <div className="flex items-baseline gap-1 mt-1.5">
                      <span className="text-3xl font-black text-slate-900 font-display">100%</span>
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md ml-1">完美</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>

                {/* 排版微调要点 */}
                <div className="border border-slate-100 p-4 rounded-2xl space-y-3 bg-white shadow-sm text-xs text-slate-700">
                  <div className="border-b pb-2 flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">核心排版微校准参数</h4>
                    <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">ATS全域兼容</span>
                  </div>
                  
                  <div className="space-y-2 pt-1 font-medium">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">中英文文字混排平衡</span>
                      <span className="font-bold text-slate-800">0.05em 专属微字距</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">段落行高黄金比例</span>
                      <span className="font-bold text-slate-800">1.618x 无阻碍视焦动线</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">超额字数强制自适应</span>
                      <span className="font-bold text-slate-800">一键收缩至一页纸</span>
                    </div>
                  </div>
                </div>

                {/* 质检总结 */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>杜绝杂乱图表</strong>：坚决摒弃无规矩的星级或彩条进度表，拥抱高识别率纯字符编排。</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>锁定 A4 一页限界</strong>：精密控制底边距阈值，完全规避导出时因多冒出两行而多产生一页白纸的糟糕状况。</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 氛围挂件，增加设计精致度 */}
            <div className="hidden sm:block absolute -top-5 -right-5 p-3 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-100">
              <Sparkles className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div className="hidden sm:block absolute bottom-12 -left-6 p-3 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-100">
              <Zap className="w-5 h-5 text-blue-500" />
            </div>
          </motion.div>

        </div>
      </section>

      {/* BEFORE VS AFTER 对照：用事实和痛点打动求职者 */}
      <section className="py-24 px-6 bg-slate-50/50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900">
              建立正确的第一印象：为什么不建议使用 Word / 复杂花哨排版？
            </h2>
            <p className="text-slate-500 font-medium">
              HR 筛选简历平均仅在 5-10 秒。多余的修饰不仅掩盖核心业绩，更会让简历在 ATS（简历解析系统）中形同乱码。
            </p>
          </div>

          {/* 选项卡按钮 */}
          <div className="flex justify-center gap-2 max-w-md mx-auto p-1.5 bg-slate-100 rounded-2xl">
            {[
              { id: 'spacing', label: '排版对齐' },
              { id: 'ats', label: 'ATS 解析' },
              { id: 'onepage', label: '一页制控制' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCompareTab(tab.id as any)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  compareTab === tab.id 
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 对比展示网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 痛点组：普通办公软件排版 */}
            <div className="bg-white rounded-[2rem] border border-red-100 p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-bold text-sm tracking-wide">传统工具常见痛点 (Word / PPT)</span>
              </div>
              
              {compareTab === 'spacing' && (
                <div className="space-y-4">
                  <div className="bg-red-50/50 p-4 rounded-xl border border-red-50 text-xs text-red-700 font-medium leading-relaxed">
                    在自己的电脑上对齐得严丝合缝，发送给 HR 后，由于对方系统版本不一致，导致字型替换、表格断线、中文字断句变形。
                  </div>
                  <ul className="space-y-3 text-xs text-slate-500 font-medium">
                    <li className="flex items-center gap-2">❌ 缩进不一，跨行字距不均匀，缺乏统一排版线</li>
                    <li className="flex items-center gap-2">❌ 段落之间密不透风，毫无阅读呼吸感</li>
                    <li className="flex items-center gap-2">❌ 系统强制拉伸字距，导致英文单词被无意义斩断</li>
                  </ul>
                </div>
              )}

              {compareTab === 'ats' && (
                <div className="space-y-4">
                  <div className="bg-red-50/50 p-4 rounded-xl border border-red-50 text-xs text-red-700 font-medium leading-relaxed">
                    为了追求视觉设计，使用了大量的彩色饼图、五星技能槽和表格套表格设计。这些多媒体及悬浮组件对于人资管理解析系统是极其致命的阻碍。
                  </div>
                  <ul className="space-y-3 text-xs text-slate-500 font-medium">
                    <li className="flex items-center gap-2">❌ 无法精确解析主观打分条、技能小黄条</li>
                    <li className="flex items-center gap-2">❌ 无法从嵌套多层的复杂双栏表格里智能提取关键经历</li>
                    <li className="flex items-center gap-2">❌ 将文本保存在图片中，机器直接视为空文本过滤</li>
                  </ul>
                </div>
              )}

              {compareTab === 'onepage' && (
                <div className="space-y-4">
                  <div className="bg-red-50/50 p-4 rounded-xl border border-red-50 text-xs text-red-700 font-medium leading-relaxed">
                    内容刚好超出少许，多出的两三行溢出到第二页，造成打印出的简历剩下一行无用字句并拖带出巨大的白色垃圾页面。
                  </div>
                  <ul className="space-y-3 text-xs text-slate-500 font-medium">
                    <li className="flex items-center gap-2">❌ 为了拼缩在一页，手动缩小部分字号，导致通页比例失衡</li>
                    <li className="flex items-center gap-2">❌ 难以预判导出的 PDF 边界</li>
                    <li className="flex items-center gap-2">❌ 页面最后空白冗余大，显得经验不够饱满</li>
                  </ul>
                </div>
              )}
            </div>

            {/* 壹页简历解决标准 */}
            <div className="bg-slate-900 rounded-[2rem] text-slate-200 p-8 space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute right-[-20px] top-[-20px] w-40 h-40 bg-gradient-to-br from-blue-500/20 to-emerald-500/10 blur-[50px]" />
              
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-bold text-sm tracking-wide">壹页规范标准 (One-Page Precision)</span>
              </div>

              {compareTab === 'spacing' && (
                <div className="space-y-4">
                  <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-800 text-xs text-emerald-400 font-bold leading-relaxed">
                    锁定 PDF 渲染标准，利用严格的 CSS 版式规则定位字重和空隙。无视任何操作系统、阅读器终端差异，极力保证 HR 看到的格式百分百一致。
                  </div>
                  <ul className="space-y-3 text-xs text-slate-400 font-medium">
                    <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> 自适应对齐动线，采用名企人资极为推崇的对齐比例</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> 科学调配正文行间距离舒适值，扫一眼便能擒拿重点业绩</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> 专为学术及职业中英文长词定制的完美折行规避机制</li>
                  </ul>
                </div>
              )}

              {compareTab === 'ats' && (
                <div className="space-y-4">
                  <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-800 text-xs text-emerald-400 font-bold leading-relaxed">
                    摒弃无意义的表格、剪贴画等多余元素，纯净结构化语义标签让大厂招聘 ATS 获取系统实现完美的无损文本拾取与智能分类。
                  </div>
                  <ul className="space-y-3 text-xs text-slate-400 font-medium">
                    <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> 摒弃非纯文本型打分组件，改用标准的字符级别罗列</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> 骨架代码采用层级语义块，完美保障关键字与核心技能穿透</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> PDF导出支持文字直选高亮复制，无任何图片占位</li>
                  </ul>
                </div>
              )}

              {compareTab === 'onepage' && (
                <div className="space-y-4">
                  <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-800 text-xs text-emerald-400 font-bold leading-relaxed">
                    专设一页纸保护神系统，当信息超载多达 10% 后，系统会启动智能调整策略对全局行间距、页边距以及垂直空隙进行黄金压缩，稳健归一。
                  </div>
                  <ul className="space-y-3 text-xs text-slate-400 font-medium">
                    <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> 一键自适应极速重排，永远告别多出一两行导致的难堪页溢</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> 智能间距锁定，即便微缩依然保证页面高对比与高读感</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> 导出排版完美契合 A4 物理比例，让内容分布饱满富有分量</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 精选黄金模板展示 Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto" id="landing-featured-templates">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
              样式中心
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900">让 HR 叹服的高通过率经典排版</h2>
            <p className="text-slate-500 max-w-2xl font-medium">
              摒弃累赞与冗余配色，聚焦专业气质。全系列模板通过高规格投递实测，满足互联网、金融、咨询等严苛标准的严格考察。
            </p>
          </div>
          <button
            onClick={onStart}
            className="flex items-center gap-2 group px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shrink-0 self-start sm:self-auto"
          >
            <span>开始挑选版式</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { id: 'modern', name: '现代商务 (Modern Slate)', tags: ['大厂投递', '重点结构', '首选布局'], desc: '专为高级产品经理、市场企划以及商科管培生研发的王牌排版方案。' },
            { id: 'classic', name: '经典传统 (Timeless Single)', tags: ['大方典雅', '单栏极对称', '资深首推'], desc: '结构工整对称，阅读线极度流畅。适合具有丰富资历、需要长篇幅细致罗列的核心专员。' },
            { id: 'minimal', name: '极简随心 (Pure Minimalist)', tags: ['精练呼吸', '逻辑链干练', '留白艺术'], desc: '去芜存菁，结构紧凑。突出严密的项目经历和极简逻辑，极适合讲求效率及创意的候选人。' }
          ].map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => onSelectTemplate ? onSelectTemplate(tmpl.id as TemplateId) : onStart()}
              className="group cursor-pointer bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-4 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="aspect-[3/4] bg-[#fdfdfd] rounded-[1.8rem] relative overflow-hidden border border-slate-100/80 shadow-inner mb-6">
                <TemplateMiniature templateId={tmpl.id as any} scale="thumbnail" />
                <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="px-5 py-2.5 bg-white text-slate-900 font-bold rounded-xl text-xs shadow-lg transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-1.5 border border-slate-100">
                    一键选取此版式
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
              <div className="px-2 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-800">{tmpl.name}</h3>
                  <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-extrabold tracking-wide">
                    黄金推荐
                  </span>
                </div>
                <p className="text-slate-400 text-xs font-medium leading-relaxed">{tmpl.desc}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tmpl.tags.map((tag) => (
                    <span key={tag} className="text-[10px] text-blue-600 bg-blue-50/70 px-2.5 py-0.5 rounded-md font-bold">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 邀请有礼活动板块（随活动总开关渲染） */}
      {referralEnabled && (
        <InviteSection
          isLoggedIn={isLoggedIn}
          onStart={onStart}
          onGoInvite={onGoInvite}
        />
      )}

      {/* 行业深度定制场景板块 */}
      <section className="py-24 px-6 bg-slate-50/50" id="landing-industry-tailoring">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100">
              场景适配
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-slate-900 tracking-tight">
              洞穿各领域潜规则，为求职保驾护航
            </h2>
            <p className="text-slate-500 font-medium">
              每个行业都有其不可言说的简历筛选惯论。我们对以下高热度行业进行了定制，以满足特定的表达侧重。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
                bgIcon: "bg-blue-50 border-blue-100 text-blue-600",
                industry: "市场企划 / 品牌公关 / 营销运营",
                focus: "以业绩量化、投资回报及商务增长为绝对核心",
                color: "border-blue-100 bg-blue-50/5",
                desc: "专为活动企划、用户增长、大客户谈判经理设计。助您优雅合理地罗列历史项目投资回报率（ROI）、销售贡献突破及渠道整合数据，让大厂面试官直接评估您的变现大盘。"
              },
              {
                icon: <Briefcase className="w-5 h-5 text-amber-605" />,
                bgIcon: "bg-amber-50 border-amber-100 text-amber-600",
                industry: "法律合规 / 严苛金融 / 企业管理",
                focus: "版面致密、端庄、重视商业逻辑业务闭环",
                color: "border-amber-100 bg-amber-50/5",
                desc: "适配投资银行、管理咨询、外企精英以及高端总监投递。字距高度配合庄重中性的衬线英式美学，精简项目流水展示，彰显老练的商业逻辑深度与宏观统揽眼界。"
              },
              {
                icon: <Palette className="w-5 h-5 text-purple-600" />,
                bgIcon: "bg-purple-50 border-purple-100 text-purple-600",
                industry: "创意美学 / 视觉UI / 媒介运营",
                focus: "极致规整的多阶微调、留白美感与作品链接",
                color: "border-purple-100 bg-purple-50/5",
                desc: "适合品牌策划、媒介总编。适中的字体留白和骨架比例在保证干练的前提下赋予简历极佳的艺术呼吸性，便于大方陈列创意灵感库及个人主要代表主页链接。"
              },
              {
                icon: <Microscope className="w-5 h-5 text-emerald-600" />,
                bgIcon: "bg-emerald-50 border-emerald-100 text-emerald-600",
                industry: "科研学术 / 教育临床 / 专业研发",
                focus: "支持学术、论文、长课题索引的高可读承载",
                color: "border-emerald-100 bg-emerald-55",
                desc: "专在 A4 比例下设计了紧凑大方的列表间距，允许医生、教授后及课题骨干罗列严谨的教研实践、核心论著被引索引（含核心期刊及会议论文）及所获专利奖项。"
              }
            ].map((scene, idx) => (
              <div key={idx} className={`rounded-[2rem] border ${scene.color} p-8 bg-white/70 backdrop-blur-md shadow-sm hover:shadow-xl hover:border-slate-205 transition-all group duration-300 flex flex-col justify-between`}>
                <div>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${scene.bgIcon} transition-transform group-hover:scale-110 shadow-sm border`}>
                    {scene.icon}
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">{scene.industry}</h3>
                  <p className="text-[10px] text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md font-extrabold mt-2.5 inline-block">
                    标准排版侧重
                  </p>
                  <p className="text-slate-800 text-xs font-bold mt-3 leading-relaxed">{scene.focus}</p>
                  <p className="text-slate-500 text-xs leading-relaxed mt-2.5 font-medium">{scene.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 解码招聘者审阅习惯 Section */}
      <section className="py-24 px-6 bg-white" id="landing-ats-deepdive">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>招聘评委视角解构</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-slate-900 tracking-tight leading-tight">
              如何在简历被阅卷的“生死5秒”中脱颖而出？
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm font-medium">
              HR 每天阅读海量求职信。多余的页面和粗糙浮夸的排版会引发审美疲累。壹页简历严格执行三大金牌标准：
            </p>
            
            <div className="space-y-4 pt-2">
              {[
                { 
                  title: "黄金视觉落焦区 (Linear Sight Line Focus)", 
                  detail: "绝大多数招聘官的落焦轨迹从左侧姓名开始，顺着履历年份往右探寻。我们所有的版式对齐线都完美贴近该核心轨迹，使重点项目瞬间显现。" 
                },
                { 
                  title: "11px~12px 黄金阅卷字号设计 (Optimized Type Scales)",
                  detail: "针对汉字和英文字符专门调试的字重与行隔黄金数值比例，拒绝过大会显得经验过浅，拒绝过小导致纸页拥塞疲累，让阅读愉悦流畅。" 
                },
                { 
                  title: "纯文本关键字直达机制 (ATS Keywords Injection)", 
                  detail: "简历格式百分之百支持原生纯文本文档格式。无图片遮挡、无乱码占位，让系统在搜索“高价值职位”时迅速命中并提取您的关键素质。" 
                }
              ].map((spec, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all duration-250 border border-transparent hover:border-slate-100">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-sm">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{spec.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1 font-medium">{spec.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 模拟诊断分析黑色面板 */}
          <div className="bg-slate-950 text-slate-200 p-8 rounded-[2.5rem] shadow-2xl border border-slate-900 space-y-5 font-sans relative overflow-hidden">
            <div className="absolute right-[-10px] bottom-[-10px] w-64 h-64 bg-emerald-500/5 blur-[80px]" />
            
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
              <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-emerald-400">
                ⭐
              </div>
              <span className="text-[11px] text-slate-400 font-extrabold tracking-widest uppercase">HR 视线热力学扫视模型反馈</span>
            </div>
            
            <div className="space-y-4 text-xs tracking-wide leading-relaxed font-mono select-none">
              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] block">🔍 TOP 30% 首屏落焦段检测</span>
                <p className="text-slate-350 font-semibold">[检测过关] 姓名、最新最核心职位极其醒目，联系手段和城市定位布局庄重，首秒捕捉完成度：100%</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] block">🔍 MID 50% 核心项目及定量指标检测</span>
                <p className="text-slate-350 font-semibold">[检测过关] 项目起始与结束时限右对齐极度精确，工作职责描述采用行业标准的动词STAR开场，核心成果数据百分百被锁定。</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] block">🔍 BOTTOM 20% 技术特长与外语资质检测</span>
                <p className="text-slate-350 font-semibold">[检测过关] 抛弃了传统的非主流五星彩条雷达图，改用纯文本规范归类排列，大厂ATS简历分析系统获取率：极优级。</p>
              </div>

              <div className="border-t border-slate-850/80 pt-4 flex justify-between items-center text-[10px] text-slate-500 font-bold">
                <span>&gt;&gt; 输出规格：A4一页纸绝对限界 297mm * 210mm</span>
                <span className="text-emerald-400 font-black">【招聘推荐：A级优质简历】</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 选择我们的三大绝对底气 Grid Section */}
      <section className="py-24 px-6 bg-slate-50/20 backdrop-blur-sm" id="landing-benefits">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900">核心硬实力，助您极致突围</h2>
            <p className="text-slate-500 font-medium">不玩虚荣设计，用最贴合大厂与猎头审评标准的极致规则为您铺设黄金道路。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Rocket className="text-yellow-600" />}
              title="即刻实时视觉反馈"
              description="所有的录入和编辑皆同预览实时匹配。无需不停猜测导出后是否会错行或超出预定页码，助您高速度产出高品质成稿。"
              color="bg-amber-50"
            />
            <FeatureCard 
              icon={<ShieldCheck className="text-emerald-600" />}
              title="一键诊断简历质量"
              description="独创的本地简历质量评估机制，综合对齐线、STAR量化描述词比例、联系细节完备度进行综合评分，精细改进简历死角。"
              color="bg-emerald-50"
            />
            <FeatureCard 
              icon={<Layout className="text-indigo-600" />}
              title="独家 A4 黄金一页机制"
              description="内置严格的信息密度控制律。无论多出或者少去，智能字高和边距缓冲机制永远为您坚守完美的单页规格防线。"
              color="bg-indigo-55"
            />
          </div>
        </div>
      </section>

      {/* 常见问题解答与支持 Section */}
      <section className="py-24 px-6 bg-white border-t border-slate-50 animate-fade-in" id="landing-faq">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
              温馨常识
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-slate-900 tracking-tight">为您悉心解答简历常识</h2>
            <p className="text-slate-500 font-medium">关于隐私保管、格式兼容、多页打印防线，这里有专业的回答。</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "壹页简历的模板真的能百分百保障 ATS 解析系统的完整阅读吗？",
                a: "完全保证。我们的编排不依靠悬浮边框和复杂的定位符号，也没有彩色表格。所有的文字层级通过底层的 HTML 标记严格隔离。无论是大厂常用的第三方人资检索服务，还是跨国企业的专有系统，抓取您的姓名、核心项目关键字、学历完全准确，不会抓错或漏抓。"
              },
              {
                q: "简历中需要加入主观打分条（例如“技能80分 / 英语熟练度4颗星”）吗？",
                a: "强烈不推荐。其一，主观打分由于缺乏绝对的通用标尺，很容易让面试官产生困惑（例如您自定的80分，在专家看可能是50分，也可能您谦虚了）；其二，ATS 系统无法读懂非文本图形，甚至会将这类色块判定为格式噪点。壹页简历秉承极简纯文本分类展示，更具信服力。"
              },
              {
                q: "编辑我的简历信息安全吗？个人敏感隐私是否会遭到泄露？",
                a: "我们坚持完全尊重并保护您的隐私。您撰写修改的一切敏感经历及数据在未激活云备份服务前全权保存在您本地的浏览器容器中。我们绝不偷偷采集或滥用您的敏感履历。数据所有权至始至终都在您自己手中，大可完全放心选用。"
              },
              {
                q: "为什么在求职投递时首选 PDF，而不是 Word 或者 JPG 图片？",
                a: "Word 文档由于对方电脑环境的不同（Office 2016、WPS 2021等系统），极容易在打开时发生重磅的格式混乱甚至折行空白；而 JPG 图片对文字的排析非常不利，更无法通过复制文字快捷归档。而 PDF 能锁住每个文字和对齐网格，无论对方用什么设备打开，看见的永远和您编辑时完美一致。"
              }
            ].map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div key={idx} className="bg-white rounded-[1.8rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                    className="w-full text-left px-7 py-5 flex items-center justify-between gap-4 font-bold text-slate-800 hover:bg-slate-50/20 transition-colors"
                  >
                    <span className="text-sm sm:text-base">{faq.q}</span>
                    <span className="text-slate-400 shrink-0 text-lg font-mono">
                      {isExpanded ? "−" : "+"}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="px-7 pb-6 pt-1 text-slate-500 text-sm leading-relaxed border-t border-slate-50 font-medium font-sans">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) => (
  <div className="group p-8 rounded-[2rem] bg-white border border-slate-100 hover:border-slate-200 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-250/30">
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-sm border border-slate-100`}>
      {icon}
    </div>
    <h3 className="text-lg font-bold mb-3 text-slate-900">{title}</h3>
    <p className="text-slate-500 leading-relaxed text-xs font-semibold">{description}</p>
  </div>
);
