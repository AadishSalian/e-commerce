'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUp, ChevronRight, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { NotificationRecord } from '@/lib/notifications/types';
import { getFeedDayGroup } from '@/lib/notifications/validation';
import { NotificationItem } from './NotificationItem';
import { NotificationEmptyState } from './NotificationEmptyState';
import { NotificationErrorState } from './NotificationErrorState';
import { useNotificationStore } from '@/store/useNotificationStore';

interface NotificationListProps {
  onClose?: () => void;
  isFullPage?: boolean;
}

export function NotificationList({ onClose, isFullPage = false }: NotificationListProps) {
  const {
    notifications,
    activeCategory,
    isLoading,
    isInitialLoaded,
    error,
    newLiveItemsCount,
    clearNewLiveCount,
    liveAnnouncement,
    fetchNotifications,
    hasMore,
  } = useNotificationStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setIsScrolled(scrollContainerRef.current.scrollTop > 50);
    }
  };

  const handleScrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      clearNewLiveCount();
    }
  };

  // Group notifications into Today, Yesterday, Earlier
  const groups: Record<'Today' | 'Yesterday' | 'Earlier', NotificationRecord[]> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  for (const n of notifications) {
    const group = getFeedDayGroup(n.created_at);
    groups[group].push(n);
  }

  const activeGroupKeys = (['Today', 'Yesterday', 'Earlier'] as const).filter(
    (key) => groups[key].length > 0
  );

  return (
    <div className="relative flex flex-col flex-1 min-h-0">
      {/* Polite live region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* Floating "X new" pill when scrolled down */}
      <AnimatePresence>
        {isScrolled && newLiveItemsCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-20"
          >
            <button
              type="button"
              onClick={handleScrollToTop}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-background text-xs font-semibold shadow-md hover:bg-accent-hover transition-colors cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>
                {newLiveItemsCount} new {newLiveItemsCount === 1 ? 'update' : 'updates'}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state banner */}
      {error && (
        <NotificationErrorState
          onRetry={() => fetchNotifications(undefined, false)}
          isLoading={isLoading}
        />
      )}

      {/* Scrollable feed area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto overscroll-contain divide-y divide-border/20 ${
          isFullPage ? '' : 'max-h-[420px]'
        }`}
        id="notification-feed-panel"
      >
        {isLoading && !isInitialLoaded ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-muted">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
            <span className="text-xs">Checking truthful updates…</span>
          </div>
        ) : activeGroupKeys.length === 0 ? (
          <NotificationEmptyState category={activeCategory} onClose={onClose} />
        ) : (
          <ul className="m-0 p-0 list-none divide-y divide-border/30">
            {activeGroupKeys.map((groupKey) => (
              <li key={groupKey} className="list-none">
                <div className="sticky top-0 z-10 px-4 py-1.5 bg-surface/95 backdrop-blur-md border-b border-border/30 text-[11px] font-semibold uppercase tracking-wider text-text-muted select-none">
                  {groupKey}
                </div>
                <ul className="m-0 p-0 list-none">
                  <AnimatePresence initial={false}>
                    {groups[groupKey].map((notif) => (
                      <NotificationItem
                        key={notif.id}
                        notification={notif}
                        onNavigate={onClose}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              </li>
            ))}
          </ul>
        )}

        {/* Load more trigger for full page or long feeds */}
        {hasMore && (
          <div className="p-4 text-center">
            <button
              type="button"
              onClick={() => fetchNotifications(undefined, true)}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-surface hover:bg-surface-hover border border-border text-foreground transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Loading…' : 'Load earlier notifications'}
            </button>
          </div>
        )}
      </div>

      {/* Dropdown Footer */}
      {!isFullPage && (
        <div className="px-4 py-2.5 border-t border-border/60 bg-surface/50 flex items-center justify-between text-xs select-none">
          <Link
            href="/notifications"
            onClick={onClose}
            className="flex items-center gap-1 font-medium text-text-muted hover:text-foreground transition-colors"
          >
            <span>View all notifications</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <span className="text-[11px] text-text-muted/60">Quiet by default</span>
        </div>
      )}
    </div>
  );
}
