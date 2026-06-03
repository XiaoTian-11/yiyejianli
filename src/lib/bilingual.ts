import { ResumeData } from '../types';

/**
 * Helper to compute the correct bilingual value based on displayMode
 */
export const getBilingualValue = (
  primaryVal: string, 
  secondaryVal?: string, 
  displayMode: 'primary' | 'secondary' | 'bilingual' = 'primary'
): string => {
  if (displayMode === 'primary') {
    return primaryVal || '';
  }
  if (displayMode === 'secondary') {
    return (secondaryVal && secondaryVal.trim()) ? secondaryVal : (primaryVal || '');
  }
  // 'bilingual'
  if (secondaryVal && secondaryVal.trim()) {
    return `${primaryVal} (${secondaryVal})`;
  }
  return primaryVal || '';
};

/**
 * Helper to compute and format rich HTML text bilingual rendering
 */
export const renderBilingualHTML = (
  primaryHtml: string,
  secondaryHtml?: string,
  displayMode: 'primary' | 'secondary' | 'bilingual' = 'primary'
): string => {
  if (displayMode === 'primary') {
    return primaryHtml || '';
  }
  if (displayMode === 'secondary') {
    return secondaryHtml || primaryHtml || '';
  }
  // 'bilingual'
  if (secondaryHtml && secondaryHtml.trim()) {
    return `<div class="space-y-1"><div class="primary-bilingual">${primaryHtml}</div><div class="secondary-bilingual text-[11px] opacity-80 italic mt-0.5">${secondaryHtml}</div></div>`;
  }
  return primaryHtml || '';
};

/**
 * Helper to compute the bilingual skills set matching indices
 */
export const getBilingualSkills = (
  skills: string[],
  skillsSec?: string[],
  displayMode: 'primary' | 'secondary' | 'bilingual' = 'primary'
): string[] => {
  if (displayMode === 'primary') return skills;
  if (displayMode === 'secondary') return skillsSec && skillsSec.length > 0 ? skillsSec : skills;
  
  const result: string[] = [];
  const len = Math.max(skills.length, skillsSec?.length || 0);
  for (let i = 0; i < len; i++) {
    const p = skills[i];
    const s = skillsSec?.[i];
    if (p && s) {
      result.push(`${p} (${s})`);
    } else if (p) {
      result.push(p);
    } else if (s) {
      result.push(s);
    }
  }
  return result;
};
