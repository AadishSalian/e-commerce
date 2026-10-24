'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Info,
  ShieldCheck
} from 'lucide-react';
import {
  EngravingZone,
  PersonalizationValue,
  PersonalizationCartProperty,
  EngravingFont
} from '@/lib/personalization/types';
import {
  detectAmbiguousCharacters,
  formatSpelledOutText
} from '@/lib/personalization/validation';
import { FINISH_HONEST_DISCLAIMER } from '@/lib/personalization/data';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  zone: EngravingZone;
  value: PersonalizationValue;
  productName: string;
  productImage: string;
  selectedVariantValue?: string | null;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  zone,
  value,
  productName,
  productImage,
  selectedVariantValue
}: ConfirmationModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const [hasConfirmedSpelling, setHasConfirmedSpelling] = useState(false);

  // Reset checkbox when opening
  useEffect(() => {
    if (isOpen) {
      setHasConfirmedSpelling(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const font: EngravingFont =
    zone.fonts.find((f) => f.id === value.font_id) || zone.fonts[0];

  const fullText = value.lines.filter((l) => l.trim().length > 0).join(' / ');
  const spelledOut = formatSpelledOutText(fullText);
  const ambiguousChars = detectAmbiguousCharacters(fullText);

  const priceAddonDollars = (zone.price_addon / 100).toFixed(2);

  // Edit window cutoff time (2 hours from now)
  const editCutoffTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 12 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 12 }
            }
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-2xl text-foreground z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-accent flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Final Verification
                </span>
                <h3 id="confirmation-modal-title" className="text-xl font-bold tracking-tight mt-0.5">
                  Confirm Your Inscription
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface-hover text-text-muted hover:text-foreground transition-colors"
                aria-label="Close confirmation dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-5 text-sm">
              {/* Product & Style Summary */}
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-background border border-border">
                <div className="w-12 h-12 rounded-lg bg-surface-hover border border-border overflow-hidden shrink-0">
                  <img
                    src={productImage}
                    alt={productName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-foreground">{productName}</p>
                  <p className="text-xs text-text-muted">
                    {zone.name} • {font.label}
                    {selectedVariantValue ? ` • ${selectedVariantValue}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-accent tabular-nums block">
                    +${priceAddonDollars}
                  </span>
                  <span className="text-[10px] text-text-muted flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" /> +{zone.lead_time_days}d
                  </span>
                </div>
              </div>

              {/* Exact Text Display in Chosen Font */}
              <div className="p-5 rounded-xl bg-background/60 border border-border/80 text-center space-y-2">
                <span className="text-[11px] text-text-muted uppercase tracking-wider block">
                  How it appears on product:
                </span>
                <div
                  className="text-2xl sm:text-3xl font-medium tracking-wider text-foreground break-words py-1"
                  style={{ fontFamily: font.font_family, letterSpacing: font.letter_spacing }}
                >
                  {fullText}
                </div>
              </div>

              {/* Character by Character Spelling Breakdown */}
              <div className="space-y-1.5 p-3.5 rounded-xl bg-surface-hover/60 border border-border">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span className="font-medium">Character-by-character spelling:</span>
                  <span className="font-mono text-[11px]">{fullText.length} chars</span>
                </div>
                <p className="font-mono text-sm tracking-widest text-foreground py-1 select-all bg-background px-3 rounded border border-border/50">
                  {spelledOut}
                </p>
              </div>

              {/* Ambiguity Highlighting (0 vs O, 1 vs l, 5 vs S) */}
              {ambiguousChars.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Ambiguous Character Check</span>
                  </div>
                  <p className="text-amber-200/90 text-[11px] leading-relaxed">
                    Please confirm these characters are what you intended:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {ambiguousChars.map((match, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-amber-500/20 font-mono text-amber-100 border border-amber-500/40"
                      >
                        Position {match.index + 1}: &ldquo;{match.char}&rdquo; ({match.explanation})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notice & Disclaimer */}
              <div className="text-[11px] text-text-muted leading-relaxed space-y-1.5 border-t border-border pt-3">
                <p className="flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-accent" />
                  <span>{FINISH_HONEST_DISCLAIMER}</span>
                </p>
                <p className="text-text-muted/80 pl-5">
                  Window for changes: You can edit or cancel this engraving up until{' '}
                  <strong className="text-foreground">{editCutoffTime} today</strong> before
                  workshop production begins.
                </p>
              </div>

              {/* Required Non-Returnable Consent Checkbox */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-surface border border-accent/40 cursor-pointer hover:border-accent transition-colors select-none">
                <input
                  type="checkbox"
                  checked={hasConfirmedSpelling}
                  onChange={(e) => setHasConfirmedSpelling(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border text-accent focus:ring-accent bg-background"
                />
                <span className="text-xs text-foreground leading-snug">
                  <strong>I have double-checked the spelling and capitalization.</strong> I understand
                  custom engraved and monogrammed items are made strictly to order and{' '}
                  <span className="underline font-semibold">cannot be returned</span>.
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-surface-hover text-text-muted hover:text-foreground transition-colors"
              >
                Go Back & Edit
              </button>
              <button
                type="button"
                disabled={!hasConfirmedSpelling}
                onClick={onConfirm}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-accent text-black hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent transition-all duration-200 flex items-center gap-2 shadow-md shadow-accent/10"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm & Add to Bag
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
