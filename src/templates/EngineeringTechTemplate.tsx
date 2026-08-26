import React from 'react';
import { TemplateProps, ResumeSection } from '../types';
import { Mail, Phone, MapPin, Globe, ShieldAlert, Hammer, HardHat } from 'lucide-react';
import { getBilingualValue, renderBilingualHTML, getBilingualSkills } from '../lib/bilingual';
import { ResumePhoto } from '../components/ResumePhoto';

const SafeHTML: React.FC<{ html: string; className?: string }> = ({ html, className }) => {
  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export const EngineeringTechTemplate: React.FC<TemplateProps> = ({ data }) => {
  const mode = data.displayMode || 'primary';

  const renderSection = (section: ResumeSection) => {
    const title = getBilingualValue(section.title, section.title_secondary, mode);

    switch (section.type) {
      case 'summary':
        if (!data.summary) return null;
        return (
          <section key={section.id} className="space-y-2">
            <h2 className="text-xs font-black text-[#1e293b] tracking-wider uppercase bg-[#e2e8f0] px-4 py-1.5 flex items-center justify-between">
              <span>{title}</span>
              <HardHat className="w-4 h-4 text-[#475569]" />
            </h2>
            <SafeHTML 
              html={renderBilingualHTML(data.summary, data.summary_secondary, mode)} 
              className="text-xs text-slate-700 leading-relaxed whitespace-pre-line text-justify pl-1" 
            />
          </section>
        );
      case 'skills':
        if (data.skills.length === 0) return null;
        const skillsToRender = getBilingualSkills(data.skills, data.skills_secondary, mode);
        return (
          <section key={section.id} className="space-y-3">
            <h2 className="text-xs font-black text-[#1e293b] tracking-wider uppercase bg-[#e2e8f0] px-4 py-1.5 flex items-center justify-between">
              <span>{title}</span>
              <HardHat className="w-4 h-4 text-[#475569]" />
            </h2>
            <div className="flex flex-wrap gap-2 pl-1">
              {skillsToRender.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-white border-2 border-slate-300 rounded-lg text-xs font-bold text-slate-705 tracking-wide shadow-sm flex items-center gap-1 hover:bg-[#f8fafc] transition-colors">
                  <div className="w-1.5 h-1.5 bg-[#475569] rounded-sm shrink-0" />
                  {skill}
                </span>
              ))}
            </div>
          </section>
        );
      case 'experience':
        if (data.experience.length === 0) return null;
        return (
          <section key={section.id} className="space-y-3">
            <h2 className="text-xs font-black text-[#1e293b] tracking-wider uppercase bg-[#e2e8f0] px-4 py-1.5 flex items-center justify-between">
              <span>{title}</span>
              <HardHat className="w-4 h-4 text-[#475569]" />
            </h2>
            <div className="space-y-4 pl-1">
              {data.experience.map((exp) => (
                <div key={exp.id} className="space-y-1.5 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-baseline">
                    <div className="space-y-0.5">
                      <h3 className="font-extrabold text-[#0f172a] text-sm">
                        {getBilingualValue(exp.position, exp.position_secondary, mode)}
                      </h3>
                      <p className="font-extrabold text-[#475569] text-xs">
                        {getBilingualValue(exp.company, exp.company_secondary, mode)}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-4">
                      {getBilingualValue(exp.startDate, exp.startDate_secondary, mode)} — {getBilingualValue(exp.endDate, exp.endDate_secondary, mode)}
                    </span>
                  </div>
                  <SafeHTML 
                    html={renderBilingualHTML(exp.description, exp.description_secondary, mode)} 
                    className="text-xs text-slate-500 leading-relaxed text-justify" 
                  />
                </div>
              ))}
            </div>
          </section>
        );
      case 'projects':
        if (data.projects.length === 0) return null;
        return (
          <section key={section.id} className="space-y-3">
            <h2 className="text-xs font-black text-[#1e293b] tracking-wider uppercase bg-[#e2e8f0] px-4 py-1.5 flex items-center justify-between">
              <span>{title}</span>
              <HardHat className="w-4 h-4 text-[#475569]" />
            </h2>
            <div className="space-y-4 pl-1">
              {data.projects.map((project) => (
                <div key={project.id} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-extrabold text-xs text-slate-800">
                        {getBilingualValue(project.name, project.name_secondary, mode)}
                      </h3>
                      {project.role && (
                        <span className="text-[10px] text-slate-500 font-medium bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                          {getBilingualValue(project.role, project.role_secondary, mode)}
                        </span>
                      )}
                    </div>
                    {(project.startDate || project.endDate) && (
                      <span className="text-[10px] text-slate-500 italic shrink-0 ml-4 font-mono">
                        {getBilingualValue(project.startDate || '', project.startDate_secondary || '', mode)} — {getBilingualValue(project.endDate || '', project.endDate_secondary || '', mode)}
                      </span>
                    )}
                  </div>
                  <SafeHTML 
                    html={renderBilingualHTML(project.description, project.description_secondary, mode)} 
                    className="text-xs text-slate-500 leading-relaxed text-justify" 
                  />
                </div>
              ))}
            </div>
          </section>
        );
      case 'education':
        if (data.education.length === 0) return null;
        return (
          <section key={section.id} className="space-y-3">
            <h2 className="text-xs font-black text-[#1e293b] tracking-wider uppercase bg-[#e2e8f0] px-4 py-1.5 flex items-center justify-between">
              <span>{title}</span>
              <HardHat className="w-4 h-4 text-[#475569]" />
            </h2>
            <div className="space-y-3 pl-1">
              {data.education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline">
                  <div>
                    <span className="font-extrabold text-sm text-[#0f172a]">
                      {getBilingualValue(edu.school, edu.school_secondary, mode)}
                    </span>
                    <span className="text-slate-500 text-xs ml-3 font-semibold">
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
          <section key={section.id} className="space-y-3">
            <h2 className="text-xs font-black text-[#1e293b] tracking-wider uppercase bg-[#e2e8f0] px-4 py-1.5 flex items-center justify-between">
              <span>{title}</span>
              <HardHat className="w-4 h-4 text-[#475569]" />
            </h2>
            <div className="space-y-3 pl-1">
              {custom.items.map((item) => (
                <div key={item.id} className="space-y-1">
                  <h3 className="font-extrabold text-xs text-slate-800 font-sans">
                    {getBilingualValue(item.title, item.title_secondary, mode)}
                  </h3>
                  <SafeHTML 
                    html={renderBilingualHTML(item.content, item.content_secondary, mode)} 
                    className="text-xs text-slate-500 leading-relaxed text-justify" 
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
    <div className="flex flex-col min-h-[1100px] bg-white text-slate-800 px-12 py-10 space-y-6 font-sans border-t-[10px] border-[#334155] shadow-xl overflow-hidden print:shadow-none">
      {/* Heavy Industrial Structured Header */}
      <header className="border-b-4 border-[#334155] pb-5 space-y-3">
        <div className="flex flex-col @md:flex-row @md:items-end justify-between gap-4">
          <div className="space-y-1">
            <ResumePhoto photo={data.personalInfo.photo} fullName={data.personalInfo.fullName} />
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-wide">
              {getBilingualValue(data.personalInfo.fullName, data.personalInfo.fullName_secondary, mode)}
            </h1>
            <p className="text-md font-extrabold text-[#475569] uppercase tracking-wider pl-0.5">
              {getBilingualValue(data.personalInfo.jobTitle, data.personalInfo.jobTitle_secondary, mode)}
            </p>
          </div>

          <div className="flex flex-col items-start @md:items-end text-xs font-extrabold text-[#334155]/85 space-y-1 relative pr-1 border-l-4 @md:border-l-0 @md:border-r-4 border-[#334155] pl-3 @md:pl-0 @md:pr-4">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Mail className="w-3.5 h-3.5" />
              {data.personalInfo.email}
            </span>
            <span className="flex items-center gap-1.5 text-[11px]">
              <Phone className="w-3.5 h-3.5" />
              {data.personalInfo.phone}
            </span>
            <span className="flex items-center gap-1.5 text-[11px]">
              <MapPin className="w-3.5 h-3.5" />
              {getBilingualValue(data.personalInfo.location || '', data.personalInfo.location_secondary, mode)}
            </span>
          </div>
        </div>

        {data.personalInfo.website && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 pl-0.5 pt-0.5">
            <Globe className="w-3.5 h-3.5 text-[#475569]" />
            <span className="underline">{data.personalInfo.website}</span>
          </div>
        )}
      </header>

      {/* Structured Sections */}
      <div className="flex-1 space-y-6">
        {data.sections.filter(s => s.type !== 'personal').map(s => renderSection(s))}
      </div>
    </div>
  );
};
