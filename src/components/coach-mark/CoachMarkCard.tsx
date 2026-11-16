'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Check } from 'lucide-react';
import { CardPlacement, TourStepConfig } from '@/lib/coach-mark/types';

interface CoachMarkCardProps {
  step: TourStepConfig;
  stepIndex: number;
  totalSteps: number;
  placement: CardPlacement;
  onNext: () => void;
  onSkip: () => void;
  onClose: () => void;
  prefersReducedMotion?: boolean;
}

export const CoachMarkCard: React.FC<CoachMarkCardProps> = ({
  step,
  stepIndex,
  totalSteps,
  placement,
  onNext,
  onSkip,
  onClose,
  prefersReducedMotion = false,
}) => {
  const isLastStep = stepIndex === totalSteps - 1;

  // Arrow styling based on placement side
  const renderArrow = () => {
    if (placement.isBottomDocked) return null;

    const { placement: side, arrowOffset } = placement;

    if (side === 'bottom') {
      return (
        <div
          className="absolute -top-1.5 w-3 h-3 bg-surface border-t border-l border-border transform rotate-45 pointer-events-none"
          style={{ left: `${arrowOffset - 6}px` }}
        />
      );
    }

    if (side === 'top') {
      return (
        <div
          className="absolute -bottom-1.5 w-3 h-3 bg-surface border-b border-r border-border transform rotate-45 pointer-events-none"
          style={{ left: `${arrowOffset - 6}px` }}
        />
      );
    }

    if (side === 'right') {
      return (
        <div
          className="absolute -left-1.5 w-3 h-3 bg-surface border-b border-l border-border transform rotate-45 pointer-events-none"
          style={{ top: `${arrowOffset - 6}px` }}
        />
      );
    }

    if (side === 'left') {
      return (
        <div
          className="absolute -right-1.5 w-3 h-3 bg-surface border-t border-r border-border transform rotate-45 pointer-events-none"
          style={{ top: `${arrowOffset - 6}px` }}
        />
      );
    }

    return null;
  };

  return (
    <motion.aside
      role="region"
      aria-labelledby="coach-mark-title"
      aria-describedby="coach-mark-body"
      tabIndex={-1}
      className={`fixed z-[62] bg-surface text-foreground border border-border rounded-xl shadow-none p-4 md:p-5 flex flex-col justify-between select-none ${
        placement.isBottomDocked ? 'w-[calc(100vw-32px)] max-w-sm' : 'w-[310px] md:w-[330px]'
      }`}
      style={{
        top: placement.top,
        left: placement.left,
      }}
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{
        duration: prefersReducedMotion ? 0.05 : 0.25,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {renderArrow()}

      {/* Header: Step Counter, Progress Dots, Close Button */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-text-muted">
            {stepIndex + 1} of {totalSteps}
          </span>
          <div className="flex items-center gap-1" aria-hidden="true">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={`transition-all duration-300 rounded-full h-1.5 ${
                  i === stepIndex ? 'w-4 bg-accent' : 'w-1.5 bg-border'
                }`}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 -mr-1 -mt-1 rounded-md text-text-muted hover:text-foreground hover:bg-surface-active transition-colors flex items-center justify-center focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          aria-label="Close tour"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Crossfading Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -4 }}
          transition={{ duration: prefersReducedMotion ? 0.05 : 0.2, ease: 'easeOut' }}
          className="flex flex-col gap-1.5 my-1"
        >
          <h3 id="coach-mark-title" className="text-sm md:text-base font-semibold text-foreground tracking-tight">
            {step.title}
          </h3>
          <p id="coach-mark-body" className="text-xs md:text-sm text-text-muted leading-relaxed font-normal">
            {step.body}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Actions: Skip Tour & Next / Done */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-2 border-t border-border/40">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-text-muted hover:text-foreground transition-colors py-2 px-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
        >
          Skip tour
        </button>

        <button
          type="button"
          onClick={onNext}
          className="min-h-[40px] px-4 py-2 bg-accent text-[#121212] font-semibold text-xs md:text-sm rounded-lg hover:bg-accent-hover active:scale-[0.98] transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
        >
          <span>{isLastStep ? 'Done' : 'Next'}</span>
          {isLastStep ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>
    </motion.aside>
  );
};
