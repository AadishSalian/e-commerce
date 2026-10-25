'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, AlertCircle, X } from 'lucide-react';
import Image from 'next/image';
import { useCompare } from '@/contexts/CompareContext';

export function CategoryMismatchModal() {
  const { pendingReplacement, confirmCategoryReplacement, cancelCategoryReplacement } = useCompare();

  // Handle ESC key to dismiss
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pendingReplacement) {
        cancelCategoryReplacement();
      }
    },
    [pendingReplacement, cancelCategoryReplacement]
  );

  useEffect(() => {
    if (pendingReplacement) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [pendingReplacement, handleKeyDown]);

  if (!pendingReplacement) return null;

  const { incomingProduct, currentCategory, newCategory, currentCount } = pendingReplacement;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-mismatch-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={cancelCategoryReplacement}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md bg-surface border border-border shadow-2xl rounded-2xl p-6 overflow-hidden z-10"
        >
          {/* Close button */}
          <button
            onClick={cancelCategoryReplacement}
            className="absolute top-4 right-4 p-2 text-text-muted hover:text-foreground rounded-lg transition-colors"
            aria-label="Dismiss category notice"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-3.5 mb-4">
            <div className="p-2.5 rounded-xl bg-accent/10 text-accent shrink-0 mt-0.5">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 id="category-mismatch-title" className="text-lg font-semibold text-foreground tracking-tight">
                Compare works within one category
              </h3>
              <p className="text-sm text-text-muted mt-1 leading-relaxed">
                You’re currently comparing <span className="text-foreground font-medium">{currentCount} item{currentCount === 1 ? '' : 's'}</span> in{' '}
                <span className="text-foreground font-medium">{currentCategory}</span>.
              </p>
            </div>
          </div>

          {/* Incoming item card preview */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/60 mb-5">
            <div className="w-12 h-12 rounded-lg bg-surface-active overflow-hidden relative shrink-0 border border-border/40">
              <Image
                src={incomingProduct.image}
                alt={incomingProduct.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{incomingProduct.name}</p>
              <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                <span className="inline-block px-1.5 py-0.5 rounded bg-surface border border-border/60 font-mono text-[10px]">
                  {newCategory}
                </span>
                <span>•</span>
                <span className="font-mono tabular-nums">${incomingProduct.price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs mb-5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Starting a new comparison will replace the {currentCount} existing item{currentCount === 1 ? '' : 's'}.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={cancelCategoryReplacement}
              className="px-4 py-2 text-sm font-medium text-text-muted hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmCategoryReplacement}
              className="px-4 py-2 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 rounded-lg shadow-sm transition-colors"
            >
              Start New Comparison
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
