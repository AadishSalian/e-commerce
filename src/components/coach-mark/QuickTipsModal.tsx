'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Filter, Heart, Play } from 'lucide-react';
import { DEFAULT_TOUR_CONFIG } from '@/lib/coach-mark/config';

interface QuickTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartInteractiveTour: () => void;
}

export const QuickTipsModal: React.FC<QuickTipsModalProps> = ({
  isOpen,
  onClose,
  onStartInteractiveTour,
}) => {
  if (!isOpen) return null;

  const stepIcons: Record<string, React.ReactNode> = {
    search: <Search className="w-5 h-5 text-accent" />,
    filters: <Filter className="w-5 h-5 text-accent" />,
    wishlist: <Heart className="w-5 h-5 text-accent" />,
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          aria-hidden="true"
        />

        {/* Modal Dialog */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-tips-modal-title"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-surface text-foreground border border-border rounded-2xl p-6 shadow-none z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h2 id="quick-tips-modal-title" className="text-lg font-semibold tracking-tight">
                Quick Site Guide
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Key features designed for effortless shopping
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-active transition-colors"
              aria-label="Close guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List of Tips */}
          <div className="flex flex-col gap-4 my-5">
            {DEFAULT_TOUR_CONFIG.steps.map((step, idx) => (
              <div
                key={step.id}
                className="flex items-start gap-3.5 p-3.5 rounded-xl border border-border/60 bg-surface-hover/30"
              >
                <div className="p-2 rounded-lg bg-surface border border-border shrink-0 mt-0.5">
                  {stepIcons[step.id] || <span className="font-mono text-xs">{idx + 1}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted">
                      Tip {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-foreground">{step.title}</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">{step.body}</p>
                  <span className="text-[11px] text-text-muted/80 italic mt-0.5">
                    Location: {step.controlName}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
            <button
              onClick={onClose}
              className="text-xs text-text-muted hover:text-foreground py-2 px-3 transition-colors"
            >
              Dismiss
            </button>

            <button
              onClick={() => {
                onClose();
                onStartInteractiveTour();
              }}
              className="px-4 py-2 bg-accent text-[#121212] font-semibold text-xs rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Interactive Tour</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
