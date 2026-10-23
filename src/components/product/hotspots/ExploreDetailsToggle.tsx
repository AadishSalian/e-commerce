'use client';

import React from 'react';
import { Eye, EyeOff, Sparkles } from 'lucide-react';

interface ExploreDetailsToggleProps {
  isVisible: boolean;
  count: number;
  onToggle: () => void;
  className?: string;
}

export const ExploreDetailsToggle: React.FC<ExploreDetailsToggleProps> = ({
  isVisible,
  count,
  onToggle,
  className = '',
}) => {
  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isVisible ? 'Hide product detail hotspots' : 'Explore product detail hotspots'}
      aria-pressed={isVisible}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 backdrop-blur-md select-none ${
        isVisible
          ? 'bg-background/80 text-foreground border-border hover:border-text-muted hover:bg-background/90'
          : 'bg-surface/70 text-text-muted border-border/60 hover:text-foreground hover:border-text-muted'
      } ${className}`}
    >
      <Sparkles
        size={12}
        className={isVisible ? 'text-accent' : 'text-text-muted'}
      />
      <span>{isVisible ? 'Hide details' : 'Explore details'}</span>
      <span className="text-[10px] text-text-muted font-mono ml-0.5">({count})</span>
    </button>
  );
};
