import React from 'react';
import { TemplateProps, ResumeSection } from '../types';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import { getBilingualValue, renderBilingualHTML, getBilingualSkills } from '../lib/bilingual';
import { ResumePhoto } from '../components/ResumePhoto';

const SafeHTML: React.FC<{ html: string; className?: string }> = ({ html, className }) => {
  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export const FinanceEliteTemplate: React.FC<TemplateProps> = ({ data }) => {
  const mode = data.displayMode || 'primary';

  const renderSection = (section: ResumeSection) => {
    const title = getBilingualValue(section.title, section.title_secondary, mode);

    switch (section.type) {
      case 'summary':
        if (!data.summary) return null;
        return (
          <section key={section.id} className="space-y-2">
            <h2 className="text-sm font-black text-slate-900 border-b-2 border-slate-900 pb-1 uppercase tracking-wider flex items-center justify-between">
              <span>{title}</span>
              <span className="w-12 h-0.5 bg-blue-900 rounded-full" />
            </h2>
            <SafeHTML 
              html={renderBilingualHTML(data.summary, data.summary_secondary, mode)} 
              className="text-xs text-slate-705 leading-relaxed whitespace-pre-line text-justify" 
            />
          </section>
        );
      case 'skills':
        if (data.skills.length === 0) return null;
        const skillsToRender = getBilingualSkills(data.skills, data.skills_secondary, mode);
        return (
          <section key={section.id} className="space-y-3">
            <h2 className="text-sm font-black text-slate-900 border-b-2 border-slate-900 pb-1 uppercase tracking-wider flex items-center justify-between">
              <span>{title}</span>
              <span className="w-12 h-0.5 bg-blue-900 rounded-full" />
            </h2>
            <div className="flex flex-wrap gap-2">
              {skillsToRender.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-bold text-slate-700 tracking-wide hover:bg-blue-50/30 hover:border-blue-200 transition-colors shadow-sm">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        );
      case 'experience':
        if (data.experience.length === 0) return null;
        return (
          <section key={section.id} className="space-y-4">
            <h2 className="text-sm font-black text-slate-900 border-b-2 border-slate-900 pb-1 uppercase tracking-wider flex items-center justify-between">
              <span>{title}</span>
              <span className="w-12 h-0.5 bg-blue-900 rounded-full" />
            </h2>
            <div className="space-y-4">
              {data.experience.map((exp) => (
                <div key={exp.id} className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <div className="space-y-0.5">
                      <h3 className="font-extrabold text-sm text-slate-900">
                        {getBilingualValue(exp.position, exp.position_secondary, mode)}
                      </h3>
                      <p className="font-extrabold text-[#1e3a8a] text-xs">
                        {getBilingualValue(exp.company, exp.company_secondary, mode)}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0 ml-4 border border-slate-200">
                      {getBilingualValue(exp.startDate, exp.startDate_secondary, mode)} — {getBilingualValue(exp.endDate, exp.endDate_secondary, mode)}
                    </span>
                  </div>
                  <SafeHTML 
                    html={renderBilingualHTML(exp.description, exp.description_secondary, mode)} 
                    className="text-xs text-slate-650 leading-relaxed text-justify" 
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
            <h2 className="text-sm font-black text-slate-900 border-b-2 border-slate-900 pb-1 uppercase tracking-wider flex items-center justify-between">
              <span>{title}</span>
              <span className="w-12 h-0.5 bg-blue-900 rounded-full" />
            </h2>
            <div className="space-y-4">
              {data.projects.map((project) => (
                <div key={project.id} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900">
                        {getBilingualValue(project.name, project.name_secondary, mode)}
                      </h3>
                      {project.role && (
                        <span className="text-[10px] text-blue-900 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                          {getBilingualValue(project.role, project.role_secondary, mode)}
                        </span>
                      )}
                    </div>
                    {(project.startDate || project.endDate) && (
                      <span className="text-[10px] text-slate-500 font-bold tracking-tight">
                        {getBilingualValue(project.startDate || '', project.startDate_secondary || '', mode)} — {getBilingualValue(project.endDate || '', project.endDate_secondary || '', mode)}
                      </span>
                    )}
                  </div>
                  <SafeHTML 
                    html={renderBilingualHTML(project.description, project.description_secondary, mode)} 
                    className="text-xs text-slate-650 leading-relaxed text-justify" 
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
            <h2 className="text-sm font-black text-slate-900 border-b-2 border-slate-900 pb-1 uppercase tracking-wider flex items-center justify-between">
              <span>{title}</span>
              <span className="w-12 h-0.5 bg-blue-900 rounded-full" />
            </h2>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline">
                  <div>
                    <span className="font-extrabold text-sm text-slate-900">
                      {getBilingualValue(edu.school, edu.school_secondary, mode)}
                    </span>
                    <span className="text-slate-500 text-xs ml-3 font-semibold">
                      {getBilingualValue(edu.degree, edu.degree_secondary, mode)}
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
          <section key={section.id} className="space-y-3">
            <h2 className="text-sm font-black text-slate-900 border-b-2 border-slate-900 pb-1 uppercase tracking-wider flex items-center justify-between">
              <span>{title}</span>
              <span className="w-12 h-0.5 bg-blue-900 rounded-full" />
            </h2>
            <div className="space-y-3">
              {custom.items.map((item) => (
                <div key={item.id} className="space-y-1">
                  <h3 className="font-extrabold text-xs text-slate-800">
                    {getBilingualValue(item.title, item.title_secondary, mode)}
                  </h3>
                  <SafeHTML 
                    html={renderBilingualHTML(item.content, item.content_secondary, mode)} 
                    className="text-xs text-slate-650 leading-relaxed text-justify" 
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
    <div className="flex flex-col min-h-[1100px] bg-white text-slate-900 px-12 py-10 space-y-6 font-sans border-t-8 border-[#0f172a] shadow-xl overflow-hidden print:shadow-none">
      {/* Centered Premium Header */}
      <header className="text-center space-y-2 border-b-2 border-[#002B49] pb-4">
        <ResumePhoto photo={data.personalInfo.photo} fullName={data.personalInfo.fullName} />
        <h1 className="text-3xl font-extrabold uppercase tracking-widest text-[#002B49]">
          {getBilingualValue(data.personalInfo.fullName, data.personalInfo.fullName_secondary, mode)}
        </h1>
        <p className="text-[#1e3a8a] text-sm uppercase tracking-widest font-bold">
          {getBilingualValue(data.personalInfo.jobTitle, data.personalInfo.jobTitle_secondary, mode)}
        </p>

        {/* Contact list with elegant separators */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-slate-500 text-[11px] font-bold pt-1.5">
          <span className="flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-[#002B49]" />
            {data.personalInfo.email}
          </span>
          <span className="text-[#002B49]/40">•</span>
          <span className="flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-[#002B49]" />
            {data.personalInfo.phone}
          </span>
          <span className="text-[#002B49]/40">•</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#002B49]" />
            {getBilingualValue(data.personalInfo.location || '', data.personalInfo.location_secondary, mode)}
          </span>
          {data.personalInfo.website && (
            <>
              <span className="text-[#002B49]/40">•</span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-[#002B49]" />
                {data.personalInfo.website}
              </span>
            </>
          )}
        </div>
      </header>

      {/* Main Sections (all ordered sequentially) */}
      <div className="flex-1 space-y-6">
        {data.sections.filter(s => s.type !== 'personal').map(s => renderSection(s))}
      </div>
    </div>
  );
};
