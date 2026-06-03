import React from 'react';
import { ResumeData, ResumeSection } from '../types';
import { getBilingualValue, renderBilingualHTML, getBilingualSkills } from '../lib/bilingual';
import { ResumePhoto } from '../components/ResumePhoto';

interface ClassicTemplateProps {
  data: ResumeData;
}

const SafeHTML: React.FC<{ html: string; className?: string }> = ({ html, className }) => {
  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export const ClassicTemplate: React.FC<ClassicTemplateProps> = ({ data }) => {
  const mode = data.displayMode || 'primary';

  const renderSection = (section: ResumeSection) => {
    const title = getBilingualValue(section.title, section.title_secondary, mode);

    switch (section.type) {
      case 'summary':
        if (!data.summary) return null;
        return (
          <section key={section.id}>
            <h2 className="text-lg font-bold uppercase border-b border-gray-300 mb-3 text-slate-900">
              {title}
            </h2>
            <SafeHTML 
              html={renderBilingualHTML(data.summary, data.summary_secondary, mode)} 
              className="leading-relaxed whitespace-pre-line" 
            />
          </section>
        );
      case 'experience':
        if (data.experience.length === 0) return null;
        return (
          <section key={section.id}>
            <h2 className="text-lg font-bold uppercase border-b border-gray-300 mb-4 text-slate-900">
              {title}
            </h2>
            <div className="space-y-6">
              {data.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between font-bold">
                    <span>{getBilingualValue(exp.position, exp.position_secondary, mode)}</span>
                    <span className="shrink-0 ml-4">
                      {getBilingualValue(exp.startDate, exp.startDate_secondary, mode)} — {getBilingualValue(exp.endDate, exp.endDate_secondary, mode)}
                    </span>
                  </div>
                  <div className="mb-2 text-slate-700 font-semibold">
                    {getBilingualValue(exp.company, exp.company_secondary, mode)}
                  </div>
                  <SafeHTML 
                    html={renderBilingualHTML(exp.description, exp.description_secondary, mode)} 
                    className="leading-relaxed text-gray-700" 
                  />
                </div>
              ))}
            </div>
          </section>
        );
      case 'education':
        if (data.education.length === 0) return null;
        return (
          <section key={section.id}>
            <h2 className="text-lg font-bold uppercase border-b border-gray-300 mb-4 text-slate-900">
              {title}
            </h2>
            <div className="space-y-4">
              {data.education.map((edu) => (
                <div key={edu.id} className="flex justify-between">
                  <div>
                    <span className="font-bold">{getBilingualValue(edu.school, edu.school_secondary, mode)}</span>
                    <span className="mx-2">—</span>
                    <span>{getBilingualValue(edu.degree, edu.degree_secondary, mode)}</span>
                  </div>
                  <span className="font-medium italic shrink-0 ml-4">
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
          <section key={section.id}>
            <h2 className="text-lg font-bold uppercase border-b border-gray-300 mb-3 text-slate-900">
              {title}
            </h2>
            <p className="leading-relaxed">
              <span className="font-bold uppercase text-[10px] tracking-wider text-gray-500 mr-2">
                {getBilingualValue('技能详情:', 'Skills:', mode)}
              </span>
              {skillsToRender.join(', ')}
            </p>
          </section>
        );
      case 'projects':
        if (data.projects.length === 0) return null;
        return (
          <section key={section.id}>
            <h2 className="text-lg font-bold uppercase border-b border-gray-300 mb-4 text-slate-900">
              {title}
            </h2>
            <div className="space-y-4">
              {data.projects.map((project) => (
                <div key={project.id}>
                  <div className="flex justify-between items-baseline font-semibold text-slate-800">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-slate-900">
                        {getBilingualValue(project.name, project.name_secondary, mode)}
                      </span>
                      {project.role && (
                        <span className="text-xs text-gray-500 font-medium">
                          ({getBilingualValue(project.role, project.role_secondary, mode)})
                        </span>
                      )}
                    </div>
                    {(project.startDate || project.endDate) && (
                      <span className="text-xs text-gray-500 font-normal shrink-0">
                        {getBilingualValue(project.startDate || '', project.startDate_secondary || '', mode)} — {getBilingualValue(project.endDate || '', project.endDate_secondary || '', mode)}
                      </span>
                    )}
                  </div>
                  <SafeHTML 
                    html={renderBilingualHTML(project.description, project.description_secondary, mode)} 
                    className="leading-relaxed text-gray-700" 
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
          <section key={section.id}>
            <h2 className="text-lg font-bold uppercase border-b border-gray-300 mb-4 text-slate-900">
              {title}
            </h2>
            <div className="space-y-4">
              {custom.items.map((item) => (
                <div key={item.id}>
                  <div className="font-bold">
                    {getBilingualValue(item.title, item.title_secondary, mode)}
                  </div>
                  <SafeHTML 
                    html={renderBilingualHTML(item.content, item.content_secondary, mode)} 
                    className="leading-relaxed text-gray-700" 
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
    <div className="p-12 bg-white text-black min-h-[1100px] shadow-xl overflow-hidden font-serif print:shadow-none">
      <header className="text-center space-y-2 border-b-2 border-black pb-6">
        <ResumePhoto photo={data.personalInfo.photo} fullName={data.personalInfo.fullName} />
        <h1 className="text-4xl font-bold uppercase tracking-widest text-slate-900">
          {getBilingualValue(data.personalInfo.fullName, data.personalInfo.fullName_secondary, mode)}
        </h1>
        <p className="text-lg font-medium text-slate-705">
          {getBilingualValue(data.personalInfo.jobTitle, data.personalInfo.jobTitle_secondary, mode)}
        </p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-slate-600">
          <span>{getBilingualValue(data.personalInfo.location || '', data.personalInfo.location_secondary, mode)}</span>
          <span>•</span>
          <span>{data.personalInfo.email}</span>
          <span>•</span>
          <span>{data.personalInfo.phone}</span>
          {data.personalInfo.website && (
            <>
              <span>•</span>
              <span>{data.personalInfo.website}</span>
            </>
          )}
        </div>
      </header>

      <div className="mt-8 space-y-8 text-sm text-slate-800">
        {data.sections.filter(s => s.type !== 'personal').map(renderSection)}
      </div>
    </div>
  );
};
