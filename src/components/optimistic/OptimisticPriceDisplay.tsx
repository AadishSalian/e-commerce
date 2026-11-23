'use client';

/**
 * OptimisticPriceDisplay
 * Renders confirmed or predicted prices adhering to:
 * - Tabular numerals (tabular-nums)
 * - Digits crossfade with no counting up, so numbers read as exact
 * - Subtle 'adding' shimmer on the price area only during prediction
 * - "Syncing…" marker and after 3-4s "Still syncing…" marker
 * - Reduced motion support (no shimmer, simple opacity crossfade)
 */

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MOTION_TOKENS } from './motionTokens';
import { useLocale } from '@/contexts/LocaleContext';
import { HonestPrice } from '@/lib/i18n/currencyEngine';

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

  // Safely integrate with useLocale when mounted inside LocaleProvider
  let honestPrice: HonestPrice | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const localeCtx = useLocale();
    if (localeCtx) {
      honestPrice = localeCtx.formatPrice(amount);
    }
  } catch {
    // Fallback in isolated unit tests
  }

  const formatted = honestPrice
    ? honestPrice.formatted
    : `${prefix}${Math.max(0, amount).toFixed(2)}`;

  const ariaLabel = honestPrice ? honestPrice.accessibleLabel : `Price: ${formatted}`;

  const textClasses =
    size === 'sm'
      ? 'text-xs'
      : size === 'lg'
      ? 'text-xl font-bold tracking-tight'
      : 'text-sm font-semibold';

  return (
    <div
      className={`relative inline-flex items-center tabular-nums overflow-hidden select-none ${className}`}
      aria-label={ariaLabel}
    >
      <div className="flex items-center">
        {/* Digits crossfade with tabular numerals - no count-up animation (Section 8) */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={formatted}
            initial={{
              opacity: 0,
              y: prefersReducedMotion ? 0 : -4,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: prefersReducedMotion ? 0 : 4,
            }}
            transition={{
              duration: 0.15,
              ease: MOTION_TOKENS.easing,
            }}
            className={`${textClasses} text-foreground font-mono tabular-nums`}
          >
            {formatted}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Subtle price area shimmer for pending prediction (Section 8) */}
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
          className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/20 to-transparent pointer-events-none"
        />
      )}

      {/* Syncing status indicators (Section 7: "mark them subtly as 'Syncing…' / after 3-4s 'Still syncing…'") */}
      {isSyncingSlow ? (
        <span
          className="text-[10px] text-accent font-medium ml-2 animate-pulse flex items-center gap-1"
          role="status"
          aria-live="polite"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping inline-block" />
          Still syncing…
        </span>
      ) : isOptimistic ? (
        <span
          className="text-[10px] text-text-muted ml-2 opacity-80"
          role="status"
          aria-live="polite"
        >
          Syncing…
        </span>
      ) : null}
    </div>
  );
};
