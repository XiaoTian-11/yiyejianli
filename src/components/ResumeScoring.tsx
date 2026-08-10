import React, { useState, useMemo } from 'react';
import { ResumeData, PersonalInfo } from '../types';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp, 
  Plus, 
  Info, 
  Target,
  FileCheck2,
  ListFilter,
  RefreshCw,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { INDUSTRY_SAMPLES, TEMPLATE_INDUSTRY_MAP } from '../constants/industrySamples';

interface ResumeScoringProps {
  data: ResumeData;
  onChange?: (data: ResumeData) => void;
}

// Predefined professional keyword packages for matching
const INDUSTRY_KEYWORDS: Record<string, { category: string; terms: string[]; scoreImpact: string }> = {
  tech: {
    category: '技术研发 (Engineering)',
    terms: ['开发', '研发', '架构', '数据', '并发', '优化', '重构', 'API', '全栈', '算法', '部署', '系统', '缓存', '高可用', '重写'],
    scoreImpact: '突出硬核技术交付及系统性能优化能力'
  },
  product: {
    category: '产品管理与增长 (Product/Growth)',
    terms: ['产品', '规划', '运营', '流存', '留存', '增长', '转化', '分析', '用户', '功能', '版本', '迭代', '指标', '痛点', '竞品'],
    scoreImpact: '强调用户研究、转化留存及自驱指标增长机制'
  },
  management: {
    category: '项目管理与团队协同 (PM/Leadership)',
    terms: ['主导', '负责', '推进', '协同', '跨部门', '协调', '团队', '项目', '管理', '执行', '落地', '预算', '排期', '交付', '上线'],
    scoreImpact: '展现领导力、流程推进效率及复杂项目成功交付率'
  },
  marketing: {
    category: '市场、运营与商务 (Marketing/BD)',
    terms: ['策划', '渠道', '推广', '营销', '客户', '商务', '变现', 'ROI', '预算', '漏斗', '自媒体', '曝光', '裂变', '拉新', '合伙人'],
    scoreImpact: '凸显渠道掌控力、ROI 费效比及业绩爆发式增长'
  }
};

const CROSS_INDUSTRY_DETECT: Record<string, { name: string; terms: string[] }> = {
  tech: { name: '开发技术/微服务', terms: ['高并发', 'QPS', '全栈', '算法', 'Git', 'Gin', 'SpringBoot', 'Go并', 'K8s', 'Docker', '微服务', '开发', '研发', '架构', '后端', '代码', '前端', '数据库', 'Redis', 'SQL', 'LSM-Tree'] },
  product: { name: '互联网产品/运营', terms: ['产品经理', '用户增长', 'A/B测试', '留存率', '裂变', '漏斗', '点击率', 'CTR', '原型设计', 'Axure', '竞品', '痛点', '上线', 'PM'] },
  finance: { name: '金融/资产/投资', terms: ['投资分析', '注册会计师', 'CPA', 'CFA', '资产管理', '审计', '估值模型', '并购', '尽职调查', '合并报表', '预算', '财务', '流动性', '上市公司'] },
  medical: { name: '医学/临床/生信', terms: ['主治医师', '心血管', 'RCT', '临床试验', '多中心', '病理', 'SCI', '生信', '测序', '医学博士', '转录组', '电子病历', '医学院'] },
  design: { name: '视觉设计/交互', terms: ['视觉设计师', 'UX', 'UI', '交互设计', '色彩学', '动效', 'Figma', 'ARK', 'Behance', 'Dribbble', '网格', '排版', '三维', '美学'] },
  engineering: { name: '基建工程/建造师', terms: ['基建', '建造师', '市政', '路桥', '总包', '安全生产', 'BIM', '盾构', '隧道', '深基坑', '土木工程', '施工'] },
  law: { name: '法律/诉讼/合规', terms: ['法律顾问', '律师', '合规', '答辩状', '一审', '二审', '胜诉', '知识产权', '合同纠纷', '排雷', '外商直接投资', 'FDI', '意见书'] },
  marketing: { name: '推广/网络营销/KOL', terms: ['网络整合营销', '投流', 'ROI', '大客户', 'KA', 'KOL', '引爆', '病毒营销', '淘天', '多渠道', '自媒体', '媒介公关', '流量分流'] },
  student: { name: '应届校招/Intern', terms: ['应届毕业生', '绩点', 'GPA', '国家奖学金', '刷题', 'LeetCode', '算法竞赛', '实习生', '校招'] },
  admin: { name: '行政/总裁办/综合', terms: ['行政总监', '总裁办', '后勤', '写字楼', '物业', '审批', '全员资产', '董事会', '差旅', '综管', '接待', '公关协调'] }
};

export const ResumeScoring: React.FC<ResumeScoringProps> = ({ data, onChange }) => {
  const [customKeywordInput, setCustomKeywordInput] = useState('');
  const [customKeywords, setCustomKeywords] = useState<string[]>(['AI', 'SaaS', '数据看板']);
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'action_items' | 'match_purge'>('overview');
  const [selectedIndustry, setSelectedIndustry] = useState<'tech' | 'product' | 'management' | 'marketing'>('product');
  const [purgeIndustryKey, setPurgeIndustryKey] = useState<string>('product');
  const [confirmOverwrite, setConfirmOverwrite] = useState<boolean>(false);
  const [cleanToast, setCleanToast] = useState<string>('');

  // Compute all scoring metrics dynamically
  const scoringData = useMemo(() => {
    let score = 0;
    const details = {
      completeness: 0,
      keywords: 0,
      coverage: 0,
      balance: 0
    };

    const auditList: {
      id: string;
      title: string;
      status: 'success' | 'warning' | 'error';
      message: string;
      scoreDelta: number;
    }[] = [];

    // --- 1. COMPLETENESS (Max 40 points) ---
    const info: PersonalInfo = data.personalInfo || ({} as PersonalInfo);
    let infoFieldsCount = 0;
    if (info.fullName) infoFieldsCount++;
    if (info.email) infoFieldsCount++;
    if (info.phone) infoFieldsCount++;
    if (info.location) infoFieldsCount++;
    if (info.jobTitle) infoFieldsCount++;

    const infoPoints = infoFieldsCount * 2; // Max 10 pts
    score += infoPoints;
    details.completeness += infoPoints;

    if (infoFieldsCount === 5) {
      auditList.push({
        id: 'info_complete',
        title: '基本信息完整度',
        status: 'success',
        message: '姓名、邮箱、电话、职位、地点均填写完整',
        scoreDelta: infoPoints
      });
    } else {
      const missing = [];
      if (!info.fullName) missing.push('姓名');
      if (!info.email) missing.push('邮箱');
      if (!info.phone) missing.push('电话');
      if (!info.location) missing.push('地点');
      if (!info.jobTitle) missing.push('职位');
      auditList.push({
        id: 'info_incomplete',
        title: '基本信息不全',
        status: 'error',
        message: `缺少: ${missing.join(', ')}。请尽快补全。`,
        scoreDelta: infoPoints
      });
    }

    // Work Summary / Self Eval
    const summaryLen = (data.summary || '').length;
    let summaryPoints = 0;
    if (summaryLen > 0) {
      summaryPoints += 3;
      if (summaryLen >= 40) {
        summaryPoints += 3;
      }
    }
    score += summaryPoints;
    details.completeness += summaryPoints;

    if (summaryLen === 0) {
      auditList.push({
        id: 'summary_missing',
        title: '缺少自我评价',
        status: 'warning',
        message: '自我评价是简历黄金视区，强力推荐补充。',
        scoreDelta: 0
      });
    } else if (summaryLen < 40) {
      auditList.push({
        id: 'summary_short',
        title: '自我评价偏短',
        status: 'warning',
        message: '太简短的描述难以凸显综合优势，建议充实细节。',
        scoreDelta: summaryPoints
      });
    } else {
      auditList.push({
        id: 'summary_perfect',
        title: '自我评价完备',
        status: 'success',
        message: '文字量适中，较好概括了您的职业成就。',
        scoreDelta: summaryPoints
      });
    }

    // Experience Items
    const expCount = (data.experience || []).length;
    let expPoints = 0;
    if (expCount > 0) {
      expPoints += 4;
      // Check average description length
      const avgDescLen = data.experience.reduce((acc, cur) => acc + (cur.description || '').length, 0) / expCount;
      if (avgDescLen > 50) {
        expPoints += 3;
      }
      if (avgDescLen > 100) {
        expPoints += 3;
      }
    }
    score += expPoints;
    details.completeness += expPoints;

    if (expCount === 0) {
      auditList.push({
        id: 'exp_missing',
        title: '工作经历缺失',
        status: 'error',
        message: '无工作 / 实习经历。这是简历最核心的板块！',
        scoreDelta: 0
      });
    } else {
      auditList.push({
        id: 'exp_ok',
        title: '工作经历数',
        status: expCount >= 2 ? 'success' : 'warning',
        message: `拥有 ${expCount} 个任职阶段。建议保持2-4段。`,
        scoreDelta: expPoints
      });
    }

    // Education
    const eduCount = (data.education || []).length;
    let eduPoints = 0;
    if (eduCount > 0) {
      eduPoints += 3;
      if (data.education.some(e => e.degree)) {
        eduPoints += 3;
      }
    }
    score += eduPoints;
    details.completeness += eduPoints;

    if (eduCount === 0) {
      auditList.push({
        id: 'edu_missing',
        title: '未填写院校经历',
        status: 'error',
        message: '没有教育经历。HR通常会通过教育背景判别简历可信度。',
        scoreDelta: 0
      });
    } else {
      auditList.push({
        id: 'edu_ok',
        title: '学历信息已填',
        status: 'success',
        message: '学校名称及学位专业已包含。',
        scoreDelta: eduPoints
      });
    }

    // Projects
    const projCount = (data.projects || []).length;
    let projPoints = 0;
    if (projCount > 0) {
      projPoints += 2;
      const avgProjLen = data.projects.reduce((acc, cur) => acc + (cur.description || '').length, 0) / projCount;
      if (avgProjLen > 35) {
        projPoints += 2;
      }
    }
    score += projPoints;
    details.completeness += projPoints;

    if (projCount > 0) {
      auditList.push({
        id: 'proj_ok',
        title: '含有项目模块',
        status: 'success',
        message: `共记录了 ${projCount} 个深度实践及科研项目，表现力佳。`,
        scoreDelta: projPoints
      });
    }

    // Skills
    const skillCount = (data.skills || []).length;
    let skillPoints = 0;
    if (skillCount > 0) {
      skillPoints += 2;
      if (skillCount >= 5) {
        skillPoints += 2;
      }
    }
    score += skillPoints;
    details.completeness += skillPoints;

    if (skillCount === 0) {
      auditList.push({
        id: 'skills_missing',
        title: '缺少专业技能词',
        status: 'warning',
        message: '添加核心技能标签能有效辅助招聘系统做简历关键词初选。',
        scoreDelta: 0
      });
    } else {
      auditList.push({
        id: 'skills_ok',
        title: '掌握技能图谱',
        status: 'success',
        message: `共添加了 ${skillCount} 个关键词技能项。`,
        scoreDelta: skillPoints
      });
    }


    // --- 2. KEYWORD DENSITY & AUDIT (Max 40 points) ---
    // Extract entire text content from data
    let fullText = '';
    fullText += ` ${data.personalInfo.fullName} ${data.personalInfo.jobTitle} ${data.summary}`;
    data.experience.forEach(e => {
      fullText += ` ${e.company} ${e.position} ${e.description}`;
    });
    data.education.forEach(ed => {
      fullText += ` ${ed.school} ${ed.degree}`;
    });
    data.projects.forEach(p => {
      fullText += ` ${p.name} ${p.description}`;
    });
    fullText += ` ${data.skills.join(' ')}`;

    if (data.summary_secondary) fullText += ` ${data.summary_secondary}`;
    if (data.skills_secondary) fullText += ` ${data.skills_secondary.join(' ')}`;

    // Match selected industry package keywords
    const industryData = INDUSTRY_KEYWORDS[selectedIndustry];
    const matchedIndustryWords: string[] = [];
    const missingIndustryWords: string[] = [];

    industryData.terms.forEach(term => {
      if (fullText.toLowerCase().includes(term.toLowerCase())) {
        matchedIndustryWords.push(term);
      } else {
        missingIndustryWords.push(term);
      }
    });

    // Custom keywords match
    const matchedCustomWords: string[] = [];
    const missingCustomWords: string[] = [];
    customKeywords.forEach(term => {
      if (fullText.toLowerCase().includes(term.toLowerCase())) {
        matchedCustomWords.push(term);
      } else {
        missingCustomWords.push(term);
      }
    });

    const totalMatches = matchedIndustryWords.length + matchedCustomWords.length;
    const calcKeywordPoints = Math.min(40, totalMatches * 6);
    score += calcKeywordPoints;
    details.keywords = calcKeywordPoints;

    if (totalMatches === 0) {
      auditList.push({
        id: 'kw_poor',
        title: '匹配关键术语极少',
        status: 'error',
        message: `未检查出 ${industryData.category} 的常用专业词。HR筛选困难。`,
        scoreDelta: 0
      });
    } else if (totalMatches < 5) {
      auditList.push({
        id: 'kw_avg',
        title: '匹配关键词偏少',
        status: 'warning',
        message: `已匹配到 ${matchedIndustryWords.length} 个行业词。建议增补至 6 个以上。`,
        scoreDelta: calcKeywordPoints
      });
    } else {
      auditList.push({
        id: 'kw_stellar',
        title: '内容匹配术语丰富',
        status: 'success',
        message: `匹配到 ${matchedIndustryWords.length} 个行业热词与 ${matchedCustomWords.length} 个自定义指标。高通过率。`,
        scoreDelta: calcKeywordPoints
      });
    }


    // --- 3. TRANSLATION & BILINGUAL COVERAGE (Max 10 points) ---
    let translationPoints = 0;
    if (data.secondaryLanguage) {
      // It is a bilingual resume. Let's inspect coverage.
      let secondaryFieldsCount = 0;
      let targetFields = 0;

      if (data.personalInfo.fullName) { targetFields++; if (data.personalInfo.fullName_secondary) secondaryFieldsCount++; }
      if (data.personalInfo.jobTitle) { targetFields++; if (data.personalInfo.jobTitle_secondary) secondaryFieldsCount++; }
      if (data.summary) { targetFields++; if (data.summary_secondary) secondaryFieldsCount++; }
      
      data.experience.forEach(exp => {
        if (exp.company) { targetFields++; if (exp.company_secondary) secondaryFieldsCount++; }
        if (exp.position) { targetFields++; if (exp.position_secondary) secondaryFieldsCount++; }
        if (exp.description) { targetFields++; if (exp.description_secondary) secondaryFieldsCount++; }
      });

      const coverageRatio = targetFields > 0 ? (secondaryFieldsCount / targetFields) : 1;
      translationPoints = Math.round(coverageRatio * 10);
      score += translationPoints;
      details.coverage = translationPoints;

      if (coverageRatio < 0.5) {
        auditList.push({
          id: 'trans_poor',
          title: '副译文覆盖率偏低',
          status: 'warning',
          message: `您选择的双语对照已启用，但翻译完整度仅为 ${Math.round(coverageRatio * 100)}%。建议用 AI 智能全套一键翻译。`,
          scoreDelta: translationPoints
        });
      } else {
        auditList.push({
          id: 'trans_great',
          title: '双语内容匹配极佳',
          status: 'success',
          message: `译文已完整覆盖大部分模块内容 (达成 ${Math.round(coverageRatio * 100)}%)。`,
          scoreDelta: translationPoints
        });
      }
    } else {
      // Single language. Give 10 pts for format clarity or default scale.
      translationPoints = 10;
      score += translationPoints;
      details.coverage = translationPoints;
      auditList.push({
        id: 'single_lang_clear',
        title: '排版结构整洁规范',
        status: 'success',
        message: '单语结构规整，段落各维度自适应，打印排版不易出错。',
        scoreDelta: 10
      });
    }

    // --- 4. DATA BALANCE & READABILITY (Max 10 points) ---
    let balancePoints = 0;
    const bulletCharCount = (data.summary || '').length + data.experience.reduce((acc, cur) => acc + (cur.description || '').length, 0);
    
    // Balanced description ranges
    if (bulletCharCount > 150 && bulletCharCount < 1200) {
      balancePoints += 6;
    } else if (bulletCharCount > 0) {
      balancePoints += 3;
    }

    const sectionsCount = data.sections.length;
    if (sectionsCount >= 4 && sectionsCount <= 7) {
      balancePoints += 4;
    } else {
      balancePoints += 2;
    }

    score += balancePoints;
    details.balance = balancePoints;

    auditList.push({
      id: 'balance_meta',
      title: '篇幅长短均衡度',
      status: bulletCharCount > 1000 ? 'warning' : 'success',
      message: bulletCharCount > 1000 
        ? '全文文字偏多，超出一页A4纸范围。请适量精简。' 
        : '排版字数适中，结构规整，排版能优雅容纳于一页 A4 内。',
      scoreDelta: balancePoints
    });

    // Final clamp to [0-100] scale
    const finalScore = Math.min(100, Math.max(15, score));

    return {
      score: finalScore,
      details,
      auditList,
      matchedIndustryWords,
      missingIndustryWords,
      matchedCustomWords,
      missingCustomWords
    };
  }, [data, selectedIndustry, customKeywords]);

  // Find unmatched assets for filtering/cleaning
  const unmatchedAssets = useMemo(() => {
    const skills = data.skills || [];
    const experience = data.experience || [];
    const summary = data.summary || '';

    const results: Array<{
      id: string;
      type: 'skill' | 'experience' | 'summary';
      originalText: string;
      matchedKeyword: string;
      fromCategory: string;
      targetIndex?: number; // for experience item position
    }> = [];

    // All categories other than the chosen one
    const suspectCategories = Object.entries(CROSS_INDUSTRY_DETECT).filter(([key]) => key !== purgeIndustryKey);

    // 1. Scan skills
    skills.forEach((skill, index) => {
      for (const [catKey, catInfo] of suspectCategories) {
        for (const term of catInfo.terms) {
          if (skill.toLowerCase().includes(term.toLowerCase())) {
            results.push({
              id: `skill-${index}-${term}`,
              type: 'skill',
              originalText: skill,
              matchedKeyword: term,
              fromCategory: catInfo.name,
              targetIndex: index
            });
            break; // only flag once per skill item
          }
        }
      }
    });

    // 2. Scan experience descriptions (bullet lines)
    experience.forEach((exp, expIndex) => {
      const bullets = exp.description.split('\n');
      bullets.forEach((bullet, bulletIndex) => {
        if (!bullet.trim()) return;
        for (const [catKey, catInfo] of suspectCategories) {
          for (const term of catInfo.terms) {
            if (bullet.toLowerCase().includes(term.toLowerCase())) {
              results.push({
                id: `exp-${expIndex}-bullet-${bulletIndex}-${term}`,
                type: 'experience',
                originalText: bullet,
                matchedKeyword: term,
                fromCategory: catInfo.name,
                targetIndex: expIndex
              });
              break;
            }
          }
        }
      });
    });

    // 3. Scan summary
    if (summary) {
      const clauses = summary.split(/[。！?.\n]/);
      clauses.forEach((clause, clauseIndex) => {
        if (clause.trim().length < 4) return;
        for (const [catKey, catInfo] of suspectCategories) {
          for (const term of catInfo.terms) {
            if (clause.toLowerCase().includes(term.toLowerCase())) {
              results.push({
                id: `summary-${clauseIndex}-${term}`,
                type: 'summary',
                originalText: clause,
                matchedKeyword: term,
                fromCategory: catInfo.name
              });
              break;
            }
          }
        }
      });
    }

    return results;
  }, [data, purgeIndustryKey]);

  const handlePurgeItem = (asset: typeof unmatchedAssets[number]) => {
    if (!onChange) return;
    const updated = { ...data };

    if (asset.type === 'skill') {
      const skills = [...(updated.skills || [])];
      if (typeof asset.targetIndex === 'number') {
        skills.splice(asset.targetIndex, 1);
        updated.skills = skills;
      }
    } else if (asset.type === 'experience') {
      const experience = [...(updated.experience || [])];
      if (typeof asset.targetIndex === 'number' && experience[asset.targetIndex]) {
        const bullets = experience[asset.targetIndex].description.split('\n');
        const nextBullets = bullets.filter(bullet => bullet !== asset.originalText);
        experience[asset.targetIndex] = {
          ...experience[asset.targetIndex],
          description: nextBullets.join('\n')
        };
        updated.experience = experience;
      }
    } else if (asset.type === 'summary') {
      let summaryText = updated.summary || '';
      summaryText = summaryText.replace(asset.originalText, '');
      // Clean double periods or hanging punctuation
      summaryText = summaryText.replace(/[。！?.\s]{2,}/g, '。').replace(/^[。！?.\s]+|[。！?.\s]+$/g, '').trim();
      updated.summary = summaryText;
    }

    onChange(updated);
    setCleanToast(`已智能筛除冗余描述："${asset.originalText.substring(0, 10)}..."`);
    setTimeout(() => setCleanToast(''), 3000);
  };

  const handlePurgeAll = () => {
    if (!onChange) return;
    let updatedData = { ...data };

    // 1. Clean skills
    const skillsToKeep = (updatedData.skills || []).filter(skill => {
      const isMismatched = unmatchedAssets.some(asset => asset.type === 'skill' && asset.originalText === skill);
      return !isMismatched;
    });

    // 2. Clean experience descriptions
    const cleanedExperience = (updatedData.experience || []).map(exp => {
      const bullets = exp.description.split('\n');
      const filteredBullets = bullets.filter(bullet => {
        const isMismatched = unmatchedAssets.some(asset => asset.type === 'experience' && asset.originalText === bullet);
        return !isMismatched;
      });
      return {
        ...exp,
        description: filteredBullets.join('\n')
      };
    });

    // 3. Clean summary
    let cleanedSummary = updatedData.summary;
    unmatchedAssets.forEach(asset => {
      if (asset.type === 'summary') {
        cleanedSummary = cleanedSummary.replace(asset.originalText, '');
      }
    });
    cleanedSummary = cleanedSummary.replace(/[。！?.\s]{2,}/g, '。').replace(/^[。！?.\s]+|[。！?.\s]+$/g, '').trim();

    updatedData.skills = skillsToKeep;
    updatedData.experience = cleanedExperience;
    updatedData.summary = cleanedSummary;

    onChange(updatedData);
    setCleanToast('🎉 已一键去除所有不匹配或冗余的信息描述，简历纯度大幅提升！');
    setTimeout(() => setCleanToast(''), 4000);
  };

  const handleApplyIndustryTemplate = () => {
    if (!onChange) return;
    const sample = INDUSTRY_SAMPLES[purgeIndustryKey];
    if (sample) {
      onChange(sample.data);
      setConfirmOverwrite(false);
      setCleanToast(`已成功载入「${sample.industryName}」的高分行业文本！`);
      setTimeout(() => setCleanToast(''), 4000);
    }
  };

  const addCustomKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (customKeywordInput.trim() && !customKeywords.includes(customKeywordInput.trim())) {
      setCustomKeywords([...customKeywords, customKeywordInput.trim()]);
      setCustomKeywordInput('');
    }
  };

  const removeCustomKeyword = (kw: string) => {
    setCustomKeywords(customKeywords.filter(k => k !== kw));
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-100 shadow-xl p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-600 animate-pulse" />
          <h3 className="font-display font-black text-slate-800 text-base uppercase">智能简历诊断与质检</h3>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">综合简历得分</span>
          <span className="text-2xl font-black text-blue-600 font-mono tracking-tight">{scoringData.score} 分</span>
        </div>
      </div>

      {/* Progress Bar Gauge */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-500">
          <span>{scoringData.score < 60 ? '⚠️ 需要改进' : scoringData.score < 85 ? '✨ 良好' : '🚀 优秀'}</span>
          <span>{scoringData.score}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full rounded-full bg-gradient-to-r ${
              scoringData.score < 60 
                ? 'from-red-400 to-amber-400' 
                : scoringData.score < 85 
                  ? 'from-blue-400 to-indigo-500' 
                  : 'from-blue-500 via-indigo-500 to-violet-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${scoringData.score}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Selector Matrix Tabs */}
      <div className="flex bg-slate-100/60 p-1 rounded-2xl border border-slate-200 overflow-x-auto scrollbar-none select-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 min-w-[70px] flex items-center justify-center gap-1.5 py-2.5 px-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'overview' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          得分详情
        </button>
        <button
          onClick={() => setActiveTab('keywords')}
          className={`flex-1 min-w-[70px] flex items-center justify-center gap-1.5 py-2.5 px-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'keywords' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          关键词分析
        </button>
        <button
          onClick={() => setActiveTab('action_items')}
          className={`flex-1 min-w-[70px] flex items-center justify-center gap-1.5 py-2.5 px-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'action_items' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          改进清单
        </button>
        <button
          onClick={() => setActiveTab('match_purge')}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'match_purge' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5 text-blue-500" />
          行业填充/净化
        </button>
      </div>

      {/* Switch Tab Content */}
      <div className="min-h-[220px]">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">模块完整度</span>
                  <p className="text-sm font-black text-slate-700">{scoringData.details.completeness} / 40 Pts</p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">词汇含金量 / 密度</span>
                  <p className="text-sm font-black text-slate-700">{scoringData.details.keywords} / 40 Pts</p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">一键译文 / 结构自适</span>
                  <p className="text-sm font-black text-slate-700">{scoringData.details.coverage} / 10 Pts</p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">篇幅比例平衡度</span>
                  <p className="text-sm font-black text-slate-700">{scoringData.details.balance} / 10 Pts</p>
                </div>
              </div>

              {/* Quick tip bubble */}
              <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50 flex gap-3.5 items-start">
                <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-blue-700">AI 智能分析简评</h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    {scoringData.score < 60 
                      ? '当前简历缺失不少关键要素板块（如自我评价或项目细分），并且专业技能标签偏少。建议利用下方改进清单逐一丰富内容，有效规避HR机洗初筛。' 
                      : scoringData.score < 85
                        ? '这是一份结构表现极佳的简历，工作经历与教育经历均相对完整。进一步精炼文字、多加入可数字化的具体业绩，能给项目面试官留下深刻印象。'
                        : '简历得分非常优秀！多维度指标健康，词汇涵盖率在行业平均标准之上。可以在排版上挑选最适合您岗位的背景色，直接一键导出高保真 PDF 即可畅快投递！'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'keywords' && (
            <motion.div
              key="keywords"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Select Job Industry Package */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">选择目标求职岗属行业类别 (ATS匹配包)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(INDUSTRY_KEYWORDS).map(([key, item]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedIndustry(key as any)}
                      className={`px-2.5 py-2 border rounded-xl text-[11px] font-bold text-center transition-all ${
                        selectedIndustry === key 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {item.category.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Matched keywords panel */}
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase text-slate-500">
                    <span>已匹配到的专业词 ({scoringData.matchedIndustryWords.length})</span>
                    <span className="text-blue-600">
                      匹配率 {Math.round((scoringData.matchedIndustryWords.length / INDUSTRY_KEYWORDS[selectedIndustry].terms.length) * 100)}%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl">
                    {scoringData.matchedIndustryWords.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">暂无词汇命中，可在经历及自我评价描述中补充</span>
                    ) : (
                      scoringData.matchedIndustryWords.map(word => (
                        <span key={word} className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-200">
                          {word}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-black uppercase text-slate-500 block">推荐补充的缺漏专业术语</div>
                  <div className="flex flex-wrap gap-1.5 p-3.5 bg-slate-50/30 border border-slate-50 rounded-2xl">
                    {scoringData.missingIndustryWords.length === 0 ? (
                      <span className="text-xs text-green-500 font-bold">🎉 完美！该行业关键词全数命中！</span>
                    ) : (
                      scoringData.missingIndustryWords.slice(0, 8).map(word => (
                        <span key={word} className="text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                          +{word}
                        </span>
                      ))
                    )}
                  </div>
                  <p className="text-[9.5px] text-slate-400 mt-1 pl-1 flex items-center gap-1">
                    <Info className="w-3 h-3 text-slate-300" /> 指南: {INDUSTRY_KEYWORDS[selectedIndustry].scoreImpact}。
                  </p>
                </div>
              </div>

              {/* Custom keywords custom targets */}
              <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-3xl space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">特设个性化自定义指标匹配</span>
                <form onSubmit={addCustomKeyword} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={customKeywordInput}
                      onChange={(e) => setCustomKeywordInput(e.target.value)}
                      placeholder="如：STAR法则, Python, DAU"
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-300"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                  <button type="submit" className="px-3.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </button>
                </form>

                <div className="flex flex-wrap gap-1.5">
                  {customKeywords.map(kw => {
                    const isMatched = scoringData.matchedCustomWords.includes(kw);
                    return (
                      <span 
                        key={kw} 
                        className={`text-[10px] font-bold px-2 py-1 rounded-xl border flex items-center gap-1 transition-all ${
                          isMatched 
                            ? 'bg-blue-50 text-blue-600 border-blue-200' 
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        <span className={`w-1 h-1 rounded-full ${isMatched ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`} />
                        {kw}
                        <button type="button" onClick={() => removeCustomKeyword(kw)} className="text-slate-400 hover:text-red-500 font-extrabold ml-1 leading-none">
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'action_items' && (
            <motion.div
              key="action_items"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3 max-h-[350px] overflow-auto pr-1"
            >
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">
                以下为您的专属优化意见清单：
              </div>
              <div className="space-y-2.5">
                {scoringData.auditList.map((audit) => (
                  <div 
                    key={audit.id} 
                    className={`p-3.5 rounded-2xl border flex gap-3 items-start transition-all hover:scale-[1.01] ${
                      audit.status === 'success' 
                        ? 'bg-green-50/30 border-green-100/60' 
                        : audit.status === 'warning' 
                          ? 'bg-amber-50/40 border-amber-100/60' 
                          : 'bg-red-50/35 border-red-100/50'
                    }`}
                  >
                    {audit.status === 'success' && <CheckCircle2 className="w-4.5 h-4.5 text-green-500 mt-0.5 shrink-0" />}
                    {audit.status === 'warning' && <AlertTriangle className="w-4.5 h-4.5 text-amber-500 mt-0.5 shrink-0" />}
                    {audit.status === 'error' && <XCircle className="w-4.5 h-4.5 text-red-500 mt-0.5 shrink-0" />}
                    
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs">{audit.title}</span>
                        <span className={`text-[10px] font-bold ${
                          audit.status === 'success' ? 'text-green-600' : 'text-slate-400'
                        }`}>
                          +{audit.scoreDelta} Pts
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] leading-relaxed font-medium">
                        {audit.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'match_purge' && (
            <motion.div
              key="match_purge"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {cleanToast && (
                <div className="p-3 bg-green-550/90 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-2 shadow-lg mb-2">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span>{cleanToast}</span>
                </div>
              )}

              {/* Categorization Template Filling Segment */}
              <div className="space-y-3 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                    各行业大厂标准文本一键填充
                  </span>
                </div>
                <div className="flex gap-2">
                  <select
                    value={purgeIndustryKey}
                    onChange={(e) => { setPurgeIndustryKey(e.target.value); setConfirmOverwrite(false); }}
                    className="flex-1 bg-white border border-slate-200 text-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold outline-none cursor-pointer focus:border-blue-400"
                  >
                    {Object.entries(INDUSTRY_SAMPLES).map(([key, item]) => (
                      <option key={key} value={key}>{item.industryName} ({item.category})</option>
                    ))}
                  </select>
                  
                  {!confirmOverwrite ? (
                    <button
                      onClick={() => setConfirmOverwrite(true)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shrink-0"
                    >
                      载入范文文本
                    </button>
                  ) : (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={handleApplyIndustryTemplate}
                        className="px-2.5 py-2 bg-red-500 text-white text-[10px] font-bold rounded-xl hover:bg-red-600 transition-all"
                      >
                        确认覆盖
                      </button>
                      <button
                        onClick={() => setConfirmOverwrite(false)}
                        className="px-2.5 py-2 bg-slate-200 text-slate-600 text-[10px] font-bold rounded-xl border border-slate-300 hover:bg-slate-300 transition-all"
                      >
                        取消
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[9.5px] text-slate-450 pl-1 leading-normal">
                  * 载入该行业高分范文会覆盖当前编辑器的数据。若只想筛选剔除多余词汇，可执行下方智能精炼。
                </p>
              </div>

              {/* Dynamic Purge Analyzer */}
              {unmatchedAssets.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest pl-1">
                      智能不匹配、冗余偏离条目 (已在简历中检出 {unmatchedAssets.length} 处)
                    </span>
                    <button
                      onClick={handlePurgeAll}
                      className="text-[10px] font-bold text-red-500 hover:text-red-600 bg-red-50 border border-red-100 hover:border-red-200 px-2 py-1 rounded-xl transition-all"
                    >
                      一键快速净化
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                    {unmatchedAssets.map((asset) => (
                      <div 
                        key={asset.id} 
                        className="p-3 bg-amber-50/20 border border-amber-100/30 rounded-2xl flex items-center justify-between gap-3 transition-all hover:bg-amber-50/40"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                              asset.type === 'skill' ? 'bg-indigo-50 text-indigo-500 border border-indigo-100/30' :
                              asset.type === 'experience' ? 'bg-orange-50 text-orange-500 border border-orange-100/30' :
                              'bg-teal-50 text-teal-500 border border-teal-100/30'
                            }`}>
                              {asset.type === 'skill' ? '冗余技能' : asset.type === 'experience' ? '冗余经历 bullet' : '无关自评 clause'}
                            </span>
                            <span className="text-[9.5px] font-bold text-slate-400">来自「{asset.fromCategory}」无关噪点</span>
                          </div>
                          <p className="text-slate-500 text-[11px] leading-relaxed truncate font-medium">"{asset.originalText}"</p>
                        </div>
                        <button
                          onClick={() => handlePurgeItem(asset)}
                          className="p-1 px-2 border border-red-100 text-red-500 rounded-lg hover:bg-red-50 text-[10px] font-bold transition-all"
                          title="滤除此段偏离词"
                        >
                          滤除
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-green-50/30 border border-green-100/40 rounded-3xl flex flex-col items-center justify-center text-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-green-500 animate-pulse" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-green-700">简历纯度完美! 分数 100%</h4>
                    <p className="text-[10.5px] text-slate-500 max-w-sm">
                      当前没有在经历或技能中检测到不符合「{INDUSTRY_SAMPLES[purgeIndustryKey]?.industryName || '设定行业'}」的跨行业偏离词与多余废话。
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
