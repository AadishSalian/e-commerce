'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Info, X } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
export type { ToastType, Toast, ToastAction } from '@/store/useUIStore';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);

  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl ${
                t.type === 'success'
                  ? 'bg-surface/95 border-border text-foreground'
                  : t.type === 'error'
                  ? 'bg-red-950/90 border-red-900/50 text-foreground'
                  : 'bg-surface/95 border-border text-foreground'
              }`}
            >
              {t.type === 'success' && <Check className="w-5 h-5 text-accent shrink-0" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-text-muted shrink-0" />}

              <p className="text-sm font-medium flex-1 truncate">{t.message}</p>

              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action!.onClick();
                    removeToast(t.id);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-surface-hover hover:bg-surface-active text-accent text-xs font-semibold uppercase tracking-wider border border-border/80 transition-colors shrink-0"
                >
                  {t.action.label}
                </button>
              )}

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="opacity-50 hover:opacity-100 transition-opacity p-1 -mr-1"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

export function useToast() {
  const { addToast, success, error } = useUIStore();
  return { toast: addToast, success, error };
}
