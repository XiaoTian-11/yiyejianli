import React from 'react';
import { TemplateId, ResumeData } from '../types';
import { A4TemplateFrame } from './A4TemplateFrame';
import { INDUSTRY_SAMPLES, TEMPLATE_INDUSTRY_MAP } from '../constants/industrySamples';

interface TemplateMiniatureProps {
  templateId: TemplateId;
  scale?: 'thumbnail' | 'full';
  data?: ResumeData;
}

/**
 * 模板中心缩略图：薄封装 A4TemplateFrame，渲染 src/templates 真实模板组件，
 * 与编辑器预览完全一致。无 data 时用行业示例数据兜底。
 * scale 保留作向后兼容（内部忽略，宿主 aspect-* 负责尺寸）。
 */
export const TemplateMiniature: React.FC<TemplateMiniatureProps> = ({ templateId, scale = 'thumbnail', data }) => {
  const industryKey = TEMPLATE_INDUSTRY_MAP[templateId] || 'product';
  const sample = INDUSTRY_SAMPLES[industryKey];
  const resolved = data || sample?.data;
  return <A4TemplateFrame templateId={templateId} data={resolved} />;
};
