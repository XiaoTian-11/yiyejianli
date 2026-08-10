import React, { useState, useEffect, useRef } from 'react';
import { ResumeData, Experience, Education, Project, CustomSection, CustomSectionItem, MembershipTier, ResumeSection, SectionType } from '../types';
import { Plus, Trash2, ChevronDown, ChevronUp, AlertCircle, GripVertical, Bold, Italic, Underline, Info, Globe, Camera, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ResumeEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  userTier: MembershipTier;
  onTriggerUpgrade?: (reason?: string) => void;
}

export const LANGUAGES = [
  { code: 'zh', name: '简体中文' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
];

const RichTextEditor: React.FC<{
  value: string;
  onChange: (val: string) => void;
  secondaryValue?: string;
  onSecondaryChange?: (val: string) => void;
  secondaryLabel?: string;
  placeholder?: string;
  hint?: string;
}> = ({ value, onChange, secondaryValue, onSecondaryChange, secondaryLabel, placeholder, hint }) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const secondaryContentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== value) {
      contentRef.current.innerHTML = value;
    }
  }, [value]);

  useEffect(() => {
    if (secondaryContentRef.current && secondaryContentRef.current.innerHTML !== (secondaryValue || '')) {
      secondaryContentRef.current.innerHTML = secondaryValue || '';
    }
  }, [secondaryValue]);

  const handleInput = () => {
    if (contentRef.current) {
      onChange(contentRef.current.innerHTML);
    }
  };

  const handleSecondaryInput = () => {
    if (secondaryContentRef.current && onSecondaryChange) {
      onSecondaryChange(secondaryContentRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, isSecondary = false) => {
    document.execCommand(command, false);
    if (isSecondary) {
      handleSecondaryInput();
    } else {
      handleInput();
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 mb-1 p-1 bg-slate-50 rounded-lg border border-slate-100">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }}
          className="p-1.5 hover:bg-white hover:shadow-sm rounded transition-all"
          title="加粗 (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }}
          className="p-1.5 hover:bg-white hover:shadow-sm rounded transition-all"
          title="斜体 (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('underline'); }}
          className="p-1.5 hover:bg-white hover:shadow-sm rounded transition-all"
          title="下划线 (Ctrl+U)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
      </div>
      <div
        ref={contentRef}
        contentEditable
        onInput={handleInput}
        className="w-full px-4 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none min-h-[120px] text-sm leading-relaxed"
        data-placeholder={placeholder}
      />

      {secondaryLabel && onSecondaryChange && (
        <div className="mt-3 pl-3 border-l-2 border-blue-100 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-bold text-blue-500 uppercase tracking-widest block">{secondaryLabel} 翻译译文</label>
            <div className="flex items-center gap-1 p-0.5 bg-blue-50/50 rounded border border-blue-100/30">
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); execCommand('bold', true); }}
                className="p-1 hover:bg-white rounded text-blue-600"
              >
                <Bold className="w-3 h-3" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); execCommand('italic', true); }}
                className="p-1 hover:bg-white rounded text-blue-600"
              >
                <Italic className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div
            ref={secondaryContentRef}
            contentEditable
            onInput={handleSecondaryInput}
            className="w-full px-3 py-2 bg-blue-50/10 border border-blue-100/30 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 focus:bg-white transition-all outline-none min-h-[100px] text-xs leading-relaxed text-slate-600"
            data-placeholder={`输入 ${secondaryLabel} 对应的内容翻译...`}
          />
        </div>
      )}

      {hint && (
        <p className="text-[10px] text-slate-400 flex items-center gap-1 ml-1">
          <Info className="w-3 h-3" /> {hint}
        </p>
      )}
    </div>
  );
};

const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  secondaryLabel?: string;
  secondaryValue?: string;
  onSecondaryChange?: (val: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
}> = ({ label, value, onChange, secondaryLabel, secondaryValue, onSecondaryChange, placeholder, hint, type = "text" }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 focus:bg-white transition-all outline-none text-sm"
      placeholder={placeholder}
    />
    {secondaryLabel && onSecondaryChange && (
      <div className="mt-1.5 pl-3 border-l-2 border-blue-100 space-y-1">
        <label className="text-[9px] font-bold text-blue-500 uppercase tracking-widest block">{secondaryLabel} 翻译</label>
        <input
          type={type}
          value={secondaryValue || ''}
          onChange={(e) => onSecondaryChange(e.target.value)}
          className="w-full px-3 py-2 bg-blue-50/10 border border-blue-100/30 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 focus:bg-white transition-all outline-none text-xs text-slate-600"
          placeholder={`输入 ${secondaryLabel} 翻译...`}
        />
      </div>
    )}
    {hint && (
      <p className="text-[10px] text-slate-400 flex items-center gap-1 ml-1">
        <Info className="w-3 h-3" /> {hint}
      </p>
    )}
  </div>
);

const TagInput: React.FC<{
  tags: string[];
  onChange: (tags: string[]) => void;
  secondaryTags?: string[];
  onSecondaryChange?: (tags: string[]) => void;
  secondaryLabel?: string;
  hint?: string;
}> = ({ tags, onChange, secondaryTags = [], onSecondaryChange, secondaryLabel, hint }) => {
  const [input, setInput] = useState('');
  const [secInput, setSecInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) {
        onChange([...tags, input.trim()]);
      }
      setInput('');
    }
  };

  const handleSecKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && secInput.trim()) {
      e.preventDefault();
      if (onSecondaryChange && !secondaryTags.includes(secInput.trim())) {
        onSecondaryChange([...secondaryTags, secInput.trim()]);
      }
      setSecInput('');
    }
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag));
  };

  const removeSecTag = (tag: string) => {
    if (onSecondaryChange) {
      onSecondaryChange(secondaryTags.filter(t => t !== tag));
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">专业技能</label>
        <div className="flex flex-wrap gap-2 p-3 bg-slate-50/50 border border-slate-100 rounded-2xl focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-200 focus-within:bg-white transition-all">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900">
                <Trash2 className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-[120px] bg-transparent outline-none text-sm p-1"
            placeholder="输入后按回车添加..."
          />
        </div>
      </div>

      {secondaryLabel && onSecondaryChange && (
        <div className="pl-3 border-l-2 border-blue-100 space-y-2">
          <label className="text-[9px] font-bold text-blue-500 uppercase tracking-widest block">{secondaryLabel} 翻译译文列表</label>
          <div className="flex flex-wrap gap-2 p-2.5 bg-blue-50/10 border border-blue-100/30 rounded-xl focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-200 focus-within:bg-white transition-all">
            {secondaryTags.map(tag => (
              <span key={tag} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 text-xs font-semibold">
                {tag}
                <button type="button" onClick={() => removeSecTag(tag)} className="hover:text-blue-800 ml-1">
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            <input
              value={secInput}
              onChange={(e) => setSecInput(e.target.value)}
              onKeyDown={handleSecKeyDown}
              className="flex-1 min-w-[100px] bg-transparent outline-none text-xs p-1"
              placeholder={`输入并按回车添加技能翻译...`}
            />
          </div>
        </div>
      )}

      {hint && (
        <p className="text-[10px] text-slate-400 flex items-center gap-1 ml-1">
          <Info className="w-3 h-3" /> {hint}
        </p>
      )}
    </div>
  );
};

const SortableSubItem: React.FC<{
  id: string;
  onRemove: () => void;
  children: React.ReactNode;
}> = ({ id, onRemove, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="p-6 bg-slate-50/30 border border-slate-100 rounded-3xl relative group">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div {...attributes} {...listeners} className="p-2 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing transition-colors">
          <GripVertical className="w-4 h-4" />
        </div>
        <button
          onClick={onRemove}
          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {children}
    </div>
  );
};

export const ResumeEditor: React.FC<ResumeEditorProps> = ({ data, onChange, userTier, onTriggerUpgrade }) => {
  const [activeSection, setActiveSection] = React.useState<string>('personal');
  const [translating, setTranslating] = React.useState(false);
  const [transError, setTransError] = React.useState<string | null>(null);

  const getSecondaryLabel = (): string | undefined => {
    if (!data.secondaryLanguage) return undefined;
    const l = LANGUAGES.find(lang => lang.code === data.secondaryLanguage);
    return l ? l.name : undefined;
  };

  const secLabel = getSecondaryLabel();

  // ── 每日翻译次数限制 ──
  const getDailyTransCount = (): number => {
    const key = `trans_count_${new Date().toISOString().slice(0, 10)}`;
    return parseInt(localStorage.getItem(key) || '0', 10);
  };
  const incrementDailyTransCount = () => {
    const key = `trans_count_${new Date().toISOString().slice(0, 10)}`;
    localStorage.setItem(key, String(getDailyTransCount() + 1));
  };
  const checkTransLimit = (): boolean => {
    const max = userTier === 'member' ? 20 : 1;
    if (getDailyTransCount() >= max) {
      onTriggerUpgrade?.('translate');
      return false;
    }
    return true;
  };

  const handleAiTranslate = async () => {
    if (!data.secondaryLanguage) {
      alert("请先选择‘副语言 (Secondary Language)’");
      return;
    }
    if (!checkTransLimit()) return;
    setTranslating(true);
    setTransError(null);

    // Build flat map (skip empty values to save tokens)
    const textMap: Record<string, string> = {};
    if (data.personalInfo.fullName) textMap["personalInfo.fullName"] = data.personalInfo.fullName;
    if (data.personalInfo.jobTitle) textMap["personalInfo.jobTitle"] = data.personalInfo.jobTitle;
    if (data.personalInfo.location) textMap["personalInfo.location"] = data.personalInfo.location;
    if (data.summary) textMap["summary"] = data.summary;

    data.experience.forEach(exp => {
      if (exp.company) textMap[`experience.${exp.id}.company`] = exp.company;
      if (exp.position) textMap[`experience.${exp.id}.position`] = exp.position;
      if (exp.description) textMap[`experience.${exp.id}.description`] = exp.description;
      if (exp.startDate) textMap[`experience.${exp.id}.startDate`] = exp.startDate;
      if (exp.endDate) textMap[`experience.${exp.id}.endDate`] = exp.endDate;
    });

    data.education.forEach(edu => {
      if (edu.school) textMap[`education.${edu.id}.school`] = edu.school;
      if (edu.degree) textMap[`education.${edu.id}.degree`] = edu.degree;
    });

    data.projects.forEach(proj => {
      if (proj.name) textMap[`projects.${proj.id}.name`] = proj.name;
      if (proj.description) textMap[`projects.${proj.id}.description`] = proj.description;
      if (proj.role) textMap[`projects.${proj.id}.role`] = proj.role;
      if (proj.startDate) textMap[`projects.${proj.id}.startDate`] = proj.startDate;
      if (proj.endDate) textMap[`projects.${proj.id}.endDate`] = proj.endDate;
    });

    if (data.skills && data.skills.length > 0) {
      textMap["skills"] = data.skills.join(", ");
    }

    data.customSections?.forEach(cs => {
      if (cs.title) textMap[`customSection.${cs.id}.title`] = cs.title;
      cs.items.forEach(item => {
        if (item.title) textMap[`customSectionItem.${cs.id}.${item.id}.title`] = item.title;
        if (item.content) textMap[`customSectionItem.${cs.id}.${item.id}.content`] = item.content;
      });
    });

    data.sections.forEach(sec => {
      if (sec.title) textMap[`sectionHeader.${sec.id}`] = sec.title;
    });

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textMap,
          fromLang: data.primaryLanguage || 'zh',
          toLang: data.secondaryLanguage
        })
      });

      if (!response.ok) {
        throw new Error(await response.text() || "Translation failed");
      }

      const resJson = await response.json();
      const translated = resJson.translatedMap;
      if (!translated) {
        throw new Error("No translation returned in server response.");
      }

      const updatedData = { ...data };

      // Map back
      if (translated["personalInfo.fullName"]) updatedData.personalInfo.fullName_secondary = translated["personalInfo.fullName"];
      if (translated["personalInfo.jobTitle"]) updatedData.personalInfo.jobTitle_secondary = translated["personalInfo.jobTitle"];
      if (translated["personalInfo.location"]) updatedData.personalInfo.location_secondary = translated["personalInfo.location"];
      if (translated["summary"]) updatedData.summary_secondary = translated["summary"];

      updatedData.experience = data.experience.map(exp => ({
        ...exp,
        company_secondary: translated[`experience.${exp.id}.company`] || exp.company_secondary,
        position_secondary: translated[`experience.${exp.id}.position`] || exp.position_secondary,
        description_secondary: translated[`experience.${exp.id}.description`] || exp.description_secondary,
        startDate_secondary: translated[`experience.${exp.id}.startDate`] || exp.startDate_secondary,
        endDate_secondary: translated[`experience.${exp.id}.endDate`] || exp.endDate_secondary,
      }));

      updatedData.education = data.education.map(edu => ({
        ...edu,
        school_secondary: translated[`education.${edu.id}.school`] || edu.school_secondary,
        degree_secondary: translated[`education.${edu.id}.degree`] || edu.degree_secondary,
        startDate_secondary: translated[`education.${edu.id}.startDate`] || edu.startDate_secondary,
        endDate_secondary: translated[`education.${edu.id}.endDate`] || edu.endDate_secondary,
      }));

      updatedData.projects = data.projects.map(proj => ({
        ...proj,
        name_secondary: translated[`projects.${proj.id}.name`] || proj.name_secondary,
        description_secondary: translated[`projects.${proj.id}.description`] || proj.description_secondary,
        role_secondary: translated[`projects.${proj.id}.role`] || proj.role_secondary,
        startDate_secondary: translated[`projects.${proj.id}.startDate`] || proj.startDate_secondary,
        endDate_secondary: translated[`projects.${proj.id}.endDate`] || proj.endDate_secondary,
      }));

      if (translated["skills"]) {
        updatedData.skills_secondary = translated["skills"].split(",").map((s: string) => s.trim());
      }

      if (data.customSections) {
        updatedData.customSections = data.customSections.map(cs => ({
          ...cs,
          title_secondary: translated[`customSection.${cs.id}.title`] || cs.title_secondary,
          items: cs.items.map(item => ({
            ...item,
            title_secondary: translated[`customSectionItem.${cs.id}.${item.id}.title`] || item.title_secondary,
            content_secondary: translated[`customSectionItem.${cs.id}.${item.id}.content`] || item.content_secondary,
          })),
        }));
      }

      updatedData.sections = data.sections.map(sec => ({
        ...sec,
        title_secondary: translated[`sectionHeader.${sec.id}`] || sec.title_secondary,
      }));

      updatedData.displayMode = 'bilingual';

      onChange(updatedData);
      incrementDailyTransCount();
      alert("AI 翻译完成！您的简历已成功翻译。双语排版视图已开启！可以在板块下方继续微调译文。");
    } catch (err: any) {
      console.error(err);
      setTransError(err?.message || "翻译请求出错，请检查服务器连接或稍后再试");
    } finally {
      setTranslating(false);
    }
  };

  /** 纯翻译模式：翻译后替换原文（非双语对照） */
  const handlePureTranslate = async () => {
    if (!data.secondaryLanguage) {
      alert("请先选择目标翻译语言");
      return;
    }
    setTranslating(true);
    setTransError(null);

    // Build flat map (same as bilingual, skip empty)
    const textMap: Record<string, string> = {};
    if (data.personalInfo.fullName) textMap["personalInfo.fullName"] = data.personalInfo.fullName;
    if (data.personalInfo.jobTitle) textMap["personalInfo.jobTitle"] = data.personalInfo.jobTitle;
    if (data.personalInfo.location) textMap["personalInfo.location"] = data.personalInfo.location;
    if (data.summary) textMap["summary"] = data.summary;

    data.experience.forEach(exp => {
      if (exp.company) textMap[`experience.${exp.id}.company`] = exp.company;
      if (exp.position) textMap[`experience.${exp.id}.position`] = exp.position;
      if (exp.description) textMap[`experience.${exp.id}.description`] = exp.description;
      if (exp.startDate) textMap[`experience.${exp.id}.startDate`] = exp.startDate;
      if (exp.endDate) textMap[`experience.${exp.id}.endDate`] = exp.endDate;
    });

    data.education.forEach(edu => {
      if (edu.school) textMap[`education.${edu.id}.school`] = edu.school;
      if (edu.degree) textMap[`education.${edu.id}.degree`] = edu.degree;
    });

    data.projects.forEach(proj => {
      if (proj.name) textMap[`projects.${proj.id}.name`] = proj.name;
      if (proj.description) textMap[`projects.${proj.id}.description`] = proj.description;
      if (proj.role) textMap[`projects.${proj.id}.role`] = proj.role;
      if (proj.startDate) textMap[`projects.${proj.id}.startDate`] = proj.startDate;
      if (proj.endDate) textMap[`projects.${proj.id}.endDate`] = proj.endDate;
    });

    if (data.skills && data.skills.length > 0) {
      textMap["skills"] = data.skills.join(", ");
    }

    data.customSections?.forEach(cs => {
      if (cs.title) textMap[`customSection.${cs.id}.title`] = cs.title;
      cs.items.forEach(item => {
        if (item.title) textMap[`customSectionItem.${cs.id}.${item.id}.title`] = item.title;
        if (item.content) textMap[`customSectionItem.${cs.id}.${item.id}.content`] = item.content;
      });
    });

    data.sections.forEach(sec => {
      if (sec.title) textMap[`sectionHeader.${sec.id}`] = sec.title;
    });

    try {
      // Backup original content before translating
      const backup: Record<string, any> = {
        personalInfo: { ...data.personalInfo },
        summary: data.summary,
        experience: data.experience.map(e => ({ ...e })),
        education: data.education.map(e => ({ ...e })),
        projects: data.projects.map(p => ({ ...p })),
        skills: [...data.skills],
        sections: data.sections.map(s => ({ ...s })),
        primaryLanguage: data.primaryLanguage || 'zh',
      };
      if (data.customSections) {
        backup.customSections = data.customSections.map(cs => ({
          ...cs,
          items: cs.items.map(item => ({ ...item })),
        }));
      }

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textMap,
          fromLang: data.primaryLanguage || 'zh',
          toLang: data.secondaryLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error((await response.text()) || "Translation failed");
      }

      const resJson = await response.json();
      const translated = resJson.translatedMap;
      if (!translated) {
        throw new Error("No translation returned in server response.");
      }

      const updatedData = { ...data };

      // Write translations to PRIMARY fields (replace original)
      if (translated["personalInfo.fullName"]) updatedData.personalInfo = { ...updatedData.personalInfo, fullName: translated["personalInfo.fullName"] };
      if (translated["personalInfo.jobTitle"]) updatedData.personalInfo = { ...updatedData.personalInfo, jobTitle: translated["personalInfo.jobTitle"] };
      if (translated["personalInfo.location"]) updatedData.personalInfo = { ...updatedData.personalInfo, location: translated["personalInfo.location"] };
      if (translated["summary"]) updatedData.summary = translated["summary"];

      updatedData.experience = data.experience.map(exp => ({
        ...exp,
        company: translated[`experience.${exp.id}.company`] || exp.company,
        position: translated[`experience.${exp.id}.position`] || exp.position,
        description: translated[`experience.${exp.id}.description`] || exp.description,
        startDate: translated[`experience.${exp.id}.startDate`] || exp.startDate,
        endDate: translated[`experience.${exp.id}.endDate`] || exp.endDate,
      }));

      updatedData.education = data.education.map(edu => ({
        ...edu,
        school: translated[`education.${edu.id}.school`] || edu.school,
        degree: translated[`education.${edu.id}.degree`] || edu.degree,
      }));

      updatedData.projects = data.projects.map(proj => ({
        ...proj,
        name: translated[`projects.${proj.id}.name`] || proj.name,
        description: translated[`projects.${proj.id}.description`] || proj.description,
        role: translated[`projects.${proj.id}.role`] || proj.role,
        startDate: translated[`projects.${proj.id}.startDate`] || proj.startDate,
        endDate: translated[`projects.${proj.id}.endDate`] || proj.endDate,
      }));

      if (translated["skills"]) {
        updatedData.skills = translated["skills"].split(",").map((s: string) => s.trim());
      }

      if (data.customSections) {
        updatedData.customSections = data.customSections.map(cs => ({
          ...cs,
          title: translated[`customSection.${cs.id}.title`] || cs.title,
          items: cs.items.map(item => ({
            ...item,
            title: translated[`customSectionItem.${cs.id}.${item.id}.title`] || item.title,
            content: translated[`customSectionItem.${cs.id}.${item.id}.content`] || item.content,
          })),
        }));
      }

      updatedData.sections = data.sections.map(sec => ({
        ...sec,
        title: translated[`sectionHeader.${sec.id}`] || sec.title,
      }));

      // Store backup and switch to target language
      updatedData.primaryLanguage = data.secondaryLanguage;
      updatedData.displayMode = 'primary';
      updatedData._sourceLanguage = data.primaryLanguage || 'zh';
      updatedData._originalBackup = JSON.stringify(backup);

      const targetName = LANGUAGES.find(l => l.code === data.secondaryLanguage)?.name || data.secondaryLanguage;
      onChange(updatedData);
      incrementDailyTransCount();
      alert(`纯翻译完成！简历内容已替换为${targetName}。可在下方点击「恢复原文」还原。`);
    } catch (err: any) {
      console.error(err);
      setTransError(err?.message || "翻译请求出错，请检查服务器连接或稍后再试");
    } finally {
      setTranslating(false);
    }
  };

  /** 恢复原文：从 _originalBackup 还原翻译前的内容 */
  const handleRevertOriginal = () => {
    if (!data._originalBackup) return;
    try {
      const backup = JSON.parse(data._originalBackup);
      const updatedData: ResumeData = {
        ...data,
        personalInfo: backup.personalInfo,
        summary: backup.summary,
        experience: backup.experience,
        education: backup.education,
        projects: backup.projects,
        skills: backup.skills,
        sections: backup.sections,
        primaryLanguage: backup.primaryLanguage || data._sourceLanguage || 'zh',
        customSections: backup.customSections || data.customSections,
        _originalBackup: undefined,
        _sourceLanguage: undefined,
      };
      onChange(updatedData);
    } catch (err) {
      console.error("恢复原文失败:", err);
      alert("恢复原文失败，备份数据已损坏");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Check if we are sorting main sections
    const activeSectionIndex = data.sections.findIndex(s => s.id === active.id);
    if (activeSectionIndex !== -1) {
      const overSectionIndex = data.sections.findIndex(s => s.id === over.id);
      onChange({
        ...data,
        sections: arrayMove(data.sections, activeSectionIndex, overSectionIndex),
      });
      return;
    }

    // Check if we are sorting items inside a section
    // We need to identify which array we are sorting
    const activeId = active.id as string;
    
    // Sort Experience
    if (data.experience.some(e => e.id === activeId)) {
      const oldIdx = data.experience.findIndex(e => e.id === activeId);
      const newIdx = data.experience.findIndex(e => e.id === over.id);
      onChange({ ...data, experience: arrayMove(data.experience, oldIdx, newIdx) });
      return;
    }

    // Sort Education
    if (data.education.some(e => e.id === activeId)) {
      const oldIdx = data.education.findIndex(e => e.id === activeId);
      const newIdx = data.education.findIndex(e => e.id === over.id);
      onChange({ ...data, education: arrayMove(data.education, oldIdx, newIdx) });
      return;
    }

    // Sort Projects
    if (data.projects.some(p => p.id === activeId)) {
      const oldIdx = data.projects.findIndex(p => p.id === activeId);
      const newIdx = data.projects.findIndex(p => p.id === over.id);
      onChange({ ...data, projects: arrayMove(data.projects, oldIdx, newIdx) });
      return;
    }

    // Sort Custom Items
    for (const section of (data.customSections || [])) {
      if (section.items.some(i => i.id === activeId)) {
        const oldIdx = section.items.findIndex(i => i.id === activeId);
        const newIdx = section.items.findIndex(i => i.id === over.id);
        const updatedSections = data.customSections?.map(cs => 
          cs.id === section.id 
            ? { ...cs, items: arrayMove(cs.items, oldIdx, newIdx) }
            : cs
        );
        onChange({ ...data, customSections: updatedSections });
        break;
      }
    }
  };

  const updateSectionTitle = (sectionId: string, newTitle: string) => {
    const section = data.sections.find(s => s.id === sectionId);
    if (!section) return;

    let newData = { ...data };
    newData.sections = data.sections.map(s => s.id === sectionId ? { ...s, title: newTitle } : s);

    if (section.type === 'custom' && section.customId) {
      newData.customSections = data.customSections?.map(cs => 
        cs.id === section.customId ? { ...cs, title: newTitle } : cs
      );
    }
    
    onChange(newData);
  };

  const updatePersonalInfo = (field: keyof ResumeData['personalInfo'], value: string) => {
    onChange({
      ...data,
      personalInfo: { ...data.personalInfo, [field]: value },
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      updatePersonalInfo('photo', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    updatePersonalInfo('photo', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderPhotoUpload = () => {
    const photoUrl = data.personalInfo.photo;
    return (
      <div className="flex flex-col items-center gap-3 mb-6">
        <div className="relative">
          {photoUrl ? (
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200">
              <img src={photoUrl} alt="头像" className="w-full h-full object-cover" />
              <button
                onClick={handleRemovePhoto}
                className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                title="移除照片"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
            >
              <Camera className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
              <span className="text-[10px] text-slate-400 group-hover:text-blue-500 mt-1 font-medium">上传照片</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>
        {!photoUrl && (
          <p className="text-[11px] text-slate-400">支持 JPG/PNG/WebP，建议 1:1 比例，不超过 2MB</p>
        )}
      </div>
    );
  };

  const updateSummary = (value: string) => {
    onChange({ ...data, summary: value });
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: uuidv4(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
    };
    onChange({ ...data, experience: [...data.experience, newExp] });
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    onChange({
      ...data,
      experience: data.experience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    });
  };

  const removeExperience = (id: string) => {
    onChange({
      ...data,
      experience: data.experience.filter((exp) => exp.id !== id),
    });
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: uuidv4(),
      school: '',
      degree: '',
      startDate: '',
      endDate: '',
    };
    onChange({ ...data, education: [...data.education, newEdu] });
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    onChange({
      ...data,
      education: data.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    });
  };

  const removeEducation = (id: string) => {
    onChange({
      ...data,
      education: data.education.filter((edu) => edu.id !== id),
    });
  };

  const updateSkills = (tags: string[]) => {
    onChange({ ...data, skills: tags });
  };

  const updateSkills_secondary = (tags: string[]) => {
    onChange({ ...data, skills_secondary: tags });
  };

  const updateSummary_secondary = (value: string) => {
    onChange({ ...data, summary_secondary: value });
  };

  const addProject = () => {
    const newProj: Project = {
      id: uuidv4(),
      name: '',
      description: '',
      link: '',
      role: '',
      startDate: '',
      endDate: '',
    };
    onChange({ ...data, projects: [...data.projects, newProj] });
  };

  const updateProject = (id: string, field: keyof Project, value: string) => {
    onChange({
      ...data,
      projects: data.projects.map((proj) =>
        proj.id === id ? { ...proj, [field]: value } : proj
      ),
    });
  };

  const removeProject = (id: string) => {
    onChange({
      ...data,
      projects: data.projects.filter((proj) => proj.id !== id),
    });
  };

  const addCustomSection = () => {
    const customLimit = userTier === 'member' ? 99 : 3;
    const currentCount = data.customSections?.length || 0;
    
    if (currentCount >= customLimit) {
      if (onTriggerUpgrade) {
        onTriggerUpgrade('sections');
      } else {
        alert(`自定义板块已达到上限 (${customLimit})，升级会员解锁更多额度。`);
      }
      return;
    }

    const newCustom: CustomSection = {
      id: uuidv4(),
      title: '自定义板块',
      items: [{ id: uuidv4(), title: '', content: '' }]
    };

    const newSection: ResumeSection = {
      id: uuidv4(),
      type: 'custom',
      title: '自定义板块',
      customId: newCustom.id
    };

    onChange({ 
      ...data, 
      customSections: [...(data.customSections || []), newCustom],
      sections: [...data.sections, newSection]
    });
    setActiveSection(newSection.id);
  };

  const removeSection = (sectionId: string) => {
    const section = data.sections.find(s => s.id === sectionId);
    if (!section) return;

    let newData = { ...data };
    
    // If it's a custom section, also remove from customSections array
    if (section.type === 'custom' && section.customId) {
      newData.customSections = data.customSections?.filter(cs => cs.id !== section.customId);
    } else {
      // If it's a core section, check if we can remove it (user wants optional sections)
      // Usually personal info shouldn't be removed, but other sections can be
      if (section.type === 'personal') return;
      
      // Just filter it out from sections order. 
      // The data remains but it won't be shown or previewed.
    }

    newData.sections = data.sections.filter(s => s.id !== sectionId);
    onChange(newData);
  };

  const addCoreSection = (type: SectionType) => {
    const existingCount = data.sections.filter(s => s.type === type).length;
    if (existingCount >= 2) {
      alert(`每个模块最多添加 2 个重复模块。`);
      return;
    }

    const titles: Record<SectionType, string> = {
      personal: '基本信息',
      summary: '自我评价',
      experience: '工作经历',
      education: '教育经历',
      projects: '项目经历',
      skills: '专业技能',
      custom: '自定义板块'
    };

    const newSection: ResumeSection = {
      id: uuidv4(),
      type,
      title: titles[type] || '新模块'
    };

    onChange({
      ...data,
      sections: [...data.sections, newSection]
    });
    setActiveSection(newSection.id);
  };

  const renderSectionContent = (section: ResumeSection) => {
    switch (section.type) {
      case 'personal':
        return (
          <div className="p-8 space-y-6">
            {renderPhotoUpload()}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="姓名"
                value={data.personalInfo.fullName}
                onChange={(val) => updatePersonalInfo('fullName', val)}
                secondaryLabel={secLabel}
                secondaryValue={data.personalInfo.fullName_secondary}
                onSecondaryChange={(val) => updatePersonalInfo('fullName_secondary' as any, val)}
                placeholder="张悦悦"
              />
              <InputField
                label="职位名称"
                value={data.personalInfo.jobTitle}
                onChange={(val) => updatePersonalInfo('jobTitle', val)}
                secondaryLabel={secLabel}
                secondaryValue={data.personalInfo.jobTitle_secondary}
                onSecondaryChange={(val) => updatePersonalInfo('jobTitle_secondary' as any, val)}
                placeholder="高级产品经理"
              />
              <InputField
                label="电子邮箱"
                value={data.personalInfo.email}
                onChange={(val) => updatePersonalInfo('email', val)}
                placeholder="zhang@example.com"
                hint="建议填写常用邮箱"
              />
              <InputField
                label="电话号码"
                value={data.personalInfo.phone}
                onChange={(val) => updatePersonalInfo('phone', val)}
                placeholder="138-xxxx-xxxx"
                hint="建议填写手机号"
              />
              <InputField
                label="所在城市"
                value={data.personalInfo.location || ''}
                onChange={(val) => updatePersonalInfo('location', val)}
                secondaryLabel={secLabel}
                secondaryValue={data.personalInfo.location_secondary}
                onSecondaryChange={(val) => updatePersonalInfo('location_secondary' as any, val)}
                placeholder="上海"
                hint="填写当前居住城市"
              />
              <InputField
                label="个人主页/作品集 (可选)"
                value={data.personalInfo.website || ''}
                onChange={(val) => updatePersonalInfo('website', val)}
                placeholder="例如: https://yourportfolio.com 或 yuejianli.com"
                hint="您的个人网站、作品集、或博客主页链接"
              />
              <InputField
                label="领英链接/社交主页 (可选)"
                value={data.personalInfo.linkedin || ''}
                onChange={(val) => updatePersonalInfo('linkedin', val)}
                placeholder="例如: linkedin.com/in/username"
                hint="领英职业社交网络主页链接"
              />
            </div>
          </div>
        );
      case 'summary':
        return (
          <div className="p-8">
            <RichTextEditor
              value={data.summary}
              onChange={updateSummary}
              secondaryValue={data.summary_secondary}
              onSecondaryChange={updateSummary_secondary}
              secondaryLabel={secLabel}
              placeholder="讲述您的专业故事，突出核心成就..."
              hint="3-4 句话概括您的核心优势"
            />
          </div>
        );
      case 'experience':
        return (
          <div className="p-8 space-y-6">
            <SortableContext items={data.experience.map(e => e.id)} strategy={verticalListSortingStrategy}>
              {data.experience.map((exp) => (
                <SortableSubItem key={exp.id} id={exp.id} onRemove={() => removeExperience(exp.id)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="公司名称"
                      value={exp.company}
                      onChange={(val) => updateExperience(exp.id, 'company', val)}
                      secondaryLabel={secLabel}
                      secondaryValue={exp.company_secondary}
                      onSecondaryChange={(val) => updateExperience(exp.id, 'company_secondary', val)}
                      placeholder="公司名称"
                    />
                    <InputField
                      label="职位"
                      value={exp.position}
                      onChange={(val) => updateExperience(exp.id, 'position', val)}
                      secondaryLabel={secLabel}
                      secondaryValue={exp.position_secondary}
                      onSecondaryChange={(val) => updateExperience(exp.id, 'position_secondary', val)}
                      placeholder="职位"
                      hint="公司名称 | 职位"
                    />
                    <InputField
                      label="开始日期"
                      value={exp.startDate}
                      onChange={(val) => updateExperience(exp.id, 'startDate', val)}
                      secondaryLabel={secLabel}
                      secondaryValue={exp.startDate_secondary}
                      onSecondaryChange={(val) => updateExperience(exp.id, 'startDate_secondary', val)}
                      placeholder="2023.06"
                    />
                    <InputField
                      label="结束日期"
                      value={exp.endDate}
                      onChange={(val) => updateExperience(exp.id, 'endDate', val)}
                      secondaryLabel={secLabel}
                      secondaryValue={exp.endDate_secondary}
                      onSecondaryChange={(val) => updateExperience(exp.id, 'endDate_secondary', val)}
                      placeholder="至今"
                    />
                    <div className="md:col-span-2">
                      <RichTextEditor
                        value={exp.description}
                        onChange={(val) => updateExperience(exp.id, 'description', val)}
                        secondaryValue={exp.description_secondary}
                        onSecondaryChange={(val) => updateExperience(exp.id, 'description_secondary', val)}
                        secondaryLabel={secLabel}
                        placeholder="工作描述"
                      />
                    </div>
                  </div>
                </SortableSubItem>
              ))}
            </SortableContext>
            <button
              onClick={addExperience}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> 添加经历项
            </button>
          </div>
        );
      case 'education':
        return (
          <div className="p-8 space-y-6">
            <SortableContext items={data.education.map(e => e.id)} strategy={verticalListSortingStrategy}>
              {data.education.map((edu) => (
                <SortableSubItem key={edu.id} id={edu.id} onRemove={() => removeEducation(edu.id)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="学校名称"
                      value={edu.school}
                      onChange={(val) => updateEducation(edu.id, 'school', val)}
                      secondaryLabel={secLabel}
                      secondaryValue={edu.school_secondary}
                      onSecondaryChange={(val) => updateEducation(edu.id, 'school_secondary', val)}
                      placeholder="学校名称"
                    />
                    <InputField
                      label="学位 / 专业"
                      value={edu.degree}
                      onChange={(val) => updateEducation(edu.id, 'degree', val)}
                      secondaryLabel={secLabel}
                      secondaryValue={edu.degree_secondary}
                      onSecondaryChange={(val) => updateEducation(edu.id, 'degree_secondary', val)}
                      placeholder="学位 / 专业"
                    />
                    <InputField
                      label="开始日期"
                      value={edu.startDate}
                      onChange={(val) => updateEducation(edu.id, 'startDate', val)}
                      secondaryLabel={secLabel}
                      secondaryValue={edu.startDate_secondary}
                      onSecondaryChange={(val) => updateEducation(edu.id, 'startDate_secondary', val)}
                      placeholder="YYYY.MM"
                    />
                    <InputField
                      label="结束日期"
                      value={edu.endDate}
                      onChange={(val) => updateEducation(edu.id, 'endDate', val)}
                      secondaryLabel={secLabel}
                      secondaryValue={edu.endDate_secondary}
                      onSecondaryChange={(val) => updateEducation(edu.id, 'endDate_secondary', val)}
                      placeholder="YYYY.MM"
                    />
                  </div>
                </SortableSubItem>
              ))}
            </SortableContext>
            <button
              onClick={addEducation}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> 添加教育背景
            </button>
          </div>
        );
      case 'projects':
        return (
          <div className="p-8 space-y-6">
            <SortableContext items={data.projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
              {data.projects.map((proj) => (
                <SortableSubItem key={proj.id} id={proj.id} onRemove={() => removeProject(proj.id)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="项目名称"
                      value={proj.name}
                      onChange={(val) => updateProject(proj.id, 'name', val)}
                      secondaryLabel={secLabel}
                      secondaryValue={proj.name_secondary}
                      onSecondaryChange={(val) => updateProject(proj.id, 'name_secondary', val)}
                      placeholder="例如: 智能简历系统"
                    />
                    <InputField
                      label="担任角色"
                      value={proj.role || ''}
                      onChange={(val) => updateProject(proj.id, 'role', val)}
                      secondaryLabel={secLabel}
                      secondaryValue={proj.role_secondary}
                      onSecondaryChange={(val) => updateProject(proj.id, 'role_secondary', val)}
                      placeholder="例如: 项目经理 / 前端开发"
                    />
                    <InputField
                      label="开始日期"
                      value={proj.startDate || ''}
                      onChange={(val) => updateProject(proj.id, 'startDate', val)}
                      secondaryLabel={secLabel}
                      secondaryValue={proj.startDate_secondary}
                      onSecondaryChange={(val) => updateProject(proj.id, 'startDate_secondary', val)}
                      placeholder="YYYY.MM"
                    />
                    <InputField
                      label="结束日期"
                      value={proj.endDate || ''}
                      onChange={(val) => updateProject(proj.id, 'endDate', val)}
                      secondaryLabel={secLabel}
                      secondaryValue={proj.endDate_secondary}
                      onSecondaryChange={(val) => updateProject(proj.id, 'endDate_secondary', val)}
                      placeholder="YYYY.MM 或 至今"
                    />
                    <div className="md:col-span-2">
                       <RichTextEditor
                        value={proj.description}
                        onChange={(val) => updateProject(proj.id, 'description', val)}
                        secondaryValue={proj.description_secondary}
                        onSecondaryChange={(val) => updateProject(proj.id, 'description_secondary', val)}
                        secondaryLabel={secLabel}
                        placeholder="项目描述"
                        hint="用 STAR 法则描述：任务 + 行动 + 结果"
                      />
                    </div>
                  </div>
                </SortableSubItem>
              ))}
            </SortableContext>
            <button
              onClick={addProject}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> 添加项目项
            </button>
          </div>
        );
      case 'skills':
        return (
          <div className="p-8">
            <TagInput
              tags={data.skills}
              onChange={updateSkills}
              secondaryTags={data.skills_secondary}
              onSecondaryChange={updateSkills_secondary}
              secondaryLabel={secLabel}
              hint="技能标签：输入后按回车生成标签，支持删除标签"
            />
          </div>
        );
      case 'custom':
        const custom = data.customSections?.find(cs => cs.id === section.customId);
        if (!custom) return null;
        return (
          <div className="p-8 space-y-6">
            <SortableContext items={custom.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              {custom.items.map((item) => (
                <SortableSubItem
                  key={item.id}
                  id={item.id}
                  onRemove={() => {
                    onChange({
                      ...data,
                      customSections: data.customSections?.map(cs =>
                        cs.id === custom.id
                          ? { ...cs, items: cs.items.filter(i => i.id !== item.id) }
                          : cs
                      )
                    });
                  }}
                >
                  <div className="space-y-4">
                    <InputField
                      label="条目标题"
                      value={item.title}
                      onChange={(val) => {
                        onChange({
                          ...data,
                          customSections: data.customSections?.map(cs =>
                            cs.id === custom.id
                              ? { ...cs, items: cs.items.map(i => i.id === item.id ? { ...i, title: val } : i) }
                              : cs
                          )
                        });
                      }}
                      secondaryLabel={secLabel}
                      secondaryValue={item.title_secondary}
                      onSecondaryChange={(val) => {
                        onChange({
                          ...data,
                          customSections: data.customSections?.map(cs =>
                            cs.id === custom.id
                              ? { ...cs, items: cs.items.map(i => i.id === item.id ? { ...i, title_secondary: val } : i) }
                              : cs
                          )
                        });
                      }}
                      placeholder="标题"
                    />
                    <RichTextEditor
                      value={item.content}
                      onChange={(val) => {
                        onChange({
                          ...data,
                          customSections: data.customSections?.map(cs =>
                            cs.id === custom.id
                              ? { ...cs, items: cs.items.map(i => i.id === item.id ? { ...i, content: val } : i) }
                              : cs
                          )
                        });
                      }}
                      secondaryValue={item.content_secondary}
                      onSecondaryChange={(val) => {
                        onChange({
                          ...data,
                          customSections: data.customSections?.map(cs =>
                            cs.id === custom.id
                              ? { ...cs, items: cs.items.map(i => i.id === item.id ? { ...i, content_secondary: val } : i) }
                              : cs
                          )
                        });
                      }}
                      secondaryLabel={secLabel}
                      placeholder="内容描述"
                    />
                  </div>
                </SortableSubItem>
              ))}
            </SortableContext>
            <button
              type="button"
              onClick={() => {
                const newId = uuidv4();
                onChange({
                  ...data,
                  customSections: data.customSections?.map(cs =>
                    cs.id === custom.id
                      ? { ...cs, items: [...cs.items, { id: newId, title: '新条目', content: '' }] }
                      : cs
                  )
                });
              }}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> 添加条目
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/50 overflow-hidden divide-y divide-slate-100 pb-20">
      {/* 🚀 Multi-Language Selection Panel */}
      <div className="p-8 bg-slate-50/40 border-b border-slate-100/50 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600 animate-pulse" />
          <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">多语言简历设置</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-medium">
          您可以为这份简历配置一种<b>副翻译语言</b>。双语对照模式会保留原文并显示译文；纯翻译模式会用译文替换原文，适合直接投递外企。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Primary Language Option */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">主填写语言</label>
            <select
              value={data.primaryLanguage || 'zh'}
              onChange={(e) => onChange({ ...data, primaryLanguage: e.target.value })}
              className="w-full text-xs px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all font-semibold text-slate-700 cursor-pointer"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>

          {/* Secondary (Translated) Language Option */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">副译文语言</label>
            <select
              value={data.secondaryLanguage || ''}
              onChange={(e) => {
                const val = e.target.value;
                onChange({ 
                  ...data, 
                  secondaryLanguage: val,
                  displayMode: val ? (data.displayMode || 'bilingual') : 'primary'
                });
              }}
              className="w-full text-xs px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all font-semibold text-slate-700 cursor-pointer text-blue-600 border-blue-100"
            >
              <option value="">-- 无 (单语言样式) --</option>
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>

          {/* Show Mode Layout Toggle */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">右侧渲染排版视图</label>
            <select
              disabled={!data.secondaryLanguage}
              value={data.displayMode || 'primary'}
              onChange={(e) => onChange({ ...data, displayMode: e.target.value as any })}
              className="w-full text-xs px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all font-semibold text-slate-700 cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100"
            >
              <option value="primary">仅展示主语言内容</option>
              <option value="secondary">仅展示翻译译文内容</option>
              <option value="bilingual">中英/双语对照对照排版 ✨</option>
            </select>
          </div>
        </div>

        {data.secondaryLanguage && (
          <div className="space-y-3 mt-3">
            {/* Translation mode buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 bg-gradient-to-r from-blue-550/5 from-blue-50 to-indigo-50/50 rounded-3xl border border-blue-100/60 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-black text-blue-700 block">
                  ✨ DeepSeek AI 翻译引擎
                </span>
                <p className="text-[11px] text-slate-500 leading-normal">
                  将简历从 <b>{LANGUAGES.find(l=>l.code===data.primaryLanguage)?.name || '中文'}</b> 翻译为 <b>{LANGUAGES.find(l=>l.code===data.secondaryLanguage)?.name}</b>
                </p>
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  disabled={translating}
                  onClick={handleAiTranslate}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-sm cursor-pointer transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-1.5"
                >
                  {translating ? (
                    <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />翻译中...</>
                  ) : (
                    <><Globe className="w-3.5 h-3.5" />双语对照翻译</>
                  )}
                </button>
                <button
                  type="button"
                  disabled={translating}
                  onClick={handlePureTranslate}
                  className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-1.5"
                >
                  {translating ? (
                    <><span className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />翻译中...</>
                  ) : (
                    <><span className="text-sm">🌍</span>纯翻译替换原文</>
                  )}
                </button>
              </div>
            </div>
            {/* Revert bar when pure-translated */}
            {data._originalBackup && (
              <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-3xl">
                <div className="flex items-center gap-2 text-xs text-amber-700 font-medium">
                  <span>📝</span>
                  <span>当前简历已由 <b>{LANGUAGES.find(l=>l.code===data._sourceLanguage)?.name || data._sourceLanguage || '原文'}</b> 纯翻译为 <b>{LANGUAGES.find(l=>l.code===data.primaryLanguage)?.name || data.primaryLanguage}</b></span>
                </div>
                <button
                  type="button"
                  onClick={handleRevertOriginal}
                  className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  恢复原文
                </button>
              </div>
            )}
          </div>
        )}
        {transError && (
          <p className="text-red-500 text-xs font-semibold">{transError}</p>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={data.sections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {data.sections.map((section) => (
            <SortableSection
              key={section.id}
              section={section}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              onRemove={() => removeSection(section.id)}
              onTitleChange={(newTitle) => updateSectionTitle(section.id, newTitle)}
              content={renderSectionContent(section)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Module Management */}
      <div className="p-8 border-t border-slate-100 bg-slate-50/50">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">按需添加模块</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ModuleButton icon={<Plus className="w-4 h-4" />} label="工作经历" onClick={() => addCoreSection('experience')} />
          <ModuleButton icon={<Plus className="w-4 h-4" />} label="教育经历" onClick={() => addCoreSection('education')} />
          <ModuleButton icon={<Plus className="w-4 h-4" />} label="项目经历" onClick={() => addCoreSection('projects')} />
          <ModuleButton icon={<Plus className="w-4 h-4" />} label="自定义" onClick={addCustomSection} />
        </div>
      </div>
    </div>
  );
};

const SortableSection: React.FC<{
  section: ResumeSection;
  activeSection: string;
  setActiveSection: (id: string) => void;
  onRemove: () => void;
  onTitleChange: (title: string) => void;
  content: React.ReactNode;
}> = ({ section, activeSection, setActiveSection, onRemove, onTitleChange, content }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(section.title);

  useEffect(() => {
    setTitle(section.title);
  }, [section.title]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleTitleSubmit = () => {
    setIsEditing(false);
    if (title.trim() && title !== section.title) {
      onTitleChange(title);
    } else {
      setTitle(section.title);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white">
      <div className={cn(
        'group w-full flex items-center justify-between p-5 bg-white transition-all duration-300 border-b border-slate-50',
        activeSection === section.id ? 'bg-slate-50/80' : 'hover:bg-slate-50/50'
      )}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div {...attributes} {...listeners} className="p-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors shrink-0">
            <GripVertical className="w-4 h-4" />
          </div>
          
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {isEditing ? (
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                className="flex-1 bg-white border border-blue-200 rounded-lg px-2 py-1 text-sm font-bold text-blue-600 outline-none"
              />
            ) : (
              <button
                onClick={() => setActiveSection(activeSection === section.id ? '' : section.id)}
                onDoubleClick={() => setIsEditing(true)}
                className="flex-1 text-left min-w-0"
                title="双击重命名"
              >
                <span className={cn(
                  'font-bold tracking-tight transition-colors duration-300 truncate block',
                  activeSection === section.id ? 'text-blue-600 text-lg' : 'text-slate-700'
                )}>
                  {section.title}
                </span>
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {section.type !== 'personal' && (
            <button
              onClick={onRemove}
              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setActiveSection(activeSection === section.id ? '' : section.id)}
            className={cn(
              "p-1.5 rounded-xl transition-all duration-300",
              activeSection === section.id ? "bg-blue-100 text-blue-600 rotate-180" : "bg-slate-100 text-slate-400"
            )}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {activeSection === section.id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ModuleButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:border-blue-200 hover:text-blue-600 hover:shadow-sm transition-all"
  >
    {icon}
    {label}
  </button>
);
