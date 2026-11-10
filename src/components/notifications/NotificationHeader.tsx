'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, CheckCheck } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';

interface NotificationHeaderProps {
  onClose?: () => void;
}

export function NotificationHeader({ onClose }: NotificationHeaderProps) {
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  const handleMarkAll = (e: React.MouseEvent) => {
    e.preventDefault();
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-surface/40 select-none">
      <div className="flex items-center gap-2">
        <h2 id="notification-heading" className="text-sm font-semibold tracking-wide text-foreground">
          Notifications
        </h2>
        {unreadCount > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-accent/15 text-accent">
            {unreadCount} unread
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleMarkAll}
          disabled={unreadCount === 0}
          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
            unreadCount > 0
              ? 'text-text-muted hover:text-foreground hover:bg-surface-hover cursor-pointer'
              : 'text-text-muted/40 cursor-not-allowed'
          }`}
          aria-label="Mark all notifications as read"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mark all as read</span>
        </button>

        <Link
          href="/account/notifications"
          onClick={onClose}
          className="p-1.5 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          aria-label="Notification preferences and settings"
          title="Notification preferences"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
