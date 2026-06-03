import React from 'react';
import { TemplateProps, ResumeSection } from '../types';
import { Mail, Phone, MapPin, Globe, GraduationCap } from 'lucide-react';
import { getBilingualValue, renderBilingualHTML, getBilingualSkills } from '../lib/bilingual';
import { ResumePhoto } from '../components/ResumePhoto';

const SafeHTML: React.FC<{ html: string; className?: string }> = ({ html, className }) => {
  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export const StudentTemplate: React.FC<TemplateProps> = ({ data }) => {
  const mode = data.displayMode || 'primary';

  const renderSection = (section: ResumeSection) => {
    const title = getBilingualValue(section.title, section.title_secondary, mode);

    switch (section.type) {
      case 'summary':
        if (!data.summary) return null;
        return (
          <section key={section.id} className="space-y-2">
            <h2 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-indigo-100 pb-1">
              <span className="w-1.5 h-3 bg-indigo-600 rounded-sm" />
              {title}
            </h2>
            <SafeHTML 
              html={renderBilingualHTML(data.summary, data.summary_secondary, mode)} 
              className="text-xs text-slate-600 leading-relaxed text-justify" 
            />
          </section>
        );
      case 'education':
        if (data.education.length === 0) return null;
        return (
          <section key={section.id} className="space-y-3">
            <h2 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-indigo-100 pb-1">
              <span className="w-1.5 h-3 bg-indigo-600 rounded-sm" />
              {title}
            </h2>
            <div className="space-y-4">
              {data.education.map((edu) => (
                <div key={edu.id} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-extrabold text-xs text-slate-900">
                      {getBilingualValue(edu.school, edu.school_secondary, mode)}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {getBilingualValue(edu.startDate, edu.startDate_secondary, mode)} — {getBilingualValue(edu.endDate, edu.endDate_secondary, mode)}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-indigo-700">
                    {getBilingualValue(edu.degree, edu.degree_secondary, mode)}
                  </p>
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
            <h2 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-indigo-100 pb-1">
              <span className="w-1.5 h-3 bg-indigo-600 rounded-sm" />
              {title}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {skillsToRender.map((skill, index) => (
                <span key={index} className="px-2.5 py-1 bg-indigo-50/60 border border-indigo-100/30 text-indigo-750 rounded text-[10px] font-medium tracking-wide">
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
            <h2 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-indigo-100 pb-1">
              <span className="w-1.5 h-3 bg-indigo-600 rounded-sm" />
              {title}
            </h2>
            <div className="space-y-4">
              {data.experience.map((exp) => (
                <div key={exp.id} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-extrabold text-xs text-slate-900">
                      {getBilingualValue(exp.position, exp.position_secondary, mode)}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {getBilingualValue(exp.startDate, exp.startDate_secondary, mode)} — {getBilingualValue(exp.endDate, exp.endDate_secondary, mode)}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-indigo-600">
                    {getBilingualValue(exp.company, exp.company_secondary, mode)}
                  </p>
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
            <h2 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-indigo-100 pb-1">
              <span className="w-1.5 h-3 bg-indigo-600 rounded-sm" />
              {title}
            </h2>
            <div className="space-y-4">
              {data.projects.map((project) => (
                <div key={project.id} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-extrabold text-xs text-slate-900">
                        {getBilingualValue(project.name, project.name_secondary, mode)}
                      </h3>
                      {project.role && (
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
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
                    className="text-xs text-slate-500 leading-relaxed text-justify" 
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
            <h2 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-indigo-100 pb-1">
              <span className="w-1.5 h-3 bg-indigo-600 rounded-sm" />
              {title}
            </h2>
            <div className="space-y-3">
              {custom.items.map((item) => (
                <div key={item.id} className="space-y-1">
                  <h3 className="font-extrabold text-xs text-slate-800">
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

  // Reorder for students: education at the critical top
  const orderedSections = [...data.sections];
  const eduIndex = orderedSections.findIndex(s => s.type === 'education');
  const expIndex = orderedSections.findIndex(s => s.type === 'experience');
  
  if (eduIndex > -1 && expIndex > -1 && eduIndex > expIndex) {
    // Swap education to be before experience
    const temp = orderedSections[eduIndex];
    orderedSections.splice(eduIndex, 1);
    orderedSections.splice(expIndex, 0, temp);
  }

  return (
    <div className="flex flex-col min-h-[1100px] bg-white text-slate-800 px-12 py-10 space-y-6 font-sans border-t-8 border-indigo-600 shadow-xl overflow-hidden print:shadow-none">
      {/* Student Chic Compact Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-slate-100 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <ResumePhoto photo={data.personalInfo.photo} fullName={data.personalInfo.fullName} size="md" />
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              {getBilingualValue(data.personalInfo.fullName, data.personalInfo.fullName_secondary, mode)}
            </h1>
            <p className="text-indigo-600 font-bold text-xs mt-0.5 tracking-wider uppercase">
              {getBilingualValue(data.personalInfo.jobTitle, data.personalInfo.jobTitle_secondary, mode)}
            </p>
          </div>
        </div>

        {/* Dense contacts block */}
        <div className="grid grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-1 text-slate-500 text-[10px] font-bold">
          <span className="flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-indigo-500" />
            {data.personalInfo.email}
          </span>
          <span className="flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-indigo-500" />
            {data.personalInfo.phone}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            {getBilingualValue(data.personalInfo.location || '', data.personalInfo.location_secondary, mode)}
          </span>
          {data.personalInfo.website && (
            <span className="flex items-center gap-1 col-span-2 md:col-span-1">
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              {data.personalInfo.website}
            </span>
          )}
        </div>
      </header>

      {/* Structured Sections */}
      <div className="flex-1 space-y-5">
        {orderedSections.filter(s => s.type !== 'personal').map(s => renderSection(s))}
      </div>
    </div>
  );
};
