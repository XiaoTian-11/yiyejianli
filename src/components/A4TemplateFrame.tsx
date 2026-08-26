import React, { useEffect, useRef, useState } from 'react';
import type { TemplateId, ResumeData } from '../types';
import { TemplateRenderer } from '../templates';

// A4 舞台尺寸（96dpi，794px=210mm / 1123px=297mm）
const STAGE_W = 794;
const STAGE_H = 1123;

interface A4TemplateFrameProps {
  templateId: TemplateId;
  data: ResumeData;
  className?: string;
}

/**
 * 通用 A4 缩放容器：把真实模板固定渲染在 794×1123 白底舞台上，
 * 再按宿主宽高等比缩放（contain）塞进任意大小的框（模板中心卡片 / 预览弹窗）。
 * 舞台 div 带 @container，使模板内 @md:* 以恒为 794px 的舞台为基准命中多栏，
 * 与编辑器预览完全一致，不受宿主宽度/视口影响。
 */
export const A4TemplateFrame: React.FC<A4TemplateFrameProps> = ({ templateId, data, className }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.2);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const apply = () => {
      // 等比 contain：取宽高缩放较小者，居中，留白补齐
      const s = Math.min(el.clientWidth / STAGE_W, el.clientHeight / STAGE_H);
      setScale(s > 0 ? s : 0.2);
    };
    apply();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(apply);
      ro.observe(el);
    }
    return () => { ro?.disconnect(); };
  }, []);

  return (
    <div ref={hostRef} className={`relative w-full h-full overflow-hidden flex items-center justify-center ${className ?? ''}`}>
      {/* 舞台：恒 794×1123，作为 @container 让模板内 @md:* 命中多栏 */}
      <div
        className="@container"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          flexShrink: 0,
          background: '#fff',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <TemplateRenderer templateId={templateId} data={data} />
      </div>
    </div>
  );
};
