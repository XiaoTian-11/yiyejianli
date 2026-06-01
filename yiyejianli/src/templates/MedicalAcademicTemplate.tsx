import React from 'react';
import { TemplateProps, ResumeSection } from '../types';
import { Mail, Phone, MapPin, Globe, Award, Shield } from 'lucide-react';
import { getBilingualValue, renderBilingualHTML, getBilingualSkills } from '../lib/bilingual';

const SafeHTML: React.FC<{ html: string; className?: string }> = ({ html, className }) => {
  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export const MedicalAcademicTemplate: React.FC<TemplateProps> = ({ data }) => {
  const mode = data.displayMode || 'primary';

  const renderSection = (section: ResumeSection) => {
    const title = getBilingualValue(section.title, section.title_secondary, mode);

    switch (section.type) {
      case 'summary':
        if (!data.summary) return null;
        return (
          <section key={section.id} className="space-y-2">
            <h2 className="text-xs font-black text-emerald-800 tracking-widest uppercase border-l-4 border-emerald-600 pl-3">
              {title}
            </h2>
            <SafeHTML 
              html={renderBilingualHTML(data.summary, data.summary_secondary, mode)} 
              className="text-xs text-slate-650 leading-relaxed pl-1" 
            />
          </section>
        );
      case 'experience':
        if (data.experience.length === 0) return null;
        return (
          <section key={section.id} className="space-y-3">
            <h2 className="text-xs font-black text-emerald-800 tracking-widest uppercase border-l-4 border-emerald-600 pl-3">
              {title}
            </h2>
            <div className="space-y-4 pl-1">
              {data.experience.map((exp) => (
                <div key={exp.id} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-extrabold text-[#065f46] text-xs">
                      {getBilingualValue(exp.company, exp.company_secondary, mode)}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400">
                      {getBilingualValue(exp.startDate, exp.startDate_secondary, mode)} — {getBilingualValue(exp.endDate, exp.endDate_secondary, mode)}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {getBilingualValue(exp.position, exp.position_secondary, mode)}
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
          <section key={section.id} className="space-y-3">
            <h2 className="text-xs font-black text-emerald-800 tracking-widest uppercase border-l-4 border-emerald-600 pl-3">
              {title}
            </h2>
            <div className="space-y-3 pl-1">
              {data.projects.map((project) => (
                <div key={project.id} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-extrabold text-xs text-slate-800">
                        {getBilingualValue(project.name, project.name_secondary, mode)}
                      </h3>
                      {project.role && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                          {getBilingualValue(project.role, project.role_secondary, mode)}
                        </span>
                      )}
                    </div>
                    {(project.startDate || project.endDate) && (
                      <span className="text-[10px] text-slate-500 font-mono">
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
            <h2 className="text-xs font-black text-emerald-800 tracking-widest uppercase border-l-4 border-emerald-600 pl-3">
              {title}
            </h2>
            <div className="space-y-3 pl-1">
              {custom.items.map((item) => (
                <div key={item.id} className="space-y-1">
                  <h3 className="font-bold text-xs text-slate-800">
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

  const rightSections = data.sections.filter(
    s => s.type !== 'education' && s.type !== 'skills' && s.type !== 'personal'
  );

  const skillsToRender = getBilingualSkills(data.skills, data.skills_secondary, mode);

  return (
    <div className="flex flex-col md:flex-row min-h-[1100px] bg-white text-slate-800 font-sans border-t-8 border-teal-700 shadow-xl overflow-hidden print:shadow-none">
      {/* Left Medical Accent Sidebar */}
      <aside className="w-full md:w-[32%] bg-gradient-to-b from-[#f0fdf4] to-teal-50/20 p-8 flex flex-col gap-6 select-none border-r border-[#e6f4ea]">
        <div className="space-y-3">
          <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center text-white shadow-md shadow-teal-700/10">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">
              {getBilingualValue(data.personalInfo.fullName, data.personalInfo.fullName_secondary, mode)}
            </h1>
            <p className="text-teal-700 font-bold text-xs mt-1 uppercase tracking-wider">
              {getBilingualValue(data.personalInfo.jobTitle, data.personalInfo.jobTitle_secondary, mode)}
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-200/60 text-xs">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">联系方式</h4>
          <div className="space-y-2.5 text-slate-600 font-medium">
            <p className="flex items-center gap-2 truncate-all">
              <Mail className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{data.personalInfo.email}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{data.personalInfo.phone}</span>
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{getBilingualValue(data.personalInfo.location || '', data.personalInfo.location_secondary, mode)}</span>
            </p>
            {data.personalInfo.website && (
              <p className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="truncate">{data.personalInfo.website}</span>
              </p>
            )}
          </div>
        </div>

        {/* Education on Left (Crucial for Science / Academic) */}
        {data.education.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-200/60">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">教育背景</h4>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="space-y-0.5">
                  <p className="font-extrabold text-xs text-slate-800 leading-tight">
                    {getBilingualValue(edu.school, edu.school_secondary, mode)}
                  </p>
                  <p className="text-[11px] text-teal-700 font-bold">
                    {getBilingualValue(edu.degree, edu.degree_secondary, mode)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {getBilingualValue(edu.startDate, edu.startDate_secondary, mode)} — {getBilingualValue(edu.endDate, edu.endDate_secondary, mode)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical/Medical Keys */}
        {skillsToRender.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-200/60">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">专业与临床技能</h4>
            <div className="flex flex-wrap gap-1.5">
              {skillsToRender.map((s) => (
                <span key={s} className="px-2 py-0.5 bg-[#f0fdf4] text-teal-800 border border-teal-200 rounded text-[10px] font-medium tracking-wide">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Main Column */}
      <main className="flex-1 p-8 space-y-6">
        {rightSections.map(s => renderSection(s))}
      </main>
    </div>
  );
};
