import React, { useMemo } from 'react';
import '@/styles/skeleton.css';

type SkeletonSize = 'sm' | 'md' | 'lg';

export interface SkeletonBarProps {
  heightClass?: string; // e.g., 'h-9'
  className?: string;
  seed?: string; // deterministic width selection seed
}

const pickWidthClass = (seed?: string): SkeletonSize => {
  if (!seed) return 'md';
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const mod = hash % 3;
  return mod === 0 ? 'sm' : mod === 1 ? 'md' : 'lg';
};

export const SkeletonBar: React.FC<SkeletonBarProps> = ({ heightClass = 'h-9', className = '', seed }) => {
  const size = useMemo(() => pickWidthClass(seed), [seed]);
  const widthClass = size === 'sm' ? 'skeleton-w-sm' : size === 'md' ? 'skeleton-w-md' : 'skeleton-w-lg';
  return (
    <div className={`skeleton-bar ${widthClass} ${heightClass} ${className}`} />
  );
};

export default SkeletonBar;



