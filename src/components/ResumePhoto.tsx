import React from 'react';
import { cn } from '../lib/utils';

interface ResumePhotoProps {
  photo?: string;
  fullName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-16 h-16',
  md: 'w-20 h-20',
  lg: 'w-24 h-24',
};

/**
 * 简历头像组件 —— 在模板中展示用户上传的照片
 * 无照片时不渲染任何内容
 */
export const ResumePhoto: React.FC<ResumePhotoProps> = ({
  photo,
  fullName,
  className,
  size = 'md',
}) => {
  if (!photo) return null;

  return (
    <div className={cn('flex-shrink-0', className)}>
      <img
        src={photo}
        alt={fullName || '头像'}
        className={cn(
          sizeMap[size],
          'rounded-full object-cover border-2 border-white/30 shadow-md'
        )}
      />
    </div>
  );
};
