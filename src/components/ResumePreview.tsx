import React, { useState, useEffect, useRef } from 'react';
import { ResumeData, TemplateId } from '../types';
import { ModernTemplate } from '../templates/ModernTemplate';
import { ClassicTemplate } from '../templates/ClassicTemplate';
import { ExecutiveTemplate } from '../templates/ExecutiveTemplate';
import { TechFocusedTemplate } from '../templates/TechFocusedTemplate';
import { FinanceEliteTemplate } from '../templates/FinanceEliteTemplate';
import { MedicalAcademicTemplate } from '../templates/MedicalAcademicTemplate';
import { CreativeDesignerTemplate } from '../templates/CreativeDesignerTemplate';
import { EngineeringTechTemplate } from '../templates/EngineeringTechTemplate';
import { MinimalTemplate } from '../templates/MinimalTemplate';
import { StudentTemplate } from '../templates/StudentTemplate';
import { ElegantTemplate } from '../templates/ElegantTemplate';
import { TwoColumnTemplate } from '../templates/TwoColumnTemplate';
import { MarketingSalesTemplate } from '../templates/MarketingSalesTemplate';
import { LegalConsultingTemplate } from '../templates/LegalConsultingTemplate';
import { motion } from 'motion/react';

interface ResumePreviewProps {
  data: ResumeData;
  templateId: TemplateId;
}

export const ResumePreview = React.forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ data, templateId }, ref) => {
    const [pageCount, setPageCount] = useState<number>(1);
    const [scale, setScale] = useState<number>(1);
    const measurerRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const PAGE_WIDTH = 794;   // Standard A4 width at 96 DPI
    const PAGE_HEIGHT = 1123;  // Standard A4 height at 96 DPI

    const renderTemplate = () => {
      switch (templateId) {
        case 'modern':
          return <ModernTemplate data={data} />;
        case 'classic':
          return <ClassicTemplate data={data} />;
        case 'minimal':
          return <MinimalTemplate data={data} />;
        case 'executive':
          return <ExecutiveTemplate data={data} />;
        case 'tech_focused':
          return <TechFocusedTemplate data={data} />;
        case 'student':
          return <StudentTemplate data={data} />;
        case 'elegant':
          return <ElegantTemplate data={data} />;
        case 'two_column':
          return <TwoColumnTemplate data={data} />;
        case 'marketing_sales':
          return <MarketingSalesTemplate data={data} />;
        case 'legal_consulting':
          return <LegalConsultingTemplate data={data} />;
        case 'finance_elite':
          return <FinanceEliteTemplate data={data} />;
        case 'medical_academic':
          return <MedicalAcademicTemplate data={data} />;
        case 'creative_designer':
          return <CreativeDesignerTemplate data={data} />;
        case 'engineering_tech':
          return <EngineeringTechTemplate data={data} />;
        default:
          return <ModernTemplate data={data} />;
      }
    };

    useEffect(() => {
      const measure = () => {
        if (measurerRef.current) {
          const totalHeight = measurerRef.current.scrollHeight;
          const computedPages = Math.max(1, Math.ceil(totalHeight / PAGE_HEIGHT));
          setPageCount(computedPages);
        }
        if (containerRef.current) {
          const containerWidth = containerRef.current.clientWidth;
          const padding = 32; // Total horizontal padding (px-4 = 16px each side)
          const availableWidth = containerWidth - padding;
          if (availableWidth > 0) {
            const calculatedScale = Math.min(1, availableWidth / PAGE_WIDTH);
            setScale(calculatedScale);
          }
        }
      };

      // Measure immediately
      measure();

      // Buffer slightly to ensure layout rendering stability
      const timer = setTimeout(measure, 100);

      // Setup live ResizeObserver to recalculate on layout changes (typing, additions)
      let resizeObserver: ResizeObserver | null = null;
      if (measurerRef.current && window.ResizeObserver) {
        resizeObserver = new ResizeObserver(() => {
          measure();
        });
        resizeObserver.observe(measurerRef.current);
      }

      // Observe container resize to auto-adjust scaling on layout changes
      let containerObserver: ResizeObserver | null = null;
      if (containerRef.current && window.ResizeObserver) {
        containerObserver = new ResizeObserver(() => {
          measure();
        });
        containerObserver.observe(containerRef.current);
      }

      return () => {
        clearTimeout(timer);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (containerObserver) {
          containerObserver.disconnect();
        }
      };
    }, [data, templateId]);

    return (
      <div 
        ref={containerRef}
        className="w-full h-full overflow-y-auto bg-slate-100/60 py-8 px-4 flex flex-col items-center justify-start scrollbar-hide select-none"
      >
        {/* Hidden measurement container to estimate continuous printing heights */}
        <div 
          ref={measurerRef}
          style={{ 
            position: 'absolute', 
            top: -9999, 
            left: -9999, 
            width: `${PAGE_WIDTH}px`, 
            visibility: 'hidden',
            pointerEvents: 'none'
          }}
        >
          {renderTemplate()}
        </div>

        {/* Paginated live sheet preview container linked to print actions */}
        <div 
          ref={ref} 
          className="resume-print-container flex flex-col items-center origin-top print:!transform-none print:!w-auto print:!h-auto"
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            width: `${PAGE_WIDTH}px`,
            height: `${(PAGE_HEIGHT * pageCount + (pageCount - 1) * 32) * scale}px`
          }}
        >
          {Array.from({ length: pageCount }).map((_, pageIndex) => (
            <motion.div 
              key={pageIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: pageIndex * 0.05 }}
              className="resume-print-page relative bg-white shadow-[0_16px_36px_rgba(0,0,0,0.06)] border border-slate-200/50 rounded-xl overflow-hidden mb-8 last:mb-0 select-none print:shadow-none print:border-none print:m-0 shrink-0"
              style={{ 
                width: `${PAGE_WIDTH}px`, 
                height: `${PAGE_HEIGHT}px` 
              }}
            >
              {/* Viewport content shifting to match pagination stripes */}
              <div 
                style={{ 
                  transform: `translateY(${-pageIndex * PAGE_HEIGHT}px)`,
                  transformOrigin: 'top left',
                  width: `${PAGE_WIDTH}px`,
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
              >
                {renderTemplate()}
              </div>

              {/* Standard Page Number Badge */}
              <div className="absolute bottom-4 right-6 bg-slate-900/10 text-slate-700 font-mono text-xs px-2.5 py-0.5 rounded-full backdrop-blur-[2px] print:hidden">
                {pageIndex + 1} / {pageCount}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }
);

ResumePreview.displayName = 'ResumePreview';
