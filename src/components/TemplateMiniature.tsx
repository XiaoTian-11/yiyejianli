import React from 'react';
import { TemplateId, ResumeData } from '../types';
import { Mail, Phone, MapPin, Globe, Linkedin, Code } from 'lucide-react';
import { INDUSTRY_SAMPLES, TEMPLATE_INDUSTRY_MAP } from '../constants/industrySamples';

interface TemplateMiniatureProps {
  templateId: TemplateId;
  scale?: 'thumbnail' | 'full';
  data?: ResumeData;
}

export const TemplateMiniature: React.FC<TemplateMiniatureProps> = ({ templateId, scale = 'thumbnail', data }) => {
  const isThumbnail = scale === 'thumbnail';
  
  // Custom Styles & Classes depending on templateId
  const fontClass = (templateId === 'tech_focused' || templateId === 'minimal') 
    ? 'font-mono' 
    : ((templateId === 'classic' || templateId === 'executive' || templateId === 'elegant' || templateId === 'legal_consulting') ? 'font-serif' : 'font-sans');
  
  // Real layout parameters
  const outerPadding = isThumbnail ? 'p-4' : 'p-10';
  const nameSize = isThumbnail ? 'text-[11px]' : 'text-3xl';
  const titleSize = isThumbnail ? 'text-[8px]' : 'text-lg';
  const SectionHeaderSize = isThumbnail ? 'text-[8.5px]' : 'text-base';
  const contentTextSize = isThumbnail ? 'text-[6.5px]' : 'text-xs';
  
  // Dynamic Industry Binding
  const industryKey = TEMPLATE_INDUSTRY_MAP[templateId] || 'product';
  const sample = INDUSTRY_SAMPLES[industryKey];
  const sampleData = data || sample?.data;

  // Resolved dynamic values
  const nameText = sampleData?.personalInfo?.fullName || '壹页简历';
  const jobTitleText = sampleData?.personalInfo?.jobTitle || '高级产品经理';
  const jobTitleSecondaryText = sampleData?.personalInfo?.jobTitle_secondary || '';

  const contactInfo = {
    email: sampleData?.personalInfo?.email || 'service@yuejianli.com',
    phone: sampleData?.personalInfo?.phone || '138-xxxx-xxxx',
    location: sampleData?.personalInfo?.location || '全国 / 线上兼远程'
  };
  
  const summaryText = sampleData?.summary || '拥有 8 年数字化平台项目运营与研发管理经验，深耕 AI 翻译與跨国协同系统建设。主导日活千万级产品的增长机制优化并显著提升核心转化留存比。';
  const summaryEnText = sampleData?.summary_secondary || '8+ years leading Agile SaaS products. Focused on internationalization, growth engines, and ML-translation. Increased core metrics by 35%.';

  const defaultExperiences = [
    {
      company: '某高新技术大型科技集团 (Top-Tier Technology Group)',
      position: '高级产品经理 (Senior Product Manager)',
      date: '2023.06 — 至今',
      bullets: [
        '负责多语言协同翻译模块产品规划，引入高并发翻译缓存机制降低延迟50%。',
        '通过多轮主文体与翻译语系 A/B 实验对比，最终提升用户留存35%。'
      ]
    },
    {
      company: '某知名全球化创新重点实验室 (Global Innovation Research Lab)',
      position: '产品经理 (Product Manager)',
      date: '2020.01 — 2023.05',
      bullets: [
        '实现实时智能数据看板研发交付。',
        '负责企业级协同产品的核心框架设计。'
      ]
    }
  ];

  const experiences = sampleData?.experience && sampleData.experience.length > 0
    ? sampleData.experience.map(exp => ({
        company: exp.company,
        position: exp.position,
        date: `${exp.startDate} — ${exp.endDate}`,
        bullets: (exp.description || '').split('\n').filter(Boolean)
      }))
    : defaultExperiences;

  const defaultEducation = {
    school: '某重点综合性建设大学 (Top-Tier National University)',
    degree: '计算机科学与技术 (B.S. in Computer Science)',
    date: '2016-09 — 2020-06'
  };

  const education = sampleData?.education && sampleData.education.length > 0
    ? {
        school: sampleData.education[0].school,
        degree: sampleData.education[0].degree,
        date: `${sampleData.education[0].startDate} — ${sampleData.education[0].endDate}`
      }
    : defaultEducation;

  const defaultSkills = ['产品规划', '敏捷开发', 'SQL', 'Python', 'D3.js', '用户研究', '出海策略'];
  
  const skills = sampleData?.skills && sampleData.skills.length > 0
    ? sampleData.skills
    : defaultSkills;

  // Helper renderers for styles:
  
  // 1. MODERN & STUDENT TEMPLATE (Lateral sidebar layouts)
  if (templateId === 'modern' || templateId === 'student') {
    const isStudent = templateId === 'student';
    return (
      <div className={`w-full h-full bg-white text-slate-800 ${fontClass} flex select-none overflow-hidden`} style={{ fontSize: isThumbnail ? '6px' : '12px' }}>
        {/* Sidebar */}
        <div className={`w-[32%] ${isStudent ? 'bg-[#1e1b4b] text-indigo-100' : 'bg-slate-900 text-white'} ${outerPadding} space-y-4 flex flex-col justify-start`}>
          <div className="space-y-1">
            <h1 className={`${nameSize} font-extrabold tracking-tight`}>{nameText}</h1>
            <p className={`${titleSize} text-blue-400 font-semibold uppercase`}>
              {jobTitleText}
            </p>
          </div>

          <div className={`space-y-1 pt-1.5 border-t ${isStudent ? 'border-indigo-850' : 'border-slate-800'} ${isThumbnail ? 'text-[5.5px]' : 'text-xs'}`}>
            <p className="flex items-center gap-1 opacity-82"><Mail className={`${isThumbnail ? 'w-1.5 h-1.5' : 'w-3.5 h-3.5'} text-blue-400`} />{contactInfo.email}</p>
            <p className="flex items-center gap-1 opacity-82"><Phone className={`${isThumbnail ? 'w-1.5 h-1.5' : 'w-3.5 h-3.5'} text-blue-400`} />{contactInfo.phone}</p>
            <p className="flex items-center gap-1 opacity-82"><MapPin className={`${isThumbnail ? 'w-1.5 h-1.5' : 'w-3.5 h-3.5'} text-blue-400`} />{contactInfo.location}</p>
          </div>

          {/* Education background - prioritized on top for Student, bottom for Modern */}
          {isStudent && (
            <div className="space-y-1 pt-2">
              <h4 className={`${SectionHeaderSize} font-bold text-blue-400 border-b border-indigo-800 pb-0.5 uppercase tracking-wider`}>教育背景</h4>
              <div>
                <p className="font-bold text-[7px] leading-tight">{education.school}</p>
                <p className="text-[6px] opacity-80">{education.degree}</p>
                <p className="text-[5px] opacity-60">{education.date}</p>
              </div>
            </div>
          )}

          {/* Skills specialist tags */}
          <div className="space-y-1.5">
            <h4 className={`${SectionHeaderSize} font-bold text-blue-400 border-b ${isStudent ? 'border-indigo-800' : 'border-slate-800'} pb-0.5 uppercase tracking-wider`}>核心技能</h4>
            <div className="flex flex-wrap gap-1">
              {skills.map(s => (
                <span key={s} className={`${isStudent ? 'bg-indigo-950 text-indigo-200' : 'bg-slate-800 text-slate-300'} px-1 py-0.5 rounded text-[5px] border border-blue-900/10`}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {!isStudent && (
            <div className="space-y-1">
              <h4 className={`${SectionHeaderSize} font-bold text-blue-400 border-b border-slate-800 pb-0.5 uppercase tracking-wider`}>教育经历</h4>
              <div className="space-y-0.5">
                <p className="font-bold text-[7px] text-blue-300 leading-tight">{education.school}</p>
                <p className="text-[6px] opacity-80 leading-snug">{education.degree}</p>
                <p className="text-[5.5px] opacity-50">{education.date}</p>
              </div>
            </div>
          )}
        </div>

        {/* Main Body Column */}
        <div className={`flex-1 ${outerPadding} space-y-4 flex flex-col justify-start bg-slate-50/50`}>
          <div className="space-y-1">
            <h2 className={`${SectionHeaderSize} font-extrabold text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center justify-between`}>
              <span>自我评价 / SUMMARY</span>
            </h2>
            <p className={`${contentTextSize} text-slate-600 leading-relaxed`}>
              {summaryText}
            </p>
          </div>

          <div className="space-y-3">
            <h2 className={`${SectionHeaderSize} font-extrabold text-slate-900 border-b-2 border-slate-900 pb-1`}>
              <span>工作经历 / WORK EXPERIENCE</span>
            </h2>
            <div className="space-y-3">
              {experiences.map((exp, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="font-extrabold text-[8px] text-slate-800 leading-tight">{exp.company}</span>
                    <span className="text-[6.5px] text-slate-400 font-medium shrink-0">{exp.date}</span>
                  </div>
                  <p className="text-[7.5px] text-blue-600 font-bold leading-tight">{exp.position}</p>
                  <ul className="list-disc pl-3 text-[6.5px] text-slate-500 space-y-0.5 leading-normal">
                    {exp.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. CLASSIC TEMPLATE (Elegant, symmetric traditional layout with black line header)
  if (templateId === 'classic') {
    return (
      <div className={`w-full h-full bg-white text-slate-900 ${fontClass} ${outerPadding} space-y-4 flex flex-col select-none overflow-hidden`} style={{ fontSize: isThumbnail ? '6px' : '12px' }}>
        <header className="text-center space-y-1 pb-2 border-b-2 border-slate-900">
          <h1 className={`${nameSize} font-black text-slate-950 uppercase tracking-widest`}>{nameText}</h1>
          <p className={`${titleSize} text-slate-600 font-medium`}>{jobTitleText} {jobTitleSecondaryText ? `· ${jobTitleSecondaryText}` : ''}</p>
          <div className="flex justify-center gap-3 text-[6.5px] text-slate-500 font-semibold">
            <span>{contactInfo.email}</span>
            <span>•</span>
            <span>{contactInfo.phone}</span>
            <span>•</span>
            <span>{contactInfo.location}</span>
          </div>
        </header>

        <section className="space-y-1">
          <h2 className={`${SectionHeaderSize} font-bold uppercase border-b border-slate-350 pb-0.5 text-slate-900 tracking-wider`}>自我评价</h2>
          <p className={`${contentTextSize} text-slate-700 leading-relaxed`}>{summaryText}</p>
        </section>

        <section className="space-y-2.5">
          <h2 className={`${SectionHeaderSize} font-bold uppercase border-b border-slate-350 pb-0.5 text-slate-900 tracking-wider`}>工作经历</h2>
          <div className="space-y-2">
            {experiences.map((exp, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between font-bold text-[7.5px]">
                  <span className="text-slate-900">{exp.position}</span>
                  <span className="text-slate-500 font-medium">{exp.date}</span>
                </div>
                <div className="text-[7px] text-slate-600 font-medium">{exp.company}</div>
                <p className={`${contentTextSize} text-slate-600 leading-normal`}>{exp.bullets.join(' ')}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-1">
          <h2 className={`${SectionHeaderSize} font-bold uppercase border-b border-slate-350 pb-0.5 text-slate-900 tracking-wider`}>教育经历</h2>
          <div className="flex justify-between items-baseline text-[7px]">
            <div>
              <span className="font-bold text-slate-800">{education.school}</span>
              <span className="text-slate-400 mx-1.5">|</span>
              <span className="text-slate-600">{education.degree}</span>
            </div>
            <span className="text-slate-400 shrink-0">{education.date}</span>
          </div>
        </section>

        <section className="space-y-1">
          <h2 className={`${SectionHeaderSize} font-bold uppercase border-b border-slate-350 pb-0.5 text-slate-900 tracking-wider`}>技能专长</h2>
          <p className={`${contentTextSize} text-slate-700`}>
            <strong>技术技能:</strong> {skills.join(', ')}
          </p>
        </section>
      </div>
    );
  }

  // 3. MINIMAL TEMPLATE (Ultra minimal clean lines and airy, white visual layout)
  if (templateId === 'minimal') {
    return (
      <div className={`w-full h-full bg-white text-slate-800 ${fontClass} ${outerPadding} space-y-4 flex flex-col justify-between select-none overflow-hidden`} style={{ fontSize: isThumbnail ? '6px' : '12px' }}>
        <div className="space-y-4">
          <header className="space-y-1">
            <h1 className={`${nameSize} font-light text-slate-900 tracking-widest uppercase`}>{nameText}</h1>
            <p className={`${titleSize} text-slate-450 tracking-widest uppercase font-medium`}>{jobTitleText}</p>
            <div className="flex gap-4 text-[6px] text-slate-400 py-1 border-y border-slate-100">
              <span>{contactInfo.email}</span>
              <span>{contactInfo.phone}</span>
              <span>{contactInfo.location}</span>
            </div>
          </header>

          <section className="space-y-1">
            <p className={`${contentTextSize} text-slate-500 leading-relaxed font-light`}>
              “{summaryText}”
            </p>
          </section>

          <section className="space-y-2">
            <h2 className={`${SectionHeaderSize} font-light text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1`}>历任经历</h2>
            <div className="space-y-2">
              {experiences.map((exp, i) => (
                <div key={i} className="space-y-0.5">
                  <div className="flex justify-between items-baseline text-[7.5px]">
                    <span className="font-semibold text-slate-800">{exp.company}</span>
                    <span className="text-slate-400 text-[6px]">{exp.date}</span>
                  </div>
                  <p className="text-[6.5px] text-slate-500 font-medium">{exp.position}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-1">
            <h2 className={`${SectionHeaderSize} font-light text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1`}>专业教育</h2>
            <p className="text-[7px] text-slate-700 font-medium">{education.school} — <span className="text-slate-500 font-normal">{education.degree}</span></p>
          </section>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[5.5px] text-slate-400">
          <span>{skills.slice(0, 5).join(' / ')}</span>
          <span className="font-black">MINIMAL CV</span>
        </div>
      </div>
    );
  }

  // 4. EXECUTIVE TEMPLATE (Dark borders, centered headers, robust dividers)
  if (templateId === 'executive') {
    return (
      <div className={`w-full h-full bg-white text-slate-900 ${fontClass} flex flex-col justify-start select-none overflow-hidden`} style={{ fontSize: isThumbnail ? '6px' : '12px' }}>
        <header className={`${outerPadding} text-center space-y-1 border-b-4 border-slate-900 bg-slate-50/50`}>
          <h1 className={`${nameSize} font-black text-slate-950 uppercase tracking-tight`}>{nameText}</h1>
          <p className={`${titleSize} font-extrabold text-blue-700 tracking-widest uppercase`}>{jobTitleText}</p>
          <div className="flex justify-center gap-4 text-[6.5px] text-slate-500 font-semibold pt-0.5">
            <span>Email: {contactInfo.email}</span>
            <span>Tel: {contactInfo.phone}</span>
            <span>Loc: {contactInfo.location}</span>
          </div>
        </header>

        <div className="flex flex-1">
          {/* Main columns */}
          <div className="w-[60%] p-3 space-y-3.5 border-r border-slate-100 bg-white">
            <div className="space-y-1.5">
              <h2 className={`${SectionHeaderSize} font-black text-slate-900 flex items-center gap-1 uppercase tracking-wider`}>
                <span>专业简介</span>
                <span className="flex-1 h-[1px] bg-slate-200" />
              </h2>
              <p className={`${contentTextSize} text-slate-600 leading-normal font-light`}>{summaryText}</p>
            </div>

            <div className="space-y-2">
              <h2 className={`${SectionHeaderSize} font-black text-slate-900 flex items-center gap-1 uppercase tracking-wider`}>
                <span>实战履历</span>
                <span className="flex-1 h-[1px] bg-slate-200" />
              </h2>
              <div className="space-y-2">
                {experiences.map((exp, i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-[7.5px] text-slate-900">{exp.company}</span>
                      <span className="text-[6.5px] text-slate-400 font-black">{exp.date}</span>
                    </div>
                    <p className="text-[6.5px] text-blue-650 font-bold uppercase">{exp.position}</p>
                    <p className="text-[6px] text-slate-500 line-clamp-2 leading-relaxed">{exp.bullets[0]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex-1 p-3 bg-slate-50 space-y-3">
            <div className="space-y-1">
              <h2 className="text-[8px] font-black text-slate-400 uppercase tracking-wider">技术专长</h2>
              <div className="flex flex-col gap-1 pt-1">
                {skills.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[6.5px] text-slate-700 font-bold">
                    <div className="w-1 h-1 rounded-full bg-blue-600 shrink-0" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1 pt-1.5">
              <h2 className="text-[8px] font-black text-slate-400 uppercase tracking-wider">教育信息</h2>
              <div className="space-y-0.5">
                <p className="text-[6.5px] font-black text-slate-800 leading-tight">{education.school}</p>
                <p className="text-[6px] text-blue-600 font-bold">{education.degree}</p>
                <p className="text-[5.5px] text-slate-400">{education.date}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. TECH_FOCUSED TEMPLATE (Monospace code terminal style, timelines, boxed headers)
  if (templateId === 'tech_focused') {
    return (
      <div className={`w-full h-full bg-white text-slate-800 ${fontClass} ${outerPadding} space-y-3.5 flex flex-col select-none overflow-hidden`} style={{ fontSize: isThumbnail ? '6.0px' : '11px' }}>
        <header className="space-y-1 border-b-2 border-slate-900 pb-2">
          <div className="flex justify-between items-center">
            <h1 className={`${nameSize} font-black text-slate-950 tracking-tight`}>{nameText.toLowerCase()}_resume.sh</h1>
            <span className="text-[6px] font-black px-1.5 py-0.5 bg-slate-900 text-white rounded uppercase">{contactInfo.location}</span>
          </div>
          <div className="flex justify-between items-center text-[7px] font-semibold text-slate-600">
            <p className="text-blue-600 font-bold">{jobTitleText}</p>
            <p className="text-right">{contactInfo.email} | {contactInfo.phone}</p>
          </div>
        </header>

        <section className="space-y-1">
          <h2 className="text-[8px] font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 inline-block rounded"># EXECUTIVE_SUMMARY</h2>
          <p className={`${contentTextSize} text-slate-655 leading-relaxed pl-1.5 border-l-2 border-slate-200`}>
            {summaryText}
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-[8px] font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 inline-block rounded"># WORK_EXPERIENCE</h2>
          <div className="space-y-2 pl-2 border-l border-slate-100 relative">
            {experiences.map((exp, idx) => (
              <div key={idx} className="space-y-0.5 relative">
                <div className="absolute left-[-11px] top-1 w-1.5 h-1.5 rounded-full bg-slate-300 border-2 border-white" />
                <div className="flex justify-between items-baseline text-[7px]">
                  <span className="font-extrabold text-slate-900">{exp.company}</span>
                  <span className="text-[6px] text-slate-400 font-bold">{exp.date}</span>
                </div>
                <p className="text-[6.5px] text-slate-500 font-semibold">{exp.position}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-1">
          <h2 className="text-[8px] font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 inline-block rounded"># TECH_SKILL_MATRIX</h2>
          <div className="flex flex-wrap gap-1 text-[5.5px] font-bold">
            {skills.map(s => (
              <span key={s} className="px-1.5 py-0.5 border border-slate-200 rounded hover:bg-slate-50">{s}</span>
            ))}
          </div>
        </section>

        <section className="space-y-1">
          <h2 className="text-[8px] font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 inline-block rounded"># ACADEMIC_DEGREE</h2>
          <div className="flex justify-between text-[6.5px]">
            <span className="font-bold text-slate-700">{education.school} // {education.degree}</span>
            <span className="text-slate-400">{education.date}</span>
          </div>
        </section>
      </div>
    );
  }

  // 6. FINANCE_ELITE TEMPLATE (Centered premium navy headers, neat dividers, double border)
  if (templateId === 'finance_elite') {
    return (
      <div className={`w-full h-full bg-white text-slate-900 ${fontClass} ${outerPadding} space-y-3.5 flex flex-col select-none overflow-hidden border-t-4 border-slate-900`} style={{ fontSize: isThumbnail ? '6px' : '12px' }}>
        <header className="text-center space-y-0.5 pb-2 border-b-2 border-[#002B49]">
          <h1 className={`${nameSize} font-extrabold text-[#002B49] uppercase tracking-widest`}>{nameText}</h1>
          <p className={`${titleSize} text-[#1e3a8a] text-[7.5px] uppercase tracking-wider font-extrabold`}>{jobTitleText}</p>
          <div className="flex justify-center gap-2 text-[5.8px] text-slate-500 font-bold">
            <span>{contactInfo.email}</span>
            <span>|</span>
            <span>{contactInfo.phone}</span>
            <span>|</span>
            <span>{contactInfo.location}</span>
          </div>
        </header>

        <section className="space-y-1">
          <h2 className="text-[8px] font-extrabold text-[#002B49] border-b border-slate-300 pb-0.5 tracking-wide uppercase flex justify-between items-center">
            <span>专业自我评价 / SUMMARY</span>
            <span className="w-8 h-px bg-slate-300" />
          </h2>
          <p className={`${contentTextSize} text-slate-650 leading-relaxed`}>{summaryText}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-[8px] font-extrabold text-[#002B49] border-b border-slate-300 pb-0.5 tracking-wide uppercase flex justify-between items-center">
            <span>投行与资产管理经历 / EXPERIENCE</span>
            <span className="w-8 h-px bg-slate-300" />
          </h2>
          <div className="space-y-2">
            {experiences.map((exp, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[7.5px]">
                  <span className="font-extrabold text-slate-900">{exp.position}</span>
                  <span className="text-[6.2px] text-slate-400 font-bold">{exp.date}</span>
                </div>
                <p className="text-[6.5px] text-[#1e3a8a] font-extrabold">{exp.company}</p>
                <p className={`${contentTextSize} text-slate-650 leading-normal line-clamp-1`}>{exp.bullets[0]}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-1">
          <h2 className="text-[8px] font-extrabold text-[#002B49] border-b border-slate-300 pb-0.5 tracking-wide uppercase flex justify-between items-center">
            <span>核心专业技能 / FINANCE SKILLS</span>
            <span className="w-8 h-px bg-slate-300" />
          </h2>
          <div className="flex flex-wrap gap-1 text-[5px] font-bold">
            {skills.slice(0, 5).map(s => (
              <span key={s} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-705">{s}</span>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // 7. MEDICAL_ACADEMIC TEMPLATE (Dual column, mint medical accent sidebar, research sections)
  if (templateId === 'medical_academic') {
    return (
      <div className={`w-full h-full bg-white text-slate-800 ${fontClass} flex select-none overflow-hidden border-t-4 border-teal-700`} style={{ fontSize: isThumbnail ? '6px' : '12px' }}>
        <aside className="w-[32%] bg-gradient-to-b from-[#f0fdf4] to-teal-50/20 p-2.5 flex flex-col gap-3 border-r border-[#e6f4ea]">
          <div className="space-y-1">
            <h1 className="text-[12px] font-black text-slate-900 leading-tight">{nameText}</h1>
            <p className="text-teal-700 font-extrabold text-[5.5px] uppercase tracking-wider">{jobTitleText}</p>
          </div>
          <div className="space-y-1.5 text-[5.5px] text-slate-500 font-medium">
            <p className="truncate">{contactInfo.email}</p>
            <p>{contactInfo.phone}</p>
            <p>{contactInfo.location}</p>
          </div>
          <div className="space-y-1 border-t border-slate-200/60 pt-2">
            <h4 className="text-[6.5px] font-black text-slate-400 uppercase tracking-widest">教育背景</h4>
            <p className="text-[5.5px] font-black text-slate-800 leading-tight">{education.school}</p>
            <p className="text-[5px] text-teal-700 font-bold">{education.degree}</p>
          </div>
        </aside>
        <main className="flex-1 p-3.5 space-y-3">
          <section className="space-y-1">
            <h2 className="text-[7.5px] font-black text-emerald-800 tracking-wider uppercase border-l-2 border-emerald-600 pl-1.5">个人优势.科研综述</h2>
            <p className={`${contentTextSize} text-slate-650 leading-relaxed`}>{summaryText}</p>
          </section>
          <section className="space-y-1.5">
            <h2 className="text-[7.5px] font-black text-emerald-800 tracking-wider uppercase border-l-2 border-emerald-600 pl-1.5">SCI发表与临床实践</h2>
            <div className="space-y-1">
              {experiences.map((exp, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between text-[6.5px] font-bold">
                    <span className="text-emerald-700">{exp.company}</span>
                    <span className="text-slate-400 text-[5.5px]">{exp.date}</span>
                  </div>
                  <p className="text-[6.5px] text-slate-850 font-semibold">{exp.position}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  // 8. CREATIVE_DESIGNER TEMPLATE (Chic gradient header, off-white asymmetrical cells, design aesthetic)
  if (templateId === 'creative_designer') {
    return (
      <div className={`w-full h-full bg-white text-slate-800 ${fontClass} ${outerPadding} space-y-3.5 flex flex-col select-none overflow-hidden relative`} style={{ fontSize: isThumbnail ? '6px' : '12px' }}>
        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100/30 blur-[20px] rounded-full pointer-events-none" />
        <header className="flex justify-between items-end border-b border-indigo-100 pb-2 relative z-10">
          <div>
            <h1 className={`${nameSize} font-black text-slate-900 tracking-tight`}>{nameText}</h1>
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-pink-500 font-extrabold text-[5.5px] uppercase tracking-widest pl-0.5">
              {jobTitleText}
            </p>
          </div>
          <div className="text-[5.5px] text-slate-400 font-bold space-y-0.5 text-right">
            <p>{contactInfo.email}</p>
            <p>{contactInfo.phone}</p>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-3 flex-1 relative z-10">
          <div className="col-span-8 space-y-3">
            <section className="bg-indigo-50/20 p-2 rounded-xl text-[6.5px] border border-indigo-100/20">
              <p className="font-extrabold text-indigo-500 tracking-wider mb-0.5 uppercase flex items-center gap-0.5">🎨 核心定位</p>
              <p className={`${contentTextSize} text-slate-650 font-normal leading-normal`}>{summaryText}</p>
            </section>
            <section className="space-y-1.5">
              <h3 className="text-[7.5px] font-black text-slate-800 tracking-wider flex items-center justify-between">
                <span>标志性项目经历 / PORTFOLIO</span>
                <span className="flex-1 h-px bg-gradient-to-r from-indigo-150 to-transparent ml-2" />
              </h3>
              <div className="space-y-1">
                {experiences.slice(0, 2).map((exp, i) => (
                  <div key={i} className="pl-1.5 border-l border-indigo-150 space-y-0.5">
                    <p className="font-extrabold text-[7.5px] text-slate-950">{exp.position}</p>
                    <p className="text-[6.5px] text-indigo-500 font-semibold">{exp.company}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <div className="col-span-4 bg-[#fafafa] p-2 rounded-xl border border-slate-100 flex flex-col gap-2">
            <div className="space-y-1 mt-1">
              <p className="text-[6px] font-black text-slate-400 uppercase">技术专长</p>
              <div className="flex flex-wrap gap-1">
                {skills.slice(0, 4).map(s => (
                  <span key={s} className="px-1 py-0.5 bg-white border border-indigo-50 text-indigo-650 rounded text-[5px] font-bold">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 9. ENGINEERING_TECH TEMPLATE (Slate/Steel theme, hardhat grid, projects focus)
  if (templateId === 'engineering_tech') {
    return (
      <div className={`w-full h-full bg-white text-slate-800 ${fontClass} ${outerPadding} space-y-3.5 flex flex-col select-none overflow-hidden border-t-4 border-[#334155]`} style={{ fontSize: isThumbnail ? '6px' : '11px' }}>
        <header className="border-b border-[#334155] pb-2 text-[6.5px]">
          <div className="flex justify-between items-baseline">
            <div>
              <h1 className={`${nameSize} font-black text-slate-900 tracking-wider`}>{nameText}</h1>
              <p className="text-[6.5px] font-extrabold text-[#475569] uppercase pl-0.5">{jobTitleText}</p>
            </div>
            <div className="text-right text-[#334155]/85 font-extrabold pr-1.5 space-y-0.5 border-r-2 border-[#334155]">
              <p>{contactInfo.email}</p>
              <p>{contactInfo.phone}</p>
            </div>
          </div>
        </header>

        <section className="space-y-1">
          <h2 className="text-[7.5px] font-black text-[#1e293b] tracking-wider uppercase bg-[#e2e8f0] px-2 py-0.5 flex justify-between items-center">
            <span>工程建设经历汇总</span>
            <div className="w-1.5 h-1.5 bg-[#475569] rounded-sm" />
          </h2>
          <div className="space-y-1.5 pl-1">
            {experiences.map((exp, idx) => (
              <div key={idx} className="space-y-0.5 border-b border-slate-100 last:border-0 pb-1">
                <div className="flex justify-between items-baseline text-[7.5px]">
                  <span className="font-extrabold text-[#0f172a]">{exp.position}</span>
                  <span className="text-[6px] text-slate-400 leading-none">{exp.date}</span>
                </div>
                <p className="text-[6.2px] text-[#475569] font-extrabold">{exp.company}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-1">
          <h2 className="text-[7.5px] font-black text-[#1e293b] tracking-wider uppercase bg-[#e2e8f0] px-2 py-0.5 flex justify-between items-center">
            <span>执业资格及关键资产</span>
            <div className="w-1.5 h-1.5 bg-[#475569] rounded-sm" />
          </h2>
          <div className="flex flex-wrap gap-1 pl-1">
            {skills.slice(0, 4).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 rounded text-[5px] font-bold">{tag}</span>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // 10. ELEGANT TEMPLATE (Symmetrical elegant serif with red clay accent)
  if (templateId === 'elegant') {
    return (
      <div className={`w-full h-full bg-stone-50/60 text-stone-800 ${fontClass} ${outerPadding} space-y-3.5 flex flex-col select-none overflow-hidden`} style={{ fontSize: isThumbnail ? '6px' : '11px' }}>
        <header className="text-center space-y-1 pb-2 border-b-2 border-orange-200/50">
          <h1 className={`${nameSize} font-normal tracking-wider text-amber-900 uppercase font-serif`}>{nameText}</h1>
          <p className={`${titleSize} text-stone-500 font-semibold uppercase font-serif`}>{jobTitleText}</p>
        </header>
        <section className="space-y-1">
          <h2 className="text-[7.5px] font-bold uppercase tracking-widest text-[#9a3412]/80 text-center font-serif">自我评价</h2>
          <p className={`${contentTextSize} text-stone-600 text-center leading-normal line-clamp-1`}>{summaryText}</p>
        </section>
        <section className="space-y-1 flex-1">
          <h2 className="text-[7.5px] font-bold uppercase tracking-widest text-[#9a3412]/80 text-center font-serif border-b border-stone-200 pb-0.5">历任经历</h2>
          <div className="space-y-1 pt-1">
            {experiences.slice(0, 1).map((exp, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[7.5px]">
                  <span className="font-bold text-stone-900 font-serif">{exp.position}</span>
                  <span className="text-[6px] text-stone-400 font-serif">{exp.date}</span>
                </div>
                <p className="text-[6.2px] text-stone-500 font-serif">{exp.company}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // 11. TWO_COLUMN TEMPLATE (Left sidebar and right main area)
  if (templateId === 'two_column') {
    return (
      <div className={`w-full h-full bg-white text-slate-800 flex select-none overflow-hidden border-t-4 border-indigo-900`} style={{ fontSize: isThumbnail ? '6px' : '12px' }}>
        <aside className="w-[34%] bg-stone-50/80 p-2.5 flex flex-col gap-3 border-r border-[#e2e8f0]">
          <div>
            <h1 className="text-[11px] font-black text-indigo-950">{nameText}</h1>
            <p className="text-indigo-600 font-extrabold text-[5px] uppercase tracking-wider">{jobTitleText}</p>
          </div>
          <div className="space-y-1 border-t border-slate-250 pt-1.5 text-[5.5px] text-slate-450 font-bold">
            <p>{contactInfo.email}</p>
            <p>{contactInfo.phone}</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-[6px] font-black text-slate-400 uppercase">教育背景</h4>
            <p className="text-[5.5px] font-extrabold text-slate-800 leading-tight">{education.school}</p>
          </div>
        </aside>
        <main className="flex-1 p-3.5 space-y-3 bg-white">
          <section className="space-y-1">
            <h2 className="text-[7.5px] font-black text-indigo-950 uppercase flex items-center justify-between">
              <span>工作经历 / JOBS</span>
              <span className="flex-1 h-px bg-gradient-to-r from-indigo-150 to-transparent ml-2" />
            </h2>
            <div className="space-y-1 text-slate-600">
              {experiences.slice(0, 1).map((exp, idx) => (
                <div key={idx} className="space-y-0.5 pl-1.5 border-l-2 border-indigo-200">
                  <p className="font-extrabold text-[7.5px] text-slate-900">{exp.position}</p>
                  <p className="text-[6.5px] text-indigo-500 font-semibold">{exp.company}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  // 12. MARKETING_SALES TEMPLATE (High energy orange accents, growth target elements)
  if (templateId === 'marketing_sales') {
    return (
      <div className={`w-full h-full bg-white text-slate-800 ${fontClass} ${outerPadding} space-y-3.5 flex flex-col select-none overflow-hidden border-t-4 border-orange-500`} style={{ fontSize: isThumbnail ? '6px' : '11px' }}>
        <header className="border-b border-orange-100 pb-2 text-[6.5px]">
          <h1 className={`${nameSize} font-black text-slate-950`}>{nameText}</h1>
          <p className="text-[6px] font-black text-orange-600 uppercase tracking-widest pl-0.5">{jobTitleText}</p>
        </header>
        <section className="bg-orange-50/40 p-2 rounded-lg border border-orange-100 space-y-0.5">
          <p className={`${contentTextSize} text-slate-655 font-medium leading-normal line-clamp-1`}>{summaryText}</p>
        </section>
        <section className="space-y-1 flex-1">
          <h2 className="text-[7.5px] font-black text-orange-850 uppercase tracking-wider border-b border-orange-100 pb-0.5">🚀 战役及项目成果</h2>
          <div className="space-y-1 pt-1">
            {experiences.slice(0, 1).map((exp, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[7.5px]">
                  <span className="font-extrabold text-slate-900">{exp.position}</span>
                  <span className="text-[6px] text-orange-600 font-mono font-bold">{exp.date}</span>
                </div>
                <p className="text-[6.2px] text-orange-700/80 font-bold">{exp.company}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // 13. LEGAL_CONSULTING TEMPLATE (Dignified double line, Scale details)
  if (templateId === 'legal_consulting') {
    return (
      <div className={`w-full h-full bg-white text-slate-800 ${fontClass} ${outerPadding} space-y-3.5 flex flex-col select-none overflow-hidden border-x-4 border-slate-900`} style={{ fontSize: isThumbnail ? '6px' : '11px' }}>
        <header className="text-center space-y-1 pb-2 border-b-4 border-double border-slate-900">
          <h1 className={`${nameSize} font-extrabold text-slate-900 uppercase tracking-wider font-serif`}>{nameText}</h1>
          <p className={`${titleSize} text-slate-500 font-semibold uppercase font-serif`}>{jobTitleText}</p>
        </header>
        <section className="space-y-1">
          <h2 className="text-[7.5px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-300 pb-0.5 font-serif">I. 专业陈述 / SUMMARY</h2>
          <p className={`${contentTextSize} text-slate-650 leading-relaxed font-serif line-clamp-1`}>{summaryText}</p>
        </section>
        <section className="space-y-1.5 flex-1">
          <h2 className="text-[7.5px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-300 pb-0.5 font-serif">II. 合规执业与顾问 / ADVISORY</h2>
          <div className="space-y-1 pt-0.5">
            {experiences.slice(0, 1).map((exp, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[7.2px]">
                  <span className="font-bold text-slate-900 font-serif">{exp.position}</span>
                  <span className="text-[5.5px] text-slate-500 font-serif">{exp.date}</span>
                </div>
                <p className="text-[6.2px] text-slate-700 font-serif">{exp.company}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // Fallback template container (Safeguard)
  return (
    <div className={`w-full h-full bg-white text-slate-800 ${fontClass} ${outerPadding} space-y-4`}>
      <h1 className={nameSize}>壹页简历</h1>
      <p className={titleSize}>高级产品经理</p>
      <div className="space-y-2">
        <div className="h-4 bg-slate-100 rounded" />
        <div className="h-4 bg-slate-100 rounded" />
      </div>
    </div>
  );
};
