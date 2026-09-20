'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Info, X } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
export type { ToastType, Toast } from '@/store/useUIStore';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toasts = useUIStore(state => state.toasts);
  const removeToast = useUIStore(state => state.removeToast);

  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border backdrop-blur-xl ${
                t.type === 'success' 
                  ? 'bg-surface-hover/90 border-border text-foreground' 
                  : t.type === 'error'
                  ? 'bg-red-950/90 border-red-900/50 text-foreground'
                  : 'bg-surface-hover/90 border-border text-foreground'
              }`}
            >
              {t.type === 'success' && <Check className="w-5 h-5 text-accent" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-text-muted" />}
              
              <p className="text-sm font-medium pr-4">{t.message}</p>
              
              <button 
                onClick={() => removeToast(t.id)}
                className="ml-auto opacity-50 hover:opacity-100 transition-opacity"
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
