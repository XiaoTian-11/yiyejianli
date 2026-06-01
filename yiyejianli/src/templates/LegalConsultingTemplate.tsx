import React from 'react';
import { TemplateProps, ResumeSection } from '../types';
import { Mail, Phone, MapPin, Globe, Shield, Scale, Briefcase } from 'lucide-react';
import { getBilingualValue, renderBilingualHTML, getBilingualSkills } from '../lib/bilingual';

const SafeHTML: React.FC<{ html: string; className?: string }> = ({ html, className }) => {
  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export const LegalConsultingTemplate: React.FC<TemplateProps> = ({ data }) => {
  const mode = data.displayMode || 'primary';

  const renderSection = (section: ResumeSection) => {
    const title = getBilingualValue(section.title, section.title_secondary, mode);

    switch (section.type) {
      case 'summary':
        if (!data.summary) return null;
        return (
          <section key={section.id} className="space-y-2.5">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 border-b-2 border-slate-900 pb-1.5 font-serif">
              <Shield className="w-4 h-4 text-slate-800" />
              {title}
            </h2>
            <SafeHTML 
              html={renderBilingualHTML(data.summary, data.summary_secondary, mode)} 
              className="text-xs text-slate-700 leading-relaxed text-justify font-serif" 
            />
          </section>
        );
      case 'experience':
        if (data.experience.length === 0) return null;
        return (
          <section key={section.id} className="space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 border-b-2 border-slate-900 pb-1.5 font-serif">
              <Briefcase className="w-4 h-4 text-slate-800" />
              {title}
            </h2>
            <div className="space-y-4">
              {data.experience.map((exp) => (
                <div key={exp.id} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-extrabold text-xs text-slate-900 font-serif">
                      {getBilingualValue(exp.position, exp.position_secondary, mode)}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono font-semibold">
                      {getBilingualValue(exp.startDate, exp.startDate_secondary, mode)} — {getBilingualValue(exp.endDate, exp.endDate_secondary, mode)}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-755 font-serif">
                    {getBilingualValue(exp.company, exp.company_secondary, mode)}
                  </p>
                  <SafeHTML 
                    html={renderBilingualHTML(exp.description, exp.description_secondary, mode)} 
                    className="text-xs text-slate-600 leading-relaxed text-justify" 
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
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 border-b-2 border-slate-900 pb-1.5 font-serif">
              <Scale className="w-4 h-4 text-slate-800" />
              {title}
            </h2>
            <div className="space-y-4">
              {data.projects.map((project) => (
                <div key={project.id} className="space-y-1">
                  <div className="flex justify-between items-baseline font-serif">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-extrabold text-xs text-slate-900">
                        {getBilingualValue(project.name, project.name_secondary, mode)}
                      </h3>
                      {project.role && (
                        <span className="text-[10px] text-slate-500 font-medium italic">
                          ({getBilingualValue(project.role, project.role_secondary, mode)})
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
                    className="text-xs text-slate-600 leading-relaxed text-justify" 
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
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em] border-b-2 border-slate-900 pb-1.5 font-serif">
              {title}
            </h2>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline">
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 font-serif">
                      {getBilingualValue(edu.school, edu.school_secondary, mode)}
                    </span>
                    <span className="text-slate-700 text-[11px] ml-3 font-serif">
                      {getBilingualValue(edu.degree, edu.degree_secondary, mode)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
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
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em] border-b-2 border-slate-900 pb-1.5 font-serif">
              {title}
            </h2>
            <div className="flex flex-wrap gap-2">
              {skillsToRender.map((skill, index) => (
                <span key={index} className="px-3 py-1 border border-slate-300 text-slate-800 rounded text-[10px] font-mono tracking-wide bg-slate-50">
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
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em] border-b-2 border-slate-900 pb-1.5 font-serif">
              {title}
            </h2>
            <div className="space-y-3">
              {custom.items.map((item) => (
                <div key={item.id} className="space-y-1">
                  <h3 className="font-extrabold text-xs text-slate-850 font-serif">
                    {getBilingualValue(item.title, item.title_secondary, mode)}
                  </h3>
                  <SafeHTML 
                    html={renderBilingualHTML(item.content, item.content_secondary, mode)} 
                    className="text-xs text-slate-600 leading-relaxed text-justify" 
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
    <div className="flex flex-col min-h-[1100px] bg-white text-slate-800 px-14 py-12 space-y-6 font-serif border-x-[12px] border-slate-900 shadow-xl overflow-hidden print:shadow-none">
      {/* Symmetrical Scribe Header */}
      <header className="text-center space-y-3.5 border-b-4 border-double border-slate-900 pb-6">
        <h1 className="text-3xl font-extrabold tracking-[0.1em] text-slate-900 uppercase">
          {getBilingualValue(data.personalInfo.fullName, data.personalInfo.fullName_secondary, mode)}
        </h1>
        <p className="text-slate-500 text-xs tracking-[0.2em] font-semibold uppercase font-sans">
          {getBilingualValue(data.personalInfo.jobTitle, data.personalInfo.jobTitle_secondary, mode)}
        </p>

        {/* Double Line separator */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-16 h-[1.5px] bg-slate-900" />
          <Scale className="w-4 h-4 text-slate-800" />
          <div className="w-16 h-[1.5px] bg-slate-900" />
        </div>

        {/* Dense contacts table for lawyers and advisors */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-slate-600 text-[10px] tracking-wide font-sans font-bold uppercase">
          <span className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-800" />
            {data.personalInfo.email}
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-800" />
            {data.personalInfo.phone}
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-800" />
            {getBilingualValue(data.personalInfo.location || '', data.personalInfo.location_secondary, mode)}
          </span>
          {data.personalInfo.website && (
            <>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-800" />
                {data.personalInfo.website}
              </span>
            </>
          )}
        </div>
      </header>

      {/* Structured Stack */}
      <div className="flex-1 space-y-6">
        {data.sections.filter(s => s.type !== 'personal').map(s => renderSection(s))}
      </div>
    </div>
  );
};
