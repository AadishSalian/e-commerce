'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useOptimisticCartStore } from '@/store/useOptimisticCartStore';

export const OfflineSyncBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  const isOnline = useOptimisticCartStore((s) => s.isOnline);
  const syncOutboxToServer = useOptimisticCartStore((s) => s.syncOutboxToServer);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          role="status"
          aria-live="polite"
          className={`p-3 bg-surface/90 border border-border/80 rounded-xl flex items-center justify-between text-xs text-text-muted backdrop-blur-md shadow-sm ${className}`}
        >
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
            <span>
              <strong className="text-foreground">Offline.</strong> Changes will sync automatically when you&apos;re back online.
            </span>
          </div>

          <button
            type="button"
            onClick={() => syncOutboxToServer()}
            className="flex items-center gap-1 text-accent hover:underline font-medium ml-3 shrink-0"
          >
            <RefreshCw className="w-3 h-3" /> Sync now
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
