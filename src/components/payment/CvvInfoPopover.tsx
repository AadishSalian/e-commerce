'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion, type Transition } from 'framer-motion';
import { ExtendedCardBrandId } from '@/lib/payment/types';
import { CARD_BRAND_DEFINITIONS, UNKNOWN_BRAND_HELPER } from '@/lib/payment/cardBrands';
import { CardSecurityCodeIllustration } from './CardSecurityCodeIllustration';

interface CvvInfoPopoverProps {
  brand: ExtendedCardBrandId;
  label: string;
}

/**
 * Accessible Info popover/tooltip for CVV/CVC/CID guidance.
 * Works on keyboard focus, click, and mobile tap (never hover alone).
 * Conforms to WCAG AA with ESC-to-dismiss and click-outside listeners.
 */
export function CvvInfoPopover({ brand, label }: CvvInfoPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const meta = brand !== 'unknown' ? CARD_BRAND_DEFINITIONS[brand] : null;
  const helperText = meta ? meta.securityCodeHelper : UNKNOWN_BRAND_HELPER;
  const codeName = meta ? meta.securityCodeName : label;

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const popoverTransition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: [0.16, 1, 0.3, 1] };

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`About ${codeName}: ${helperText}`}
        className="p-1 min-w-[28px] min-h-[28px] rounded-full text-text-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors flex items-center justify-center"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverRef}
            role="dialog"
            aria-modal="false"
            aria-label={`${codeName} assistance`}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={popoverTransition}
            className="absolute right-0 bottom-full mb-2 z-50 w-64 p-4 rounded-xl bg-surface border border-border shadow-xl shadow-black/30 text-left"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-foreground">
                {codeName} Location
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                className="text-text-muted hover:text-foreground p-0.5 rounded transition-colors"
                aria-label="Close security code help"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="my-2 flex justify-center py-1 bg-surface-active/50 rounded-lg border border-border-subtle">
              <CardSecurityCodeIllustration brand={brand} width={120} height={75} />
            </div>

            <p className="text-xs text-text-secondary mt-2 leading-relaxed">
              {brand === 'amex' ? (
                <>
                  <strong className="text-foreground">4-digit CID:</strong> Printed on the front of American Express cards, right above the card number.
                </>
              ) : brand !== 'unknown' ? (
                <>
                  <strong className="text-foreground">3-digit {codeName}:</strong> Printed on the signature strip on the back of your card.
                </>
              ) : (
                <>
                  The 3 or 4 digit code printed on the signature strip on the back (Visa, Mastercard, RuPay) or on the front (Amex).
                </>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
