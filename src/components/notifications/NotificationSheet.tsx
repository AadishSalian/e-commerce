'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { NotificationHeader } from './NotificationHeader';
import { NotificationTabs } from './NotificationTabs';
import { NotificationList } from './NotificationList';
import { useBottomStackOffset } from '@/lib/compare/bottomStack';

interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export function NotificationSheet({ isOpen, onClose, triggerRef }: NotificationSheetProps) {
  const bottomOffset = useBottomStackOffset(true);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Trap Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        triggerRef?.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, triggerRef]);

  // Lock body scroll when mobile sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            id="notification-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            className="relative z-10 w-full rounded-t-3xl bg-surface/98 backdrop-blur-xl border-t border-border flex flex-col max-h-[85vh] shadow-2xl overflow-hidden pb-safe"
            style={{ marginBottom: `${bottomOffset}px` }}
          >
            {/* Drag Handle */}
            <div className="w-full flex items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-border-strong/60" />
            </div>

            <div className="flex items-center justify-between px-4 pb-1">
              <span className="text-xs font-medium text-text-muted">Swipe down to close</span>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-text-muted hover:text-foreground hover:bg-surface-active transition-colors"
                aria-label="Close notification sheet"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <NotificationHeader onClose={onClose} />
            <NotificationTabs />
            <div className="flex-1 overflow-hidden flex flex-col">
              <NotificationList onClose={onClose} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
