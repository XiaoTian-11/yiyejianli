import { describe, it, expect } from 'vitest';
import { getBilingualValue, renderBilingualHTML, getBilingualSkills } from '../lib/bilingual';

describe('Bilingual Utilities', () => {
  describe('getBilingualValue', () => {
    const primary = '张三';
    const secondary = 'John Doe';

    it('should return primary value when displayMode is "primary"', () => {
      expect(getBilingualValue(primary, secondary, 'primary')).toBe(primary);
    });

    it('should return secondary value when displayMode is "secondary"', () => {
      expect(getBilingualValue(primary, secondary, 'secondary')).toBe(secondary);
    });

    it('should fallback to primary value in "secondary" mode if secondary is missing or empty', () => {
      expect(getBilingualValue(primary, undefined, 'secondary')).toBe(primary);
      expect(getBilingualValue(primary, ' ', 'secondary')).toBe(primary);
    });

    it('should return joined primary and secondary in "bilingual" mode', () => {
      expect(getBilingualValue(primary, secondary, 'bilingual')).toBe('张三 (John Doe)');
    });

    it('should display only primary in "bilingual" mode if secondary is missing or whitespace', () => {
      expect(getBilingualValue(primary, undefined, 'bilingual')).toBe(primary);
      expect(getBilingualValue(primary, '   ', 'bilingual')).toBe(primary);
    });

    it('should default to "primary" mode if displayMode parameter is omitted', () => {
      expect(getBilingualValue(primary, secondary)).toBe(primary);
    });
  });

  describe('renderBilingualHTML', () => {
    const primaryHtml = '<strong>精通</strong> React';
    const secondaryHtml = '<strong>Expertise in</strong> React';

    it('should return primary HTML in "primary" mode', () => {
      expect(renderBilingualHTML(primaryHtml, secondaryHtml, 'primary')).toBe(primaryHtml);
    });

    it('should return secondary HTML in "secondary" mode', () => {
      expect(renderBilingualHTML(primaryHtml, secondaryHtml, 'secondary')).toBe(secondaryHtml);
    });

    it('should fallback to primary HTML in "secondary" mode if secondary HTML is missing', () => {
      expect(renderBilingualHTML(primaryHtml, undefined, 'secondary')).toBe(primaryHtml);
    });

    it('should render custom bilingual layout HTML structure in "bilingual" mode', () => {
      const rendered = renderBilingualHTML(primaryHtml, secondaryHtml, 'bilingual');
      expect(rendered).toContain('primary-bilingual');
      expect(rendered).toContain('secondary-bilingual');
      expect(rendered).toContain(primaryHtml);
      expect(rendered).toContain(secondaryHtml);
    });

    it('should fallback directly to primary component HTML if secondary HTML is empty in "bilingual" mode', () => {
      expect(renderBilingualHTML(primaryHtml, undefined, 'bilingual')).toBe(primaryHtml);
      expect(renderBilingualHTML(primaryHtml, '', 'bilingual')).toBe(primaryHtml);
    });
  });

  describe('getBilingualSkills', () => {
    const primarySkills = ['React', 'TypeScript', 'Node.js'];
    const secondarySkills = ['React-en', 'TypeScript-en'];

    it('should return primary skills list in "primary" mode', () => {
      expect(getBilingualSkills(primarySkills, secondarySkills, 'primary')).toEqual(primarySkills);
    });

    it('should return secondary skills list in "secondary" mode', () => {
      expect(getBilingualSkills(primarySkills, secondarySkills, 'secondary')).toEqual(secondarySkills);
    });

    it('should fallback to primary list in "secondary" mode if secondary list is empty', () => {
      expect(getBilingualSkills(primarySkills, undefined, 'secondary')).toEqual(primarySkills);
      expect(getBilingualSkills(primarySkills, [], 'secondary')).toEqual(primarySkills);
    });

    it('should pair list items using zip-mapping in "bilingual" mode', () => {
      const expected = ['React (React-en)', 'TypeScript (TypeScript-en)', 'Node.js'];
      expect(getBilingualSkills(primarySkills, secondarySkills, 'bilingual')).toEqual(expected);
    });

    it('should handle mismatched lengths where secondary list is longer', () => {
      const primaryList = ['React'];
      const secondaryList = ['React-en', 'Docker-en'];
      const expected = ['React (React-en)', 'Docker-en'];
      expect(getBilingualSkills(primaryList, secondaryList, 'bilingual')).toEqual(expected);
    });
  });
});
