import React from 'react';
import { TemplateProps, ResumeSection } from '../types';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import { getBilingualValue, renderBilingualHTML, getBilingualSkills } from '../lib/bilingual';
import { ResumePhoto } from '../components/ResumePhoto';

const SafeHTML: React.FC<{ html: string; className?: string }> = ({ html, className }) => {
  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export const ElegantTemplate: React.FC<TemplateProps> = ({ data }) => {
  const mode = data.displayMode || 'primary';

  const renderSection = (section: ResumeSection) => {
    const title = getBilingualValue(section.title, section.title_secondary, mode);

    switch (section.type) {
      case 'summary':
        if (!data.summary) return null;
        return (
          <section key={section.id} className="space-y-2 text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#854d0e] mb-2 font-serif">
              — {title} —
            </h2>
            <SafeHTML 
              html={renderBilingualHTML(data.summary, data.summary_secondary, mode)} 
              className="text-xs text-stone-600 leading-relaxed font-serif" 
            />
          </section>
        );
      case 'experience':
        if (data.experience.length === 0) return null;
        return (
          <section key={section.id} className="space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#854d0e] text-center font-serif border-b border-stone-200 pb-2">
              {title}
            </h2>
            <div className="space-y-5">
              {data.experience.map((exp) => (
                <div key={exp.id} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-xs text-stone-900 font-serif">
                      {getBilingualValue(exp.position, exp.position_secondary, mode)}
                    </h3>
                    <span className="text-[10px] text-stone-400 font-serif">
                      {getBilingualValue(exp.startDate, exp.startDate_secondary, mode)} — {getBilingualValue(exp.endDate, exp.endDate_secondary, mode)}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-[#9a3412] font-serif">
                    {getBilingualValue(exp.company, exp.company_secondary, mode)}
                  </p>
                  <SafeHTML 
                    html={renderBilingualHTML(exp.description, exp.description_secondary, mode)} 
                    className="text-xs text-stone-550 leading-relaxed text-justify" 
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
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#854d0e] text-center font-serif border-b border-stone-200 pb-2">
              {title}
            </h2>
            <div className="space-y-4">
              {data.projects.map((project) => (
                <div key={project.id} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-baseline gap-2 font-serif">
                      <h3 className="font-bold text-xs text-stone-900">
                        {getBilingualValue(project.name, project.name_secondary, mode)}
                      </h3>
                      {project.role && (
                        <span className="text-[10px] text-stone-500 font-medium italic">
                          ({getBilingualValue(project.role, project.role_secondary, mode)})
                        </span>
                      )}
                    </div>
                    {(project.startDate || project.endDate) && (
                      <span className="text-[10px] text-stone-400 font-serif shrink-0 ml-4">
                        {getBilingualValue(project.startDate || '', project.startDate_secondary || '', mode)} — {getBilingualValue(project.endDate || '', project.endDate_secondary || '', mode)}
                      </span>
                    )}
                  </div>
                  <SafeHTML 
                    html={renderBilingualHTML(project.description, project.description_secondary, mode)} 
                    className="text-xs text-stone-550 leading-relaxed text-justify" 
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
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#854d0e] text-center font-serif border-b border-stone-200 pb-2">
              {title}
            </h2>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-xs text-stone-900 font-serif">
                      {getBilingualValue(edu.school, edu.school_secondary, mode)}
                    </span>
                    <span className="text-[#9a3412] text-[11px] ml-3 font-serif">
                      {getBilingualValue(edu.degree, edu.degree_secondary, mode)}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-serif">
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
          <section key={section.id} className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#854d0e] text-center font-serif border-b border-stone-200 pb-2">
              {title}
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {skillsToRender.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-stone-50 border border-stone-200 rounded text-xs font-serif text-stone-700 shadow-sm">
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
          <section key={section.id} className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#854d0e] text-center font-serif border-b border-stone-200 pb-2">
              {title}
            </h2>
            <div className="space-y-3">
              {custom.items.map((item) => (
                <div key={item.id} className="space-y-1">
                  <h3 className="font-bold text-xs text-stone-850 font-serif">
                    {getBilingualValue(item.title, item.title_secondary, mode)}
                  </h3>
                  <SafeHTML 
                    html={renderBilingualHTML(item.content, item.content_secondary, mode)} 
                    className="text-xs text-stone-550 leading-relaxed text-justify" 
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
    <div className="flex flex-col min-h-[1100px] bg-stone-50/50 text-stone-800 px-14 py-12 space-y-6 font-serif shadow-xl overflow-hidden print:shadow-none">
      {/* Symmetrical Elegant Header */}
      <header className="text-center space-y-3 border-b-2 border-[#9a3412]/30 pb-6">
        <ResumePhoto photo={data.personalInfo.photo} fullName={data.personalInfo.fullName} />
        <h1 className="text-3xl font-normal tracking-[0.15em] text-[#7c2d12] uppercase">
          {getBilingualValue(data.personalInfo.fullName, data.personalInfo.fullName_secondary, mode)}
        </h1>
        <p className="text-stone-500 text-xs tracking-[0.25em] font-semibold uppercase">
          {getBilingualValue(data.personalInfo.jobTitle, data.personalInfo.jobTitle_secondary, mode)}
        </p>

        {/* Elegant horizontal divider */}
        <div className="flex items-center justify-center gap-4 py-1">
          <div className="w-16 h-px bg-stone-300" />
          <div className="w-2 h-2 border border-[#854d0e] rotate-45" />
          <div className="w-16 h-px bg-stone-300" />
        </div>

        {/* elegant row of contacts with mid dots */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-stone-500 text-[10px] tracking-wide font-medium">
          <span className="flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-[#854d0e]" />
            {data.personalInfo.email}
          </span>
          <span className="text-stone-300">•</span>
          <span className="flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-[#854d0e]" />
            {data.personalInfo.phone}
          </span>
          <span className="text-stone-300">•</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#854d0e]" />
            {getBilingualValue(data.personalInfo.location || '', data.personalInfo.location_secondary, mode)}
          </span>
          {data.personalInfo.website && (
            <>
              <span className="text-stone-300">•</span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-[#854d0e]" />
                {data.personalInfo.website}
              </span>
            </>
          )}
        </div>
      </header>

      {/* Main Sections (Sequential stack) */}
      <div className="flex-1 space-y-6">
        {data.sections.filter(s => s.type !== 'personal').map(s => renderSection(s))}
      </div>
    </div>
  );
};
