'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X, ChevronRight, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { CalloutPosition, Hotspot } from '@/lib/hotspots/types';

interface HotspotCalloutProps {
  hotspot: Hotspot;
  position: CalloutPosition;
  index: number;
  total: number;
  onClose: () => void;
  onNext?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const HotspotCallout: React.FC<HotspotCalloutProps> = ({
  hotspot,
  position,
  index,
  total,
  onClose,
  onNext,
  onMouseEnter,
  onMouseLeave,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const isInteractive = Boolean(hotspot.link || hotspot.detailImage || total > 1);

  // If mobile bottom sheet
  if (position.isMobileSheet) {
    return (
      <motion.div
        id={`hotspot-callout-${hotspot.id}`}
        role={isInteractive ? 'dialog' : 'tooltip'}
        aria-modal={isInteractive ? 'false' : undefined}
        aria-label={hotspot.title}
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="absolute bottom-3 inset-x-3 z-30 bg-surface/95 backdrop-blur-md border border-border rounded-xl p-4 shadow-xl pointer-events-auto"
      >
        {/* Drag handle pill */}
        <div className="w-8 h-1 bg-border rounded-full mx-auto mb-3" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-mono tracking-wider text-accent font-semibold block mb-0.5">
              Detail {hotspot.order || index + 1} of {total}
            </span>
            <h4 className="text-sm font-semibold text-foreground tracking-tight line-clamp-1">
              {hotspot.title}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail callout"
            className="p-1 rounded-full text-text-muted hover:text-foreground hover:bg-white/5 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-3 mt-2.5 items-start">
          {hotspot.detailImage && (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border shrink-0 bg-background">
              <Image
                src={hotspot.detailImage}
                alt={`${hotspot.title} close-up detail`}
                width={96}
                height={96}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
            <p className="text-xs text-text-muted leading-relaxed break-words line-clamp-3">
              {hotspot.description}
            </p>
            {hotspot.link && (
              <a
                href={hotspot.link}
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline mt-2"
              >
                Learn more
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>

        {total > 1 && onNext && (
          <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs">
            <span className="text-text-muted font-mono text-[11px]">
              {index + 1} / {total}
            </span>
            <button
              type="button"
              onClick={onNext}
              className="text-foreground hover:text-accent font-medium inline-flex items-center gap-1 transition-colors text-xs"
            >
              Next detail
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </motion.div>
    );
  }

  // Desktop Anchored Card
  const isTop = position.side === 'top';
  const translateYInitial = isTop ? 6 : -6;
  const translateYExit = isTop ? 4 : -4;

  return (
    <motion.div
      id={`hotspot-callout-${hotspot.id}`}
      role={isInteractive ? 'dialog' : 'tooltip'}
      aria-modal={isInteractive ? 'false' : undefined}
      aria-label={hotspot.title}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: translateYInitial }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: translateYExit }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        top: position.top !== undefined ? `${position.top}px` : undefined,
        bottom: position.bottom !== undefined ? `${position.bottom}px` : undefined,
        left: position.left !== undefined ? `${position.left}px` : undefined,
        right: position.right !== undefined ? `${position.right}px` : undefined,
      }}
      className="absolute z-30 w-72 md:w-80 bg-surface/95 backdrop-blur-md border border-border rounded-xl p-3.5 shadow-2xl pointer-events-auto"
    >
      {/* Anchored Pointer Arrow pointing directly to marker */}
      <div
        style={{
          left: `${position.arrowOffsetPx}px`,
          ...(isTop
            ? { bottom: '-5px', borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }
            : { top: '-5px', borderTop: '1px solid var(--border-subtle)', borderLeft: '1px solid var(--border-subtle)' }),
        }}
        className="absolute -translate-x-1/2 w-2.5 h-2.5 bg-surface rotate-45 pointer-events-none"
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-accent font-semibold block leading-none mb-1">
            Detail {hotspot.order || index + 1} of {total}
          </span>
          <h4 className="text-sm font-semibold text-foreground tracking-tight leading-snug">
            {hotspot.title}
          </h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close detail callout"
          className="p-1 rounded-md text-text-muted hover:text-foreground hover:bg-white/5 transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex gap-3 items-start">
        {hotspot.detailImage && (
          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border shrink-0 bg-background">
            <Image
              src={hotspot.detailImage}
              alt={`${hotspot.title} close-up detail`}
              width={96}
              height={96}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
          <p className="text-xs text-text-muted leading-relaxed break-words">
            {hotspot.description}
          </p>
          {hotspot.link && (
            <a
              href={hotspot.link}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline mt-2 self-start"
            >
              Learn more
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>

      {/* Guided Tour Sequence Footer */}
      {total > 1 && onNext && (
        <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-xs">
          <span className="text-text-muted font-mono text-[11px]">
            {index + 1} of {total}
          </span>
          <button
            type="button"
            onClick={onNext}
            className="text-foreground hover:text-accent font-medium inline-flex items-center gap-1 transition-colors text-xs"
          >
            Next detail
            <ChevronRight size={13} />
          </button>
        </div>
      )}
    </motion.div>
  );
};
