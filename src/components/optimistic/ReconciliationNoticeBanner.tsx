'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Info, Sparkles, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ReconciliationNotice } from '@/lib/optimistic/types';

export interface ReconciliationNoticeBannerProps {
  notices: ReconciliationNotice[];
  onDismiss: (id: string) => void;
  className?: string;
}

export const ReconciliationNoticeBanner: React.FC<ReconciliationNoticeBannerProps> = ({
  notices,
  onDismiss,
  className = '',
}) => {
  if (!notices || notices.length === 0) return null;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <AnimatePresence>
        {notices.map((notice) => (
          <motion.div
            key={notice.id}
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            role="status"
            aria-live="polite"
            className="p-3 bg-surface border border-accent/30 rounded-xl flex items-center justify-between text-xs text-foreground shadow-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              {notice.type === 'quantity_capped' || notice.type === 'item_unavailable' ? (
                <AlertCircle className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
              ) : notice.type === 'cart_merged' ? (
                <Sparkles className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
              ) : (
                <Info className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
              )}

              <div className="truncate">
                <span className="font-semibold text-foreground mr-1.5">{notice.title}:</span>
                <span className="text-text-muted">{notice.message}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {notice.actionLabel && notice.actionHref && (
                <Link
                  href={notice.actionHref}
                  className="inline-flex items-center gap-1 text-accent hover:underline font-medium text-[11px]"
                >
                  {notice.actionLabel} <ArrowRight className="w-3 h-3" />
                </Link>
              )}

              <button
                type="button"
                onClick={() => onDismiss(notice.id)}
                className="p-1 rounded-full text-text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                aria-label="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
