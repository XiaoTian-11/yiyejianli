import React from 'react';
import { TemplateProps, ResumeSection } from '../types';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import { getBilingualValue, renderBilingualHTML, getBilingualSkills } from '../lib/bilingual';

const SafeHTML: React.FC<{ html: string; className?: string }> = ({ html, className }) => {
  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export const MinimalTemplate: React.FC<TemplateProps> = ({ data }) => {
  const mode = data.displayMode || 'primary';

  const renderSection = (section: ResumeSection) => {
    const title = getBilingualValue(section.title, section.title_secondary, mode);

    switch (section.type) {
      case 'summary':
        if (!data.summary) return null;
        return (
          <section key={section.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 border-b border-zinc-150 pb-4">
            <div className="md:col-span-3 text-2xs font-bold tracking-widest text-[#52525b] uppercase">
              {title}
            </div>
            <div className="md:col-span-9">
              <SafeHTML 
                html={renderBilingualHTML(data.summary, data.summary_secondary, mode)} 
                className="text-xs text-zinc-650 leading-relaxed text-justify" 
              />
            </div>
          </section>
        );
      case 'experience':
        if (data.experience.length === 0) return null;
        return (
          <section key={section.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 border-b border-zinc-150 pb-4">
            <div className="md:col-span-3 text-2xs font-bold tracking-widest text-[#52525b] uppercase">
              {title}
            </div>
            <div className="md:col-span-9 space-y-4">
              {data.experience.map((exp) => (
                <div key={exp.id} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-xs text-zinc-900">
                      {getBilingualValue(exp.position, exp.position_secondary, mode)}
                    </h3>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {getBilingualValue(exp.startDate, exp.startDate_secondary, mode)} — {getBilingualValue(exp.endDate, exp.endDate_secondary, mode)}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-zinc-500">
                    {getBilingualValue(exp.company, exp.company_secondary, mode)}
                  </p>
                  <SafeHTML 
                    html={renderBilingualHTML(exp.description, exp.description_secondary, mode)} 
                    className="text-xs text-zinc-500 leading-relaxed text-justify" 
                  />
                </div>
              ))}
            </div>
          </section>
        );
      case 'projects':
        if (data.projects.length === 0) return null;
        return (
          <section key={section.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 border-b border-zinc-150 pb-4">
            <div className="md:col-span-3 text-2xs font-bold tracking-widest text-[#52525b] uppercase">
              {title}
            </div>
            <div className="md:col-span-9 space-y-4">
              {data.projects.map((project) => (
                <div key={project.id} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-bold text-xs text-zinc-900">
                        {getBilingualValue(project.name, project.name_secondary, mode)}
                      </h3>
                      {project.role && (
                        <span className="text-[10px] text-zinc-400 font-medium">
                          ({getBilingualValue(project.role, project.role_secondary, mode)})
                        </span>
                      )}
                    </div>
                    {(project.startDate || project.endDate) && (
                      <span className="text-[10px] text-zinc-400 font-mono shrink-0 ml-4">
                        {getBilingualValue(project.startDate || '', project.startDate_secondary || '', mode)} — {getBilingualValue(project.endDate || '', project.endDate_secondary || '', mode)}
                      </span>
                    )}
                  </div>
                  <SafeHTML 
                    html={renderBilingualHTML(project.description, project.description_secondary, mode)} 
                    className="text-xs text-zinc-500 leading-relaxed text-justify" 
                  />
                </div>
              ))}
            </div>
          </section>
        );
      case 'education':
        if (data.education.length === 0) return null;
        return (
          <section key={section.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 border-b border-zinc-150 pb-4">
            <div className="md:col-span-3 text-2xs font-bold tracking-widest text-[#52525b] uppercase">
              {title}
            </div>
            <div className="md:col-span-9 space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-xs text-zinc-900">
                      {getBilingualValue(edu.school, edu.school_secondary, mode)}
                    </span>
                    <span className="text-zinc-400 text-[11px] ml-3 font-mono">
                      {getBilingualValue(edu.degree, edu.degree_secondary, mode)}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {getBilingualValue(edu.startDate, edu.startDate_secondary, mode)} — {getBilingualValue(edu.endDate, edu.endDate_secondary, mode)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        );
      case 'skills':
        if (data.skills.length === 0) return null;
        const skillsToRender = getBilingualSkills(data.skills, data.skills_secondary, mode);
        return (
          <section key={section.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 border-b border-zinc-150 pb-4">
            <div className="md:col-span-3 text-2xs font-bold tracking-widest text-[#52525b] uppercase">
              {title}
            </div>
            <div className="md:col-span-9 flex flex-wrap gap-1.5">
              {skillsToRender.map((skill, index) => (
                <span key={index} className="px-2 py-0.5 border border-zinc-250 text-zinc-700 rounded text-[10px] font-mono hover:bg-zinc-50 transition-colors">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        );
      case 'custom':
        const custom = data.customSections?.find(cs => cs.id === section.customId);
        if (!custom || custom.items.length === 0) return null;
        return (
          <section key={section.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 border-b border-zinc-150 pb-4">
            <div className="md:col-span-3 text-2xs font-bold tracking-widest text-[#52525b] uppercase">
              {title}
            </div>
            <div className="md:col-span-9 space-y-3">
              {custom.items.map((item) => (
                <div key={item.id} className="space-y-1">
                  <h3 className="font-bold text-xs text-zinc-800">
                    {getBilingualValue(item.title, item.title_secondary, mode)}
                  </h3>
                  <SafeHTML 
                    html={renderBilingualHTML(item.content, item.content_secondary, mode)} 
                    className="text-xs text-zinc-550 leading-relaxed text-justify" 
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
    <div className="flex flex-col min-h-[1100px] bg-white text-[#18181b] px-14 py-12 space-y-6 font-mono shadow-xl overflow-hidden print:shadow-none">
      {/* Absolute Minimal Header */}
      <header className="flex flex-col justify-between items-baseline border-b border-zinc-300 pb-5 gap-3">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-widest text-zinc-900">
            {getBilingualValue(data.personalInfo.fullName, data.personalInfo.fullName_secondary, mode)}
          </h1>
          <p className="text-zinc-500 text-xs tracking-widest font-semibold uppercase mt-1">
            {getBilingualValue(data.personalInfo.jobTitle, data.personalInfo.jobTitle_secondary, mode)}
          </p>
        </div>

        {/* Flat minimal row of contact */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-zinc-400 text-[10px] font-medium uppercase mt-2">
          <span className="flex items-center gap-1">
            <Mail className="w-3 h-3 text-zinc-650" />
            {data.personalInfo.email}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3 text-zinc-650" />
            {data.personalInfo.phone}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-zinc-650" />
            {getBilingualValue(data.personalInfo.location || '', data.personalInfo.location_secondary, mode)}
          </span>
          {data.personalInfo.website && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-zinc-650" />
                {data.personalInfo.website}
              </span>
            </>
          )}
        </div>
      </header>

      {/* Main Sections */}
      <div className="flex-1 space-y-5">
        {data.sections.filter(s => s.type !== 'personal').map(s => renderSection(s))}
      </div>
    </div>
  );
};
