import React from 'react';
import { TemplateProps, ResumeSection } from '../types';
import { getBilingualValue, renderBilingualHTML, getBilingualSkills } from '../lib/bilingual';

const SafeHTML: React.FC<{ html: string; className?: string }> = ({ html, className }) => {
  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export const TechFocusedTemplate: React.FC<TemplateProps> = ({ data }) => {
  const mode = data.displayMode || 'primary';

  const renderSection = (section: ResumeSection) => {
    const title = getBilingualValue(section.title, section.title_secondary, mode);

    switch (section.type) {
      case 'summary':
        if (!data.summary) return null;
        return (
          <section key={section.id} className="space-y-2">
            <h2 className="text-lg font-black bg-slate-100 px-3 py-1 inline-block">{title}</h2>
            <SafeHTML 
              html={renderBilingualHTML(data.summary, data.summary_secondary, mode)} 
              className="text-sm leading-relaxed text-slate-600 border-l-4 border-slate-200 pl-4 whitespace-pre-line" 
            />
          </section>
        );
      case 'skills':
        if (data.skills.length === 0) return null;
        const skillsToRender = getBilingualSkills(data.skills, data.skills_secondary, mode);
        return (
          <section key={section.id} className="space-y-4">
            <h2 className="text-lg font-black bg-slate-100 px-3 py-1 inline-block">{title}</h2>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {skillsToRender.map((skill, index) => (
                <span key={index} className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 transition-colors">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        );
      case 'experience':
        if (data.experience.length === 0) return null;
        return (
          <section key={section.id} className="space-y-6">
            <h2 className="text-lg font-black bg-slate-100 px-3 py-1 inline-block">{title}</h2>
            <div className="space-y-6">
              {data.experience.map((exp) => (
                <div key={exp.id} className="space-y-1 relative pl-6 border-l border-slate-100">
                  <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-black text-slate-900">
                      {getBilingualValue(exp.position, exp.position_secondary, mode)} @ {getBilingualValue(exp.company, exp.company_secondary, mode)}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0 ml-4">
                      {getBilingualValue(exp.startDate, exp.startDate_secondary, mode)} :: {getBilingualValue(exp.endDate, exp.endDate_secondary, mode)}
                    </span>
                  </div>
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
            <h2 className="text-lg font-black bg-slate-100 px-3 py-1 inline-block">{title}</h2>
            <div className="grid grid-cols-1 gap-4">
              {data.projects.map((project) => (
                <div key={project.id} className="p-4 border border-slate-100 rounded-lg space-y-2 hover:border-slate-300 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-black text-slate-800">
                        {getBilingualValue(project.name, project.name_secondary, mode)}
                      </h3>
                      {project.role && (
                        <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">
                          {getBilingualValue(project.role, project.role_secondary, mode)}
                        </span>
                      )}
                    </div>
                    {(project.startDate || project.endDate) && (
                      <span className="text-[10px] text-slate-500 font-mono shrink-0 font-bold ml-4">
                        {getBilingualValue(project.startDate || '', project.startDate_secondary || '', mode)} — {getBilingualValue(project.endDate || '', project.endDate_secondary || '', mode)}
                      </span>
                    )}
                  </div>
                  <SafeHTML 
                    html={renderBilingualHTML(project.description, project.description_secondary, mode)} 
                    className="text-[11px] text-slate-600 leading-snug" 
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
            <h2 className="text-lg font-black bg-slate-100 px-3 py-1 inline-block">{title}</h2>
            <div className="space-y-2">
              {data.education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-4">
                    <span className="font-black text-slate-800">
                      {getBilingualValue(edu.school, edu.school_secondary, mode)}
                    </span>
                    <span className="text-slate-500 text-xs">
                      // {getBilingualValue(edu.degree, edu.degree_secondary, mode)}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-4">
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
            <h2 className="text-lg font-black bg-slate-100 px-3 py-1 inline-block">{title}</h2>
            <div className="space-y-4">
              {custom.items.map((item) => (
                <div key={item.id} className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">
                    {getBilingualValue(item.title, item.title_secondary, mode)}
                  </h3>
                  <SafeHTML 
                    html={renderBilingualHTML(item.content, item.content_secondary, mode)} 
                    className="text-slate-600 text-xs leading-relaxed" 
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

  return (
    <div className="flex flex-col h-full bg-white font-mono p-12 text-slate-800 space-y-8 shadow-xl overflow-hidden print:shadow-none">
      {/* Name and Title */}
      <header className="space-y-2 border-b-2 border-slate-800 pb-6">
        <h1 className="text-4xl font-black text-slate-900">
          {getBilingualValue(data.personalInfo.fullName, data.personalInfo.fullName_secondary, mode)}
        </h1>
        <div className="flex justify-between items-center text-sm font-bold">
          <p className="px-2 py-1 bg-slate-900 text-white rounded">
            {getBilingualValue(data.personalInfo.jobTitle, data.personalInfo.jobTitle_secondary, mode)}
          </p>
          <div className="flex gap-4 text-slate-500">
            <span>{data.personalInfo.email}</span>
            <span>{data.personalInfo.phone}</span>
          </div>
        </div>
        <div className="flex gap-4 text-xs font-bold text-slate-400">
          <span>Location: {getBilingualValue(data.personalInfo.location || '', data.personalInfo.location_secondary, mode)}</span>
          {data.personalInfo.website && <span>Site: {data.personalInfo.website}</span>}
        </div>
      </header>

      {data.sections.filter(s => s.type !== 'personal').map(renderSection)}
    </div>
  );
};
