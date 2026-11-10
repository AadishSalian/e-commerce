'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useNotificationStore } from '@/store/useNotificationStore';
import { NotificationCategory } from '@/lib/notifications/types';

interface TabItem {
  id: 'all' | NotificationCategory;
  label: string;
}

const TABS: TabItem[] = [
  { id: 'all', label: 'All' },
  { id: 'orders', label: 'Orders' },
  { id: 'price', label: 'Price' },
  { id: 'stock', label: 'Stock' },
];

export function NotificationTabs() {
  const activeCategory = useNotificationStore((state) => state.activeCategory);
  const setActiveCategory = useNotificationStore((state) => state.setActiveCategory);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const categoryCounts = useNotificationStore((state) => state.categoryCounts);

  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % TABS.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + TABS.length) % TABS.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = TABS.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextTab = TABS[nextIndex];
    setActiveCategory(nextTab.id);
    const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[nextIndex]?.focus();
  };

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-label="Notification categories"
      className="flex items-center gap-1 p-1.5 mx-3 my-2 rounded-xl bg-surface-active/40 border border-border/40 select-none"
    >
      {TABS.map((tab, idx) => {
        const isActive = activeCategory === tab.id;
        const count = tab.id === 'all' ? unreadCount : categoryCounts[tab.id as NotificationCategory] || 0;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls="notification-feed-panel"
            id={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => setActiveCategory(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
              isActive ? 'text-foreground font-semibold' : 'text-text-muted hover:text-foreground'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="notificationTabIndicator"
                className="absolute inset-0 rounded-lg bg-surface border border-border shadow-xs"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
            {count > 0 && (
              <span
                className={`relative z-10 px-1 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                  isActive ? 'bg-accent/20 text-accent' : 'bg-surface-active text-text-muted'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
