'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { MOTION_TOKENS } from './motionTokens';

export interface OptimisticAddToCartButtonProps
  extends Omit<React.ComponentPropsWithoutRef<typeof motion.button>, 'children'> {
  children?: React.ReactNode;
  onAddToCart: () => void | Promise<void>;
  isNonOptimisticPending?: boolean; // For excluded actions (payments, orders, stock reservations)
  pendingText?: string;
  successDurationMs?: number;
  className?: string;
  icon?: React.ReactNode;
}

export const OptimisticAddToCartButton: React.FC<OptimisticAddToCartButtonProps> = ({
  children = 'Add to Bag',
  onAddToCart,
  isNonOptimisticPending = false,
  pendingText = 'Confirming…',
  successDurationMs = MOTION_TOKENS.addedStateDurationMs,
  className = '',
  icon,
  disabled = false,
  ...props
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const timeoutRef = useRef<any>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isNonOptimisticPending || isAdded) return;

    // Trigger instant optimistic action
    onAddToCart();

    // Morph label to "Added" checkmark for 1.2s, then return
    setIsAdded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsAdded(false);
    }, successDurationMs);
  };

  // Immediate pending state for excluded actions (Section 1)
  if (isNonOptimisticPending) {
    return (
      <button
        disabled
        aria-busy="true"
        aria-label={pendingText}
        className={`relative inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full font-medium text-sm transition-opacity opacity-75 cursor-not-allowed bg-surface border border-border text-text-muted min-h-[44px] min-w-[44px] ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin text-accent shrink-0" aria-hidden="true" />
        <span>{pendingText}</span>
      </button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: prefersReducedMotion ? 1 : MOTION_TOKENS.buttonPressScale }}
      transition={{ duration: 0.1, ease: MOTION_TOKENS.easing }}
      onClick={handleClick}
      disabled={disabled}
      aria-label={isAdded ? 'Added to bag' : (typeof children === 'string' ? children : 'Add to bag')}
      className={`relative inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full font-medium text-sm transition-colors duration-200 select-none min-h-[44px] min-w-[44px] ${
        isAdded
          ? 'bg-surface border border-accent/60 text-accent font-semibold shadow-sm'
          : 'bg-foreground text-background hover:bg-foreground/90'
      } ${disabled ? 'opacity-40 cursor-not-allowed hover:bg-foreground' : ''} ${className}`}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isAdded ? (
          <motion.span
            key="added"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: MOTION_TOKENS.easing }}
            className="flex items-center gap-2 font-bold"
          >
            <svg
              className="w-4 h-4 text-accent shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {prefersReducedMotion ? (
                <polyline points="20 6 9 17 4 12" />
              ) : (
                <motion.path
                  d="M4 12l5 5L20 6"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.35, ease: MOTION_TOKENS.easing }}
                />
              )}
            </svg>
            <span>Added</span>
          </motion.span>
        ) : (
          <motion.span
            key="normal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: MOTION_TOKENS.easing }}
            className="flex items-center gap-2"
          >
            {icon || <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />}
            <span>{children}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
