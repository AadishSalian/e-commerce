'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, AlertCircle, Info, X } from 'lucide-react';
import { useUIStore, Toast } from '@/store/useUIStore';
export type { ToastType, Toast, ToastAction } from '@/store/useUIStore';

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const prefersReducedMotion = useReducedMotion();
  const [isPaused, setIsPaused] = useState(false);
  const remainingTimeRef = useRef(toast.durationMs || 5500);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const startTimer = () => {
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        onDismiss(toast.id);
      }, remainingTimeRef.current);
    };

    if (!isPaused) {
      startTimer();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPaused, toast.id, onDismiss]);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(1000, remainingTimeRef.current - elapsed);
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const handleFocus = () => {
    handleMouseEnter();
  };

  const handleBlur = () => {
    handleMouseLeave();
  };

  // Keyboard dismiss (Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onDismiss(toast.id);
    }
  };

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  return (
    <motion.div
      layout="position"
      initial={{
        opacity: 0,
        x: prefersReducedMotion ? 0 : 50,
        scale: prefersReducedMotion ? 1 : 0.95,
      }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{
        opacity: 0,
        scale: prefersReducedMotion ? 1 : 0.95,
        transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
      }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      role="status"
      aria-live="polite"
      tabIndex={0}
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        isError
          ? 'bg-red-950/95 border-red-800/60 text-white shadow-red-950/30'
          : isSuccess
          ? 'bg-surface/95 border-border text-foreground shadow-black/20'
          : 'bg-surface/95 border-border text-foreground shadow-black/20'
      }`}
    >
      {isSuccess && <Check className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />}
      {isError && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" aria-hidden="true" />}
      {!isSuccess && !isError && (
        <Info className="w-5 h-5 text-text-muted shrink-0" aria-hidden="true" />
      )}

      <p className="text-sm font-medium flex-1 select-none pr-1">{toast.message}</p>

      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action!.onClick();
            onDismiss(toast.id);
          }}
          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-surface-hover hover:bg-surface-active text-accent text-xs font-semibold uppercase tracking-wider border border-border/80 transition-colors shrink-0 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-accent"
        >
          {toast.action.label}
        </button>
      )}

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-foreground transition-colors -mr-2 rounded-full focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);

  return (
    <>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0"
        aria-label="Notifications"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
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
