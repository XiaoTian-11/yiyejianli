import React from 'react';
import { TemplateProps, ResumeSection } from '../types';
import { getBilingualValue, renderBilingualHTML, getBilingualSkills } from '../lib/bilingual';

const SafeHTML: React.FC<{ html: string; className?: string }> = ({ html, className }) => {
  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export const ExecutiveTemplate: React.FC<TemplateProps> = ({ data }) => {
  const mode = data.displayMode || 'primary';

  const renderSection = (section: ResumeSection) => {
    const title = getBilingualValue(section.title, section.title_secondary, mode);

    switch (section.type) {
      case 'summary':
        if (!data.summary) return null;
        return (
          <section key={section.id} className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-4">
              {title} <div className="flex-1 h-px bg-slate-100" />
            </h2>
            <SafeHTML 
              html={renderBilingualHTML(data.summary, data.summary_secondary, mode)} 
              className="text-base leading-relaxed text-slate-600 whitespace-pre-line" 
            />
          </section>
        );
      case 'experience':
        if (data.experience.length === 0) return null;
        return (
          <section key={section.id} className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-4">
              {title} <div className="flex-1 h-px bg-slate-100" />
            </h2>
            <div className="space-y-8">
              {data.experience.map((exp) => (
                <div key={exp.id} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-lg font-black text-slate-900">
                      {getBilingualValue(exp.position, exp.position_secondary, mode)}
                    </h3>
                    <span className="text-sm font-bold text-slate-400 shrink-0 ml-4">
                      {getBilingualValue(exp.startDate, exp.startDate_secondary, mode)} — {getBilingualValue(exp.endDate, exp.endDate_secondary, mode)}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-blue-600 uppercase tracking-wider">
                    {getBilingualValue(exp.company, exp.company_secondary, mode)}
                  </p>
                  <SafeHTML 
                    html={renderBilingualHTML(exp.description, exp.description_secondary, mode)} 
                    className="text-sm text-slate-600 leading-relaxed" 
                  />
                </div>
              ))}
            </div>
          </section>
        );
      case 'projects':
        if (data.projects.length === 0) return null;
        return (
          <section key={section.id} className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-4">
              {title} <div className="flex-1 h-px bg-slate-100" />
            </h2>
            <div className="grid grid-cols-1 gap-6">
              {data.projects.map((project) => (
                <div key={project.id} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-black text-slate-800">
                        {getBilingualValue(project.name, project.name_secondary, mode)}
                      </h3>
                      {project.role && (
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          — {getBilingualValue(project.role, project.role_secondary, mode)}
                        </span>
                      )}
                    </div>
                    {(project.startDate || project.endDate) && (
                      <span className="text-[10px] font-bold text-slate-400 shrink-0 font-mono ml-4">
                        {getBilingualValue(project.startDate || '', project.startDate_secondary || '', mode)} — {getBilingualValue(project.endDate || '', project.endDate_secondary || '', mode)}
                      </span>
                    )}
                  </div>
                  <SafeHTML 
                    html={renderBilingualHTML(project.description, project.description_secondary, mode)} 
                    className="text-sm text-slate-600 leading-relaxed" 
                  />
                </div>
              ))}
            </div>
          </section>
        );
      case 'custom':
        const custom = data.customSections?.find(cs => cs.id === section.customId);
        if (!custom || custom.items.length === 0) return null;
        return (
          <section key={section.id} className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-4">
              {title} <div className="flex-1 h-px bg-slate-100" />
            </h2>
            <div className="space-y-4">
              {custom.items.map((item) => (
                <div key={item.id} className="space-y-1">
                  <h3 className="font-bold text-slate-800">
                    {getBilingualValue(item.title, item.title_secondary, mode)}
                  </h3>
                  <SafeHTML 
                    html={renderBilingualHTML(item.content, item.content_secondary, mode)} 
                    className="text-slate-600 text-sm leading-relaxed" 
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

  const sidebarSections = ['education', 'skills'];
  const mainSections = data.sections.filter(s => !sidebarSections.includes(s.type) && s.type !== 'personal');

  const skillsToRender = getBilingualSkills(data.skills, data.skills_secondary, mode);

  return (
    <div className="flex flex-col h-full bg-white font-serif text-slate-800 shadow-xl overflow-hidden print:shadow-none">
      {/* Header */}
      <header className="p-10 border-b-4 border-slate-900 flex flex-col items-center text-center space-y-4">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900">
            {getBilingualValue(data.personalInfo.fullName, data.personalInfo.fullName_secondary, mode)}
          </h1>
          <p className="text-xl font-bold text-blue-600 mt-1 uppercase tracking-widest">
            {getBilingualValue(data.personalInfo.jobTitle, data.personalInfo.jobTitle_secondary, mode)}
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm font-medium text-slate-500">
          <span>{data.personalInfo.email}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2" />
          <span>{data.personalInfo.phone}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2" />
          <span>{getBilingualValue(data.personalInfo.location || '', data.personalInfo.location_secondary, mode)}</span>
          {data.personalInfo.website && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2" />
              <span>{data.personalInfo.website}</span>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Main Column */}
        <div className="flex-[1.5] p-10 space-y-10 border-r border-slate-100">
          {mainSections.map(renderSection)}
        </div>

        {/* Sidebar */}
        <div className="flex-1 bg-slate-50 p-10 space-y-10">
          {skillsToRender.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                {getBilingualValue('专业技能', 'Skills', mode)}
              </h2>
              <div className="flex flex-col gap-2">
                {skillsToRender.map((skill, index) => (
                  <div key={index} className="flex items-center gap-3 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                      {skill}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.education.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                {getBilingualValue('教育背景', 'Education', mode)}
              </h2>
              <div className="space-y-6">
                {data.education.map((edu) => (
                  <div key={edu.id} className="space-y-1">
                    <p className="text-sm font-black text-slate-880 leading-tight">
                      {getBilingualValue(edu.school, edu.school_secondary, mode)}
                    </p>
                    <p className="text-xs font-bold text-blue-600">
                      {getBilingualValue(edu.degree, edu.degree_secondary, mode)}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {getBilingualValue(edu.startDate, edu.startDate_secondary, mode)} — {getBilingualValue(edu.endDate, edu.endDate_secondary, mode)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="pt-10 space-y-4">
             <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                 {getBilingualValue('联系偏好', 'Preferences', mode)}
               </p>
               <div className="space-y-2">
                 <p className="text-xs text-slate-600">
                   {getBilingualValue('优先邮件形式沟通', 'Email preferred', mode)}
                 </p>
                 <p className="text-xs text-slate-600">
                   {getBilingualValue('全天候可进行线上面试', 'Online interview available', mode)}
                 </p>
               </div>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};
