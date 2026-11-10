'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_DEMO_USER } from '@/store/useAuthStore';
import { NotificationDropdown } from './NotificationDropdown';
import { NotificationSheet } from './NotificationSheet';

interface NotificationBellProps {
  className?: string;
  isMobileNav?: boolean;
}

export function NotificationBell({ className = '', isMobileNav = false }: NotificationBellProps) {
  const { isLoggedIn, user, login } = useAuth();
  const {
    unreadCount,
    isOpen,
    setOpen,
    toggleOpen,
    fetchUnreadCount,
    fetchNotifications,
    setupSSE,
    setupBroadcastChannel,
    isInitialLoaded,
  } = useNotificationStore();

  const bellRef = useRef<HTMLButtonElement>(null);
  const guestPopoverRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const userId = user?.id || 'usr-demo-1';

  // Real-time SSE and BroadcastChannel setup
  useEffect(() => {
    if (!isLoggedIn) return;

    fetchUnreadCount(userId);
    const cleanupSSE = setupSSE(userId);
    const cleanupBC = setupBroadcastChannel();

    return () => {
      cleanupSSE();
      cleanupBC();
    };
  }, [isLoggedIn, userId, fetchUnreadCount, setupSSE, setupBroadcastChannel]);

  // Keyboard shortcut listener: Shift+N
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.shiftKey &&
        (e.key === 'N' || e.key === 'n') &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        toggleOpen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleOpen]);

  // Close guest popover on outside click
  useEffect(() => {
    if (isLoggedIn || !isOpen) return;

    const handleOutside = (e: MouseEvent) => {
      if (
        guestPopoverRef.current &&
        !guestPopoverRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isLoggedIn, isOpen, setOpen]);

  // Prefetch full list on hover or focus
  const handleMouseEnter = () => {
    if (isLoggedIn && !isInitialLoaded) {
      fetchNotifications(userId);
    }
  };

  const badgeText = unreadCount > 9 ? '9+' : unreadCount.toString();
  const accessibleLabel = !isLoggedIn
    ? 'Notifications, sign in to view'
    : unreadCount > 0
    ? `Notifications, ${unreadCount} unread`
    : 'Notifications, no unread notifications';

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        ref={bellRef}
        type="button"
        onClick={toggleOpen}
        onMouseEnter={handleMouseEnter}
        onFocus={handleMouseEnter}
        aria-expanded={isOpen}
        aria-controls={isMobile ? 'notification-sheet' : 'notification-panel'}
        aria-label={accessibleLabel}
        title="Notifications (Shift+N)"
        className="relative flex items-center justify-center w-8 h-8 rounded-full text-foreground/80 hover:text-foreground hover:bg-surface-hover/80 transition-colors outline-hidden focus-visible:ring-1 focus-visible:ring-accent cursor-pointer"
      >
        <Bell className="w-4 h-4" />

        {/* Unread Badge (only for signed-in users with unread items) */}
        <AnimatePresence mode="wait">
          {isLoggedIn && unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-accent text-[10px] font-bold text-background leading-none select-none tabular-nums"
            >
              {badgeText}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* When Signed In: Render Dropdown for Desktop, Sheet for Mobile */}
      {isLoggedIn && !isMobileNav && !isMobile && (
        <NotificationDropdown
          isOpen={isOpen}
          onClose={() => setOpen(false)}
          anchorRef={bellRef}
        />
      )}

      {isLoggedIn && (isMobileNav || isMobile) && (
        <NotificationSheet
          isOpen={isOpen}
          onClose={() => setOpen(false)}
          triggerRef={bellRef}
        />
      )}

      {/* When Guest: Friendly Calm Popover */}
      {!isLoggedIn && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={guestPopoverRef}
              role="dialog"
              aria-modal="true"
              aria-label="Sign in to view notifications"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-surface/98 backdrop-blur-xl border border-border shadow-xl p-5 z-50 text-center"
            >
              <div className="w-10 h-10 rounded-full bg-surface-active text-text-muted flex items-center justify-center mx-auto mb-3 border border-border">
                <Bell className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Sign in to see your notifications
              </h3>
              <p className="text-xs text-text-muted mb-4 leading-relaxed">
                Track real order milestones, price drops on your wishlists, and restock alerts.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    login(DEFAULT_DEMO_USER);
                    setOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-accent text-background hover:bg-accent-hover transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign in as Aadish Balakrishna Salian (Demo)</span>
                </button>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="text-xs text-text-muted hover:text-foreground transition-colors pt-1"
                >
                  Or enter credentials &rarr;
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
