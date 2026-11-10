'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationHeader } from './NotificationHeader';
import { NotificationTabs } from './NotificationTabs';
import { NotificationList } from './NotificationList';
import { useNotificationStore } from '@/store/useNotificationStore';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
}

export function NotificationDropdown({ isOpen, onClose, anchorRef }: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        anchorRef?.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose, anchorRef]);

  // Keyboard navigation: Escape key closes and restores focus
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        anchorRef?.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, anchorRef]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
          id="notification-panel"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl bg-surface/95 backdrop-blur-xl border border-border shadow-xl z-50 flex flex-col overflow-hidden text-foreground"
          style={{ height: 'min(70svh, 560px)' }}
        >
          <NotificationHeader onClose={onClose} />
          <NotificationTabs />
          <NotificationList onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
