'use client';

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MOTION_TOKENS } from './motionTokens';

export interface OptimisticPriceDisplayProps {
  amount: number;
  isOptimistic?: boolean;
  isSyncingSlow?: boolean;
  prefix?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const OptimisticPriceDisplay: React.FC<OptimisticPriceDisplayProps> = ({
  amount,
  isOptimistic = false,
  isSyncingSlow = false,
  prefix = '$',
  className = '',
  size = 'md',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const formatted = amount.toFixed(2);

  const textClasses =
    size === 'sm'
      ? 'text-xs'
      : size === 'lg'
      ? 'text-lg font-bold'
      : 'text-sm font-medium';

  return (
    <div className={`relative inline-flex items-center tabular-nums overflow-hidden ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={formatted}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: MOTION_TOKENS.easing }}
          className={`${textClasses} text-foreground flex items-center gap-1`}
        >
          <span>{prefix}</span>
          <span>{formatted}</span>
        </motion.span>
      </AnimatePresence>

      {/* Subtle price area shimmer for pending prediction (Section 8: "subtle 'adding' shimmer on the price area only") */}
      {isOptimistic && !prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: 'linear',
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/15 to-transparent pointer-events-none"
        />
      )}

      {/* Slow syncing hint text */}
      {isSyncingSlow && (
        <span className="text-[10px] text-text-muted ml-1.5 animate-pulse" aria-live="polite">
          Syncing…
        </span>
      )}
    </div>
  );
};
