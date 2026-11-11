'use client';

import React from 'react';
import { motion, AnimatePresence, useReducedMotion, type Transition } from 'framer-motion';
import { ExtendedCardBrandId } from '@/lib/payment/types';

interface CardSecurityCodeIllustrationProps {
  brand: ExtendedCardBrandId;
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Flat, line-style card illustration showing where the security code is located.
 * Adapts to detected brand:
 * - American Express: Front of card (4 digits on front-right)
 * - Visa, Mastercard, RuPay, etc.: Back of card (3 digits on signature strip)
 * - Unknown: Neutral overview with 3 or 4 digit guidance
 */
export function CardSecurityCodeIllustration({
  brand,
  className = '',
  width = 96,
  height = 60,
}: CardSecurityCodeIllustrationProps) {
  const shouldReduceMotion = useReducedMotion();
  const isFront = brand === 'amex';
  const isUnknown = brand === 'unknown';

  const transition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.15, ease: 'easeInOut' };

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden select-none ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    >
      <AnimatePresence mode="wait">
        {isFront ? (
          /* American Express: Front of card (CID) */
          <motion.div
            key="amex-front"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={transition}
            className="w-full h-full flex items-center justify-center"
          >
            <svg
              viewBox="0 0 96 60"
              width={width}
              height={height}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-text-muted"
            >
              {/* Card Base */}
              <rect
                x="2"
                y="2"
                width="92"
                height="56"
                rx="6"
                className="stroke-border-strong fill-surface"
                strokeWidth="1.5"
              />
              {/* EMV Chip */}
              <rect
                x="10"
                y="16"
                width="14"
                height="11"
                rx="2"
                className="stroke-border-strong fill-surface-active"
                strokeWidth="1"
              />
              <line x1="10" y1="21.5" x2="24" y2="21.5" className="stroke-border-strong" strokeWidth="0.75" />
              <line x1="17" y1="16" x2="17" y2="27" className="stroke-border-strong" strokeWidth="0.75" />

              {/* Embossed Number Lines */}
              <rect x="10" y="36" width="16" height="3" rx="1.5" fill="currentColor" fillOpacity="0.3" />
              <rect x="29" y="36" width="22" height="3" rx="1.5" fill="currentColor" fillOpacity="0.3" />
              <rect x="54" y="36" width="18" height="3" rx="1.5" fill="currentColor" fillOpacity="0.3" />

              {/* Front CID Highlight Box (4 digits on front right above number) */}
              <rect
                x="64"
                y="18"
                width="22"
                height="11"
                rx="2.5"
                className="stroke-accent fill-accent/15"
                strokeWidth="1.5"
              />
              <text
                x="75"
                y="26"
                textAnchor="middle"
                className="fill-accent font-mono font-bold text-[7.5px]"
              >
                1234
              </text>
              <text
                x="75"
                y="14"
                textAnchor="middle"
                className="fill-accent text-[6px] font-semibold tracking-wide uppercase"
              >
                4 Digits
              </text>
            </svg>
          </motion.div>
        ) : !isUnknown ? (
          /* Standard Cards (Visa, MC, RuPay, etc.): Back of card (CVV/CVC) */
          <motion.div
            key="standard-back"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={transition}
            className="w-full h-full flex items-center justify-center"
          >
            <svg
              viewBox="0 0 96 60"
              width={width}
              height={height}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-text-muted"
            >
              {/* Card Base */}
              <rect
                x="2"
                y="2"
                width="92"
                height="56"
                rx="6"
                className="stroke-border-strong fill-surface"
                strokeWidth="1.5"
              />
              {/* Magnetic Stripe */}
              <rect
                x="2"
                y="10"
                width="92"
                height="12"
                className="fill-foreground/40"
              />
              {/* Signature Panel */}
              <rect
                x="8"
                y="28"
                width="56"
                height="13"
                rx="1.5"
                className="fill-surface-active stroke-border-subtle"
                strokeWidth="0.75"
              />
              <line x1="12" y1="32" x2="52" y2="32" className="stroke-border-strong" strokeWidth="0.5" strokeDasharray="2 2" />
              <line x1="12" y1="36" x2="48" y2="36" className="stroke-border-strong" strokeWidth="0.5" strokeDasharray="2 2" />

              {/* CVV 3-Digit Highlight Box */}
              <rect
                x="67"
                y="28"
                width="19"
                height="13"
                rx="2.5"
                className="stroke-accent fill-accent/15"
                strokeWidth="1.5"
              />
              <text
                x="76.5"
                y="37.5"
                textAnchor="middle"
                className="fill-accent font-mono font-bold text-[8px]"
              >
                123
              </text>
              <text
                x="76.5"
                y="50"
                textAnchor="middle"
                className="fill-accent text-[6px] font-semibold tracking-wide uppercase"
              >
                3 Digits
              </text>
            </svg>
          </motion.div>
        ) : (
          /* Neutral / Unknown Card Hint */
          <motion.div
            key="neutral-overview"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={transition}
            className="w-full h-full flex items-center justify-center"
          >
            <svg
              viewBox="0 0 96 60"
              width={width}
              height={height}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-text-muted"
            >
              {/* Card Base */}
              <rect
                x="2"
                y="2"
                width="92"
                height="56"
                rx="6"
                className="stroke-border fill-surface"
                strokeWidth="1.5"
              />
              {/* Magnetic Stripe */}
              <rect x="2" y="10" width="92" height="10" className="fill-foreground/20" />
              {/* Signature Strip */}
              <rect x="8" y="27" width="54" height="12" rx="1.5" className="fill-surface-active" />
              {/* 3 or 4 digit hint */}
              <rect
                x="65"
                y="27"
                width="22"
                height="12"
                rx="2"
                className="stroke-text-muted fill-surface-active"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <text
                x="76"
                y="36"
                textAnchor="middle"
                className="fill-text-secondary font-mono text-[7px]"
              >
                3 or 4
              </text>
              <text
                x="48"
                y="51"
                textAnchor="middle"
                className="fill-text-muted text-[6px]"
              >
                Back or front of card
              </text>
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
