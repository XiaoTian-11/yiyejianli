import React from 'react';
import { TemplateProps, ResumeSection } from '../types';
import { Mail, Phone, MapPin, Globe, Award, Sparkles, GraduationCap } from 'lucide-react';
import { getBilingualValue, renderBilingualHTML, getBilingualSkills } from '../lib/bilingual';

const SafeHTML: React.FC<{ html: string; className?: string }> = ({ html, className }) => {
  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export const TwoColumnTemplate: React.FC<TemplateProps> = ({ data }) => {
  const mode = data.displayMode || 'primary';

  const renderRightSection = (section: ResumeSection) => {
    const title = getBilingualValue(section.title, section.title_secondary, mode);

    switch (section.type) {
      case 'summary':
        if (!data.summary) return null;
        return (
          <section key={section.id} className="space-y-2 pb-4 border-b border-indigo-50">
            <h2 className="text-xs font-black text-indigo-900 tracking-wider uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              {title}
            </h2>
            <SafeHTML 
              html={renderBilingualHTML(data.summary, data.summary_secondary, mode)} 
              className="text-xs text-slate-600 leading-relaxed text-justify" 
            />
          </section>
        );
      case 'experience':
        if (data.experience.length === 0) return null;
        return (
          <section key={section.id} className="space-y-4">
            <h2 className="text-sm font-black text-indigo-900 tracking-wider uppercase flex items-center justify-between">
              <span>{title}</span>
              <span className="flex-1 h-0.5 bg-gradient-to-r from-indigo-100 to-transparent ml-4" />
            </h2>
            <div className="space-y-4">
              {data.experience.map((exp) => (
                <div key={exp.id} className="space-y-1 pl-3 border-l-2 border-indigo-150">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-extrabold text-xs text-slate-900">
                      {getBilingualValue(exp.position, exp.position_secondary, mode)}
                    </h3>
                    <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">
                      {getBilingualValue(exp.startDate, exp.startDate_secondary, mode)} — {getBilingualValue(exp.endDate, exp.endDate_secondary, mode)}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-indigo-600">
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
            <h2 className="text-sm font-black text-indigo-900 tracking-wider uppercase flex items-center justify-between">
              <span>{title}</span>
              <span className="flex-1 h-0.5 bg-gradient-to-r from-indigo-100 to-transparent ml-4" />
            </h2>
            <div className="space-y-3">
              {data.projects.map((project) => (
                <div key={project.id} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <div className="flex flex-col gap-0.5">
                      <h3 className="font-extrabold text-xs text-slate-800">
                        {getBilingualValue(project.name, project.name_secondary, mode)}
                      </h3>
                      {project.role && (
                        <span className="text-[10px] text-indigo-600 font-semibold">
                          {getBilingualValue(project.role, project.role_secondary, mode)}
                        </span>
                      )}
                    </div>
                    {(project.startDate || project.endDate) && (
                      <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-4">
                        {getBilingualValue(project.startDate || '', project.startDate_secondary || '', mode)} — {getBilingualValue(project.endDate || '', project.endDate_secondary || '', mode)}
                      </span>
                    )}
                  </div>
                  <SafeHTML 
                    html={renderBilingualHTML(project.description, project.description_secondary, mode)} 
                    className="text-xs text-slate-500 leading-relaxed" 
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
          <section key={section.id} className="space-y-3">
            <h2 className="text-sm font-black text-indigo-900 tracking-wider uppercase flex items-center justify-between">
              <span>{title}</span>
              <span className="flex-1 h-0.5 bg-gradient-to-r from-indigo-100 to-transparent ml-4" />
            </h2>
            <div className="space-y-3">
              {custom.items.map((item) => (
                <div key={item.id} className="space-y-1">
                  <h3 className="font-bold text-xs text-indigo-950">
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
  const leftSections = ['education', 'skills'];
  const rightSections = data.sections.filter(s => !leftSections.includes(s.type) && s.type !== 'personal');

  return (
    <div className="flex flex-col md:flex-row min-h-[1100px] bg-white text-slate-800 font-sans border-t-8 border-indigo-900 shadow-xl overflow-hidden print:shadow-none">
      {/* Left Column (35% sidebar) */}
      <aside className="w-full md:w-[35%] bg-slate-50 p-6 flex flex-col gap-6 select-none border-r border-indigo-100/40 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-indigo-950 uppercase tracking-tight leading-tight">
            {getBilingualValue(data.personalInfo.fullName, data.personalInfo.fullName_secondary, mode)}
          </h1>
          <p className="text-indigo-600 font-extrabold text-xs mt-1 uppercase tracking-wider">
            {getBilingualValue(data.personalInfo.jobTitle, data.personalInfo.jobTitle_secondary, mode)}
          </p>
        </div>

        {/* Contact list inside left panel */}
        <div className="space-y-2 text-xs border-t border-indigo-100/50 pt-4">
          <p className="flex items-center gap-2.5 text-slate-600">
            <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate">{data.personalInfo.email}</span>
          </p>
          <p className="flex items-center gap-2.5 text-slate-600">
            <Phone className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{data.personalInfo.phone}</span>
          </p>
          <p className="flex items-center gap-2.5 text-slate-600">
            <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{getBilingualValue(data.personalInfo.location || '', data.personalInfo.location_secondary, mode)}</span>
          </p>
          {data.personalInfo.website && (
            <p className="flex items-center gap-2.5 text-slate-600">
              <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="truncate">{data.personalInfo.website}</span>
            </p>
          )}
        </div>

        {/* Education on Left Column */}
        {data.education.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-indigo-100/50">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
              教育背景
            </h4>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="space-y-0.5">
                  <p className="font-extrabold text-[11px] text-indigo-950 leading-tight">
                    {getBilingualValue(edu.school, edu.school_secondary, mode)}
                  </p>
                  <p className="text-[10px] text-indigo-600 font-bold">
                    {getBilingualValue(edu.degree, edu.degree_secondary, mode)}
                  </p>
                  <p className="text-[9px] text-slate-400">
                    {getBilingualValue(edu.startDate, edu.startDate_secondary, mode)} — {getBilingualValue(edu.endDate, edu.endDate_secondary, mode)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills on Left Column */}
        {skillsToRender.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-indigo-100/50">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
              <Award className="w-3.5 h-3.5 text-indigo-500" />
              掌握技能
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {skillsToRender.map((s) => (
                <span key={s} className="px-2 py-0.5 bg-indigo-50/50 text-indigo-950 border border-indigo-100/30 rounded text-[10px] font-medium tracking-wide">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Right Column (65% mainstream space) */}
      <main className="flex-1 p-6 space-y-5">
        {rightSections.map(renderRightSection)}
      </main>
    </div>
  );
};
