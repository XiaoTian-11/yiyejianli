import React from 'react';
import { TemplateProps, ResumeSection } from '../types';
import { Mail, Phone, MapPin, Globe, Sparkles } from 'lucide-react';
import { getBilingualValue, renderBilingualHTML, getBilingualSkills } from '../lib/bilingual';
import { ResumePhoto } from '../components/ResumePhoto';

const SafeHTML: React.FC<{ html: string; className?: string }> = ({ html, className }) => {
  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export const CreativeDesignerTemplate: React.FC<TemplateProps> = ({ data }) => {
  const mode = data.displayMode || 'primary';

  const renderSection = (section: ResumeSection) => {
    const title = getBilingualValue(section.title, section.title_secondary, mode);

    switch (section.type) {
      case 'summary':
        if (!data.summary) return null;
        return (
          <section key={section.id} className="p-4 bg-indigo-50/30 rounded-3xl border border-indigo-100/40 space-y-2">
            <h2 className="text-xs font-black text-indigo-600 tracking-wider uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              {title}
            </h2>
            <SafeHTML 
              html={renderBilingualHTML(data.summary, data.summary_secondary, mode)} 
              className="text-xs text-slate-600 leading-relaxed" 
            />
          </section>
        );
      case 'experience':
        if (data.experience.length === 0) return null;
        return (
          <section key={section.id} className="space-y-4">
            <h2 className="text-sm font-black text-slate-800 tracking-wider uppercase flex items-center justify-between">
              <span>{title}</span>
              <span className="flex-1 h-px bg-gradient-to-r from-indigo-200 to-transparent ml-4" />
            </h2>
            <div className="space-y-4">
              {data.experience.map((exp) => (
                <div key={exp.id} className="group relative pl-4 border-l border-indigo-100 space-y-1 hover:border-indigo-400 transition-colors">
                  <div className="absolute left-[-2.5px] top-1.5 w-1 h-1 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform" />
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-extrabold text-sm text-slate-900">
                      {getBilingualValue(exp.position, exp.position_secondary, mode)}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400">
                      {getBilingualValue(exp.startDate, exp.startDate_secondary, mode)} — {getBilingualValue(exp.endDate, exp.endDate_secondary, mode)}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-indigo-600">
                    {getBilingualValue(exp.company, exp.company_secondary, mode)}
                  </p>
                  <SafeHTML 
                    html={renderBilingualHTML(exp.description, exp.description_secondary, mode)} 
                    className="text-xs text-slate-500 leading-relaxed" 
                  />
                </div>
              ))}
            </div>
          </section>
        );
      case 'projects':
        if (data.projects.length === 0) return null;
        return (
          <section key={section.id} className="space-y-4">
            <h2 className="text-sm font-black text-slate-800 tracking-wider uppercase flex items-center justify-between">
              <span>{title}</span>
              <span className="flex-1 h-px bg-gradient-to-r from-indigo-200 to-transparent ml-4" />
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {data.projects.map((project) => (
                <div key={project.id} className="p-4 bg-[#fafafa] hover:bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-500/5 transition-all space-y-1">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-0.5">
                      <h3 className="font-extrabold text-xs text-slate-800">
                        {getBilingualValue(project.name, project.name_secondary, mode)}
                      </h3>
                      {project.role && (
                        <span className="text-[10px] text-indigo-500 font-medium">
                          {getBilingualValue(project.role, project.role_secondary, mode)}
                        </span>
                      )}
                    </div>
                    {(project.startDate || project.endDate) && (
                      <span className="text-[9px] text-[#94a3b8] tracking-wider shrink-0 font-mono">
                        {getBilingualValue(project.startDate || '', project.startDate_secondary || '', mode)} — {getBilingualValue(project.endDate || '', project.endDate_secondary || '', mode)}
                      </span>
                    )}
                  </div>
                  <SafeHTML 
                    html={renderBilingualHTML(project.description, project.description_secondary, mode)} 
                    className="text-[11px] text-slate-500 leading-relaxed" 
                  />
                </div>
              ))}
            </div>
          </section>
        );
      case 'education':
        if (data.education.length === 0) return null;
        return (
          <section key={section.id} className="space-y-4">
            <h2 className="text-sm font-black text-slate-800 tracking-wider uppercase flex items-center justify-between">
              <span>{title}</span>
              <span className="flex-1 h-px bg-gradient-to-r from-indigo-200 to-transparent ml-4" />
            </h2>
            <div className="space-y-2">
              {data.education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline">
                  <div>
                    <span className="font-extrabold text-xs text-slate-900">
                      {getBilingualValue(edu.school, edu.school_secondary, mode)}
                    </span>
                    <span className="text-indigo-600 text-xs ml-3 font-semibold">
                      {getBilingualValue(edu.degree, edu.degree_secondary, mode)}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {getBilingualValue(edu.startDate, edu.startDate_secondary, mode)} — {getBilingualValue(edu.endDate, edu.endDate_secondary, mode)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        );
      case 'custom':
        const custom = data.customSections?.find(cs => cs.id === section.customId);
        if (!custom || custom.items.length === 0) return null;
        return (
          <section key={section.id} className="space-y-4">
            <h2 className="text-sm font-black text-slate-800 tracking-wider uppercase flex items-center justify-between">
              <span>{title}</span>
              <span className="flex-1 h-px bg-gradient-to-r from-indigo-200 to-transparent ml-4" />
            </h2>
            <div className="space-y-3">
              {custom.items.map((item) => (
                <div key={item.id} className="space-y-1">
                  <h3 className="font-bold text-xs text-indigo-900">
                    {getBilingualValue(item.title, item.title_secondary, mode)}
                  </h3>
                  <SafeHTML 
                    html={renderBilingualHTML(item.content, item.content_secondary, mode)} 
                    className="text-xs text-slate-500 leading-relaxed" 
                  />
                </div>
              ))}
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  const skillsToRender = getBilingualSkills(data.skills, data.skills_secondary, mode);

  return (
    <div className="block min-h-[1100px] bg-white text-slate-800 px-10 py-10 space-y-6 font-sans relative overflow-hidden shadow-xl border border-indigo-50/50 print:shadow-none">
      {/* Decorative colored blobs for aesthetic artistic design */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-200/20 blur-[100px] rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-100/10 blur-[100px] rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Modern Asymmetric Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-indigo-100 pb-5 gap-4 relative z-10">
        <div className="space-y-1">
          <ResumePhoto photo={data.personalInfo.photo} fullName={data.personalInfo.fullName} />
          <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">
            {getBilingualValue(data.personalInfo.fullName, data.personalInfo.fullName_secondary, mode)}
          </h1>
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-500 font-extrabold text-sm uppercase tracking-widest pl-0.5">
            {getBilingualValue(data.personalInfo.jobTitle, data.personalInfo.jobTitle_secondary, mode)}
          </p>
        </div>

        {/* Dynamic contacts pill list */}
        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
          <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <Mail className="w-3.5 h-3.5 text-indigo-500" />
            {data.personalInfo.email}
          </span>
          <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <Phone className="w-3.5 h-3.5 text-indigo-500" />
            {data.personalInfo.phone}
          </span>
          <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            {getBilingualValue(data.personalInfo.location || '', data.personalInfo.location_secondary, mode)}
          </span>
          {data.personalInfo.website && (
            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              {data.personalInfo.website}
            </span>
          )}
        </div>
      </header>

      {/* Main Grid: Split column design */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10-grid">
        {/* Left column (60%) */}
        <div className="md:col-span-8 space-y-6">
          {data.sections
            .filter(s => s.type !== 'personal' && s.type !== 'skills')
            .map(s => renderSection(s))}
        </div>

        {/* Right column (40%) */}
        <div className="md:col-span-4 space-y-6">
          {/* Render Skills separately in gorgeous pill groups with gradient border tags */}
          {skillsToRender.length > 0 && (
            <section className="p-5 bg-[#fafafa]/80 backdrop-blur border border-slate-150 rounded-3xl space-y-3">
              <h3 className="text-xs font-black text-slate-800 tracking-wider uppercase border-b border-slate-200 pb-2">
                核心创意工具及专业技能
              </h3>
              <div className="flex flex-wrap gap-2">
                {skillsToRender.map((s) => (
                  <span key={s} className="px-2.5 py-1.5 bg-white text-indigo-750 rounded-xl border border-indigo-50/70 text-[10px] font-extrabold shadow-sm transition-all hover:scale-105 active:scale-95 duration-300">
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Education background rendered nicely on right column if preferred */}
          {data.sections.find(s => s.type === 'education') && (
            <div className="p-5 bg-gradient-to-br from-indigo-50/10 to-pink-50/10 backdrop-blur-sm border border-indigo-100/20 rounded-3xl space-y-3">
              <h3 className="text-xs font-black text-slate-800 tracking-wider uppercase border-b border-indigo-105/20 pb-2">
                学院派背书
              </h3>
              <div className="space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id} className="space-y-0.5">
                    <p className="font-extrabold text-xs text-slate-900 leading-tight">
                      {getBilingualValue(edu.school, edu.school_secondary, mode)}
                    </p>
                    <p className="text-[10px] text-indigo-600 font-bold">
                      {getBilingualValue(edu.degree, edu.degree_secondary, mode)}
                    </p>
                    <p className="text-[9px] text-[#9ca3af]">
                      {getBilingualValue(edu.startDate, edu.startDate_secondary, mode)} — {getBilingualValue(edu.endDate, edu.endDate_secondary, mode)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
