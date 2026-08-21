'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[70] md:hidden"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-surface rounded-t-3xl border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 md:hidden pb-safe flex flex-col max-h-[85vh]"
          >
            <div className="flex justify-center mb-6">
              <div className="w-12 h-1.5 bg-border rounded-full" />
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">{title}</h2>
              <button 
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-active transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            
            <div className="overflow-y-auto hide-scrollbar flex-1 pb-10">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
