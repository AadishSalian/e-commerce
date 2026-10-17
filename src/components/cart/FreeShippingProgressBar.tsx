'use client';

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Truck, Plus } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { 
  FREE_SHIPPING_THRESHOLD, 
  DEFAULT_LOCALE, 
  DEFAULT_CURRENCY, 
  formatCurrency, 
  toMinorUnits, 
  fromMinorUnits,
  isShippingEligible 
} from '@/config/shipping';
import { MOCK_PRODUCTS, Product } from '@/lib/mockData';

export interface FreeShippingProgressBarProps {
  /** Optional custom subtotal override. If omitted, derives from active cart */
  subtotal?: number;
  /** Optional custom threshold override. If omitted, derives from config */
  threshold?: number;
  /** Currency code (e.g. 'INR', 'USD') */
  currency?: string;
  /** Locale code (e.g. 'en-IN', 'en-US') */
  locale?: string;
  /** Optional delivery destination postal code for eligibility check */
  destinationPincode?: string;
  /** Whether to show compact add-on suggestions when close to free shipping */
  showSuggestions?: boolean;
  /** Visual variant: 'drawer' (top of cart drawer), 'full' (cart page), or 'compact' (slim) */
  variant?: 'drawer' | 'full' | 'compact';
  /** Additional custom classes */
  className?: string;
}

export function FreeShippingProgressBar({
  subtotal: propSubtotal,
  threshold = FREE_SHIPPING_THRESHOLD,
  currency = DEFAULT_CURRENCY,
  locale = DEFAULT_LOCALE,
  destinationPincode,
  showSuggestions = true,
  variant = 'drawer',
  className = '',
}: FreeShippingProgressBarProps) {
  const { cartItems, addToCart } = useCart();
  const prefersReducedMotion = useReducedMotion();

  // Calculate merchandise subtotal (after discounts, excluding shipping, tax, gift cards)
  const calculatedSubtotal = useMemo(() => {
    if (propSubtotal !== undefined) return propSubtotal;
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [propSubtotal, cartItems]);

  // Minor unit conversions to prevent floating-point discrepancies
  const subtotalMinor = toMinorUnits(calculatedSubtotal);
  const thresholdMinor = toMinorUnits(threshold);

  const isEligible = isShippingEligible(destinationPincode);
  const isThresholdConfigured = thresholdMinor > 0;
  const isEmpty = subtotalMinor <= 0;
  const isUnlocked = isEligible && isThresholdConfigured && subtotalMinor >= thresholdMinor;

  // Percentage progress capped at 100%
  const progress = useMemo(() => {
    if (!isThresholdConfigured || isEmpty || !isEligible) return 0;
    if (subtotalMinor >= thresholdMinor) return 100;
    return Math.min(100, Math.max(0, (subtotalMinor / thresholdMinor) * 100));
  }, [subtotalMinor, thresholdMinor, isThresholdConfigured, isEmpty, isEligible]);

  const isAlmostThere = progress >= 80 && !isUnlocked;

  // Remaining calculation
  const remainingMinor = Math.max(0, thresholdMinor - subtotalMinor);
  const remainingAmount = fromMinorUnits(remainingMinor);
  const formattedRemaining = formatCurrency(remainingAmount, locale, currency);
  const formattedThreshold = formatCurrency(threshold, locale, currency);

  // Track celebration state so it only triggers on the first transition across threshold
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);
  const prevIsUnlockedRef = useRef(false);

  useEffect(() => {
    // Check if we just crossed from locked to unlocked
    if (isUnlocked && !prevIsUnlockedRef.current && !hasCelebrated) {
      setHasCelebrated(true);
      if (!prefersReducedMotion) {
        setShowShimmer(true);
        const timer = setTimeout(() => setShowShimmer(false), 850);
        return () => clearTimeout(timer);
      }
    } else if (!isUnlocked && prevIsUnlockedRef.current) {
      // User removed an item and dropped back below threshold
      setHasCelebrated(false);
      setShowShimmer(false);
    }
    prevIsUnlockedRef.current = isUnlocked;
  }, [isUnlocked, hasCelebrated, prefersReducedMotion]);

  // Screen reader accessible announcement message
  const announcementText = useMemo(() => {
    if (!isEligible) return 'Free shipping is not available for this delivery area.';
    if (isEmpty) return `Free shipping on orders over ${formattedThreshold}.`;
    if (isUnlocked) return 'You have unlocked free shipping.';
    if (isAlmostThere) return `Almost there, just ${formattedRemaining} more for free shipping.`;
    return `You are ${formattedRemaining} away from free shipping.`;
  }, [isEligible, isEmpty, isUnlocked, isAlmostThere, formattedThreshold, formattedRemaining]);

  // Smart suggestions: show 2-3 products when gap is under 30% of threshold
  const qualifyingSuggestions = useMemo(() => {
    if (!showSuggestions || isEmpty || isUnlocked || !isEligible) return [];
    // Only suggest when within 30% gap
    if (progress < 70) return [];

    const cartIds = new Set(cartItems.map((item) => item.id));
    return MOCK_PRODUCTS
      .filter((p) => !cartIds.has(p.id))
      // Prioritize items near the remaining gap
      .sort((a, b) => Math.abs(a.price - remainingAmount) - Math.abs(b.price - remainingAmount))
      .slice(0, 2);
  }, [showSuggestions, isEmpty, isUnlocked, isEligible, progress, cartItems, remainingAmount]);

  // Hide if threshold is 0 or negative
  if (!isThresholdConfigured) {
    return null;
  }

  // Not eligible for this address / pincode
  if (!isEligible) {
    return (
      <div className={`px-6 py-3 border-b border-border bg-surface/40 text-xs text-text-muted ${className}`}>
        <span>Standard delivery rates apply to remote shipping regions.</span>
      </div>
    );
  }

  // Visual tokens
  // Matte fill color: site accent #8ed500, subtly brightened to #9be600 when almost there
  const fillColor = isAlmostThere ? 'bg-[#9be600]' : 'bg-accent';

  return (
    <div
      className={`border-b border-border bg-surface/30 select-none ${
        variant === 'compact' ? 'px-4 py-2.5' : 'px-6 py-4'
      } ${className}`}
    >
      {/* Screen reader live region */}
      <span className="sr-only" role="status" aria-live="polite">
        {announcementText}
      </span>

      {/* Status Header & Copy */}
      <div className="flex items-center justify-between text-xs md:text-sm mb-2.5">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {isUnlocked ? (
            <div className="flex items-center gap-1.5 text-foreground font-medium">
              {/* Checkmark SVG with stroke animation on first unlock */}
              <motion.svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-accent shrink-0"
              >
                <motion.path
                  d="M20 6L9 17L4 12"
                  initial={{ pathLength: prefersReducedMotion ? 1 : 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.4,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              </motion.svg>
              <span>You’ve unlocked free shipping.</span>
            </div>
          ) : isEmpty ? (
            <span className="text-text-muted">
              Free shipping on orders over <strong className="text-foreground font-medium">{formattedThreshold}</strong>
            </span>
          ) : isAlmostThere ? (
            <span className="text-text-muted flex items-center gap-1">
              <span>Almost there — just</span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={formattedRemaining}
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="font-semibold text-[#9be600] inline-block"
                >
                  {formattedRemaining}
                </motion.span>
              </AnimatePresence>
              <span>more.</span>
            </span>
          ) : (
            <span className="text-text-muted flex items-center gap-1">
              <span>You’re</span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={formattedRemaining}
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="font-semibold text-accent inline-block"
                >
                  {formattedRemaining}
                </motion.span>
              </AnimatePresence>
              <span>away from free shipping.</span>
            </span>
          )}
        </div>

        {/* Milestone indicator */}
        <div className="flex items-center gap-1.5 shrink-0 pl-2">
          <Truck
            className={`w-3.5 h-3.5 transition-colors duration-300 ${
              isUnlocked ? 'text-accent' : 'text-text-muted/60'
            }`}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Progress Track & Fill */}
      <div
        role="progressbar"
        aria-valuenow={fromMinorUnits(subtotalMinor)}
        aria-valuemin={0}
        aria-valuemax={threshold}
        aria-label="Progress toward free shipping"
        className="w-full h-1.5 bg-[#2a2a2a] dark:bg-[#2a2a2a] bg-zinc-200 rounded-full overflow-hidden relative"
      >
        <motion.div
          className={`h-full rounded-full relative overflow-hidden ${fillColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.5,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {/* First unlock celebration shimmer sweep */}
          {showShimmer && !prefersReducedMotion && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 0.85, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
            />
          )}
        </motion.div>
      </div>

      {/* Smart "Add to unlock free shipping" Suggestions */}
      {qualifyingSuggestions.length > 0 && variant !== 'compact' && (
        <div className="mt-3.5 pt-3 border-t border-border/40">
          <p className="text-[11px] uppercase tracking-wider text-text-muted font-medium mb-2">
            Add to unlock free shipping
          </p>
          <div className="flex flex-col gap-2">
            {qualifyingSuggestions.map((product: Product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-2 rounded-lg bg-surface/60 border border-border/50 hover:border-border transition-colors group"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-9 h-9 rounded bg-surface-hover shrink-0 overflow-hidden relative border border-border/40">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium text-foreground truncate">
                      {product.name}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {formatCurrency(product.price, locale, currency)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => addToCart(product, 1)}
                  className="px-2.5 py-1 text-xs font-medium bg-foreground text-background rounded-full hover:bg-accent hover:text-black transition-colors flex items-center gap-1 shrink-0 ml-2"
                  aria-label={`Add ${product.name} to bag`}
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FreeShippingProgressBar;
