'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MOTION_TOKENS } from './motionTokens';

export interface OptimisticCartBadgeProps {
  count: number;
  className?: string;
}

export const OptimisticCartBadge: React.FC<OptimisticCartBadgeProps> = ({
  count,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [displayedCount, setDisplayedCount] = useState(count);
  const debounceRef = useRef<any>(null);

  // Coalesce rapid tap bursts into single scale settle
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDisplayedCount(count);
    }, 60);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [count]);

  if (displayedCount <= 0) return null;

  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={displayedCount}
        initial={{
          opacity: 0,
          scale: prefersReducedMotion ? 1 : 0.8,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          scale: prefersReducedMotion ? 1 : 0.8,
        }}
        transition={{
          duration: MOTION_TOKENS.badgeSettleDurationSec,
          ease: MOTION_TOKENS.easing,
        }}
        aria-hidden="true"
        className={`absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-background tabular-nums select-none ${className}`}
      >
        {displayedCount}
      </motion.span>
    </AnimatePresence>
  );
};
