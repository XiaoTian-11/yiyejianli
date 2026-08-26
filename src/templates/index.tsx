import type { TemplateId, TemplateProps } from '../types';
import { ModernTemplate } from './ModernTemplate';
import { ClassicTemplate } from './ClassicTemplate';
import { ExecutiveTemplate } from './ExecutiveTemplate';
import { MinimalTemplate } from './MinimalTemplate';
import { TechFocusedTemplate } from './TechFocusedTemplate';
import { StudentTemplate } from './StudentTemplate';
import { ElegantTemplate } from './ElegantTemplate';
import { TwoColumnTemplate } from './TwoColumnTemplate';
import { MarketingSalesTemplate } from './MarketingSalesTemplate';
import { LegalConsultingTemplate } from './LegalConsultingTemplate';
import { FinanceEliteTemplate } from './FinanceEliteTemplate';
import { MedicalAcademicTemplate } from './MedicalAcademicTemplate';
import { CreativeDesignerTemplate } from './CreativeDesignerTemplate';
import { EngineeringTechTemplate } from './EngineeringTechTemplate';

/** 模板 id → 真实模板组件的单一注册表（编辑器预览 / 模板中心缩略图共用，避免 switch 重复） */
export const TEMPLATE_COMPONENTS: Record<string, React.FC<TemplateProps>> = {
  modern: ModernTemplate,
  classic: ClassicTemplate,
  executive: ExecutiveTemplate,
  minimal: MinimalTemplate,
  tech_focused: TechFocusedTemplate,
  student: StudentTemplate,
  elegant: ElegantTemplate,
  two_column: TwoColumnTemplate,
  marketing_sales: MarketingSalesTemplate,
  legal_consulting: LegalConsultingTemplate,
  finance_elite: FinanceEliteTemplate,
  medical_academic: MedicalAcademicTemplate,
  creative_designer: CreativeDesignerTemplate,
  engineering_tech: EngineeringTechTemplate,
};

/** 渲染指定模板（未知 id 回退 Modern），供 ResumePreview / A4TemplateFrame 共用 */
export const TemplateRenderer: React.FC<{ templateId: TemplateId } & TemplateProps> = ({ templateId, data }) => {
  const Comp = TEMPLATE_COMPONENTS[templateId] ?? ModernTemplate;
  return <Comp data={data} />;
};
