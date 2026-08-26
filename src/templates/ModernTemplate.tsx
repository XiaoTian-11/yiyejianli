import React from 'react';
import { ResumeData, ResumeSection } from '../types';
import { Mail, Phone, MapPin, Globe, Linkedin } from 'lucide-react';
import { getBilingualValue, renderBilingualHTML, getBilingualSkills } from '../lib/bilingual';
import { ResumePhoto } from '../components/ResumePhoto';

interface ModernTemplateProps {
  data: ResumeData;
}

const SafeHTML: React.FC<{ html: string; className?: string }> = ({ html, className }) => {
  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export const ModernTemplate: React.FC<ModernTemplateProps> = ({ data }) => {
  const mode = data.displayMode || 'primary';

  const renderSection = (section: ResumeSection) => {
    const title = getBilingualValue(section.title, section.title_secondary, mode);

    switch (section.type) {
      case 'summary':
        if (!data.summary) return null;
        return (
          <section key={section.id} className="space-y-3">
            <h2 className="text-xl font-bold uppercase tracking-wider border-b-2 border-slate-900 pb-2">
              {title}
            </h2>
            <SafeHTML 
              html={renderBilingualHTML(data.summary, data.summary_secondary, mode)} 
              className="text-gray-600 leading-relaxed text-sm @md:text-base whitespace-pre-line" 
            />
          </section>
        );
      case 'experience':
        if (data.experience.length === 0) return null;
        return (
          <section key={section.id} className="space-y-6">
            <h2 className="text-xl font-bold uppercase tracking-wider border-b-2 border-slate-900 pb-2">
              {title}
            </h2>
            <div className="space-y-8">
              {data.experience.map((exp) => (
                <div key={exp.id} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">
                        {getBilingualValue(exp.position, exp.position_secondary, mode)}
                      </h3>
                      <p className="text-blue-600 font-medium">
                        {getBilingualValue(exp.company, exp.company_secondary, mode)}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500 font-medium shrink-0 ml-4">
                      {getBilingualValue(exp.startDate, exp.startDate_secondary, mode)} — {getBilingualValue(exp.endDate, exp.endDate_secondary, mode)}
                    </span>
                  </div>
                  <SafeHTML 
                    html={renderBilingualHTML(exp.description, exp.description_secondary, mode)} 
                    className="text-gray-600 text-sm @md:text-base leading-relaxed" 
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
            <h2 className="text-xl font-bold uppercase tracking-wider border-b-2 border-slate-900 pb-2">
              {title}
            </h2>
            <div className="grid grid-cols-1 gap-6">
              {data.projects.map((project) => (
                <div key={project.id} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-bold">
                        {getBilingualValue(project.name, project.name_secondary, mode)}
                      </h3>
                      {project.role && (
                        <p className="text-blue-600 font-medium text-sm">
                          ({getBilingualValue(project.role, project.role_secondary, mode)})
                        </p>
                      )}
                    </div>
                    {(project.startDate || project.endDate) && (
                      <span className="text-sm text-gray-500 font-medium shrink-0 ml-4 font-mono">
                        {getBilingualValue(project.startDate || '', project.startDate_secondary || '', mode)} — {getBilingualValue(project.endDate || '', project.endDate_secondary || '', mode)}
                      </span>
                    )}
                  </div>
                  <SafeHTML 
                    html={renderBilingualHTML(project.description, project.description_secondary, mode)} 
                    className="text-gray-600 text-sm leading-snug" 
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
            <h2 className="text-xl font-bold uppercase tracking-wider border-b-2 border-slate-900 pb-2">
              {title}
            </h2>
            <div className="space-y-4">
              {custom.items.map((item) => (
                <div key={item.id} className="space-y-1">
                  <h3 className="font-bold">
                    {getBilingualValue(item.title, item.title_secondary, mode)}
                  </h3>
                  <SafeHTML 
                    html={renderBilingualHTML(item.content, item.content_secondary, mode)} 
                    className="text-gray-600 text-sm leading-relaxed" 
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
    <div className="flex flex-col @md:flex-row min-h-[1100px] bg-white text-gray-800 shadow-xl overflow-hidden font-sans print:shadow-none">
      {/* Sidebar */}
      <aside className="w-full @md:w-1/3 bg-slate-900 text-white p-8 space-y-8">
        <div className="space-y-4">
          <ResumePhoto photo={data.personalInfo.photo} fullName={data.personalInfo.fullName} size="lg" />
          <h1 className="text-3xl font-bold tracking-tight leading-tight uppercase">
            {getBilingualValue(data.personalInfo.fullName, data.personalInfo.fullName_secondary, mode)}
          </h1>
          <p className="text-blue-400 font-medium text-lg">
            {getBilingualValue(data.personalInfo.jobTitle, data.personalInfo.jobTitle_secondary, mode)}
          </p>
        </div>

        <div className="space-y-4 text-sm">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-700 pb-2">
            {getBilingualValue('联系方式', 'Contact', mode)}
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="break-all">{data.personalInfo.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{data.personalInfo.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{getBilingualValue(data.personalInfo.location || '', data.personalInfo.location_secondary, mode)}</span>
            </div>
            {data.personalInfo.website && (
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="break-all">{data.personalInfo.website}</span>
              </div>
            )}
            {data.personalInfo.linkedin && (
              <div className="flex items-center gap-3">
                <Linkedin className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="break-all">{data.personalInfo.linkedin}</span>
              </div>
            )}
          </div>
        </div>

        {skillsToRender.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-700 pb-2">
              {getBilingualValue('技能专长', 'Skills', mode)}
            </h2>
            <div className="flex flex-wrap gap-2">
              {skillsToRender.map((skill, index) => (
                <span
                  key={index}
                  className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.education.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-700 pb-2">
              {getBilingualValue('教育背景', 'Education', mode)}
            </h2>
            <div className="space-y-4">
              {data.education.map((edu) => (
                <div key={edu.id} className="space-y-1">
                  <p className="font-bold text-blue-400">
                    {getBilingualValue(edu.degree, edu.degree_secondary, mode)}
                  </p>
                  <p className="text-sm">
                    {getBilingualValue(edu.school, edu.school_secondary, mode)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {getBilingualValue(edu.startDate, edu.startDate_secondary, mode)} — {getBilingualValue(edu.endDate, edu.endDate_secondary, mode)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 space-y-10">
        {mainSections.map(renderSection)}
      </main>
    </div>
  );
};
