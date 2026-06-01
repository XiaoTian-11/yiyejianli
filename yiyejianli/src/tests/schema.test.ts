import { describe, it, expect } from 'vitest';
import { INITIAL_DATA, TEMPLATES, PLANS } from '../constants';

describe('Data Schema and Configuration Sanity Checks', () => {
  it('should verify that INITIAL_DATA has a fully populated personalInfo object', () => {
    expect(INITIAL_DATA).toBeDefined();
    expect(INITIAL_DATA.personalInfo).toBeDefined();
    expect(INITIAL_DATA.personalInfo.fullName).toBe('张悦悦');
    expect(INITIAL_DATA.personalInfo.jobTitle).toBe('高级产品经理');
    expect(INITIAL_DATA.personalInfo.email).toContain('@');
    expect(INITIAL_DATA.personalInfo.phone).toBeDefined();
  });

  it('should verify that INITIAL_DATA has experience and education lists', () => {
    expect(Array.isArray(INITIAL_DATA.experience)).toBe(true);
    expect(INITIAL_DATA.experience.length).toBeGreaterThan(0);
    expect(INITIAL_DATA.experience[0].company).toBe('悦科技股份有限公司');

    expect(Array.isArray(INITIAL_DATA.education)).toBe(true);
    expect(INITIAL_DATA.education.length).toBeGreaterThan(0);
    expect(INITIAL_DATA.education[0].school).toBe('复旦大学');
  });

  it('should verify that INITIAL_DATA.sections contains all required active resume parts', () => {
    expect(Array.isArray(INITIAL_DATA.sections)).toBe(true);
    const sectionTypes = INITIAL_DATA.sections.map(s => s.type);
    expect(sectionTypes).toContain('personal');
    expect(sectionTypes).toContain('summary');
    expect(sectionTypes).toContain('experience');
    expect(sectionTypes).toContain('education');
    expect(sectionTypes).toContain('projects');
    expect(sectionTypes).toContain('skills');
  });

  it('should verify that TEMPLATES configuration has valid standard and premium layout listings', () => {
    expect(Array.isArray(TEMPLATES)).toBe(true);
    expect(TEMPLATES.length).toBeGreaterThan(0);

    // Make sure standard template matches and is free
    const modernTemplate = TEMPLATES.find(t => t.id === 'modern');
    expect(modernTemplate).toBeDefined();
    expect(modernTemplate?.isPremium).toBe(false);

    // Make sure premium templates exist like tech_focused and executive
    const executiveTemplate = TEMPLATES.find(t => t.id === 'executive');
    expect(executiveTemplate).toBeDefined();
    expect(executiveTemplate?.isPremium).toBe(true);
  });

  it('should verify that PLANS pricing cards setup parameters are correct and highlighters exist', () => {
    expect(Array.isArray(PLANS)).toBe(true);
    expect(PLANS.length).toBeGreaterThan(0);

    const monthPlan = PLANS.find(p => p.type === 'month');
    expect(monthPlan).toBeDefined();
    expect(monthPlan?.highlight).toBe(true);
    expect(monthPlan?.price).toBe(15);
  });
});
