'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Settings, CheckCheck, Trash2, ArrowLeft } from 'lucide-react';
import { PaginatedNotificationsResponse } from '@/lib/notifications/types';
import { useNotificationStore } from '@/store/useNotificationStore';
import { NotificationTabs } from '@/components/notifications/NotificationTabs';
import { NotificationList } from '@/components/notifications/NotificationList';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationsPageClientProps {
  initialData: PaginatedNotificationsResponse;
}

export function NotificationsPageClient({ initialData }: NotificationsPageClientProps) {
  const { user } = useAuth();
  const userId = user?.id || 'usr-demo-1';

  const {
    unreadCount,
    markAllAsRead,
    fetchNotifications,
  } = useNotificationStore();

  useEffect(() => {
    // Populate store with initial server data
    useNotificationStore.setState({
      notifications: initialData.notifications,
      unreadCount: initialData.unreadCount,
      categoryCounts: initialData.categoryCounts,
      hasMore: initialData.hasMore,
      nextCursor: initialData.nextCursor,
      isInitialLoaded: true,
    });
  }, [initialData]);

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all your past notifications history?')) return;
    try {
      const all = useNotificationStore.getState().notifications;
      for (const item of all) {
        await useNotificationStore.getState().dismiss(item.id, userId);
      }
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Account</span>
          </Link>
          <Link
            href="/account/notifications"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-foreground transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </Link>
        </div>

        {/* Header Card */}
        <div className="rounded-2xl bg-surface border border-border p-6 mb-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-accent/20 text-accent">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-sm text-text-muted mt-1">
                A calm, truthful record of order changes, price drops, and restocks.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => markAllAsRead(userId)}
                disabled={unreadCount === 0}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border transition-colors ${
                  unreadCount > 0
                    ? 'bg-surface-active hover:bg-surface-hover text-foreground cursor-pointer'
                    : 'opacity-40 cursor-not-allowed text-text-muted'
                }`}
              >
                <CheckCheck className="w-3.5 h-3.5 text-accent" />
                <span>Mark all as read</span>
              </button>

              <button
                type="button"
                onClick={handleClearHistory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-active hover:bg-surface-hover border border-border text-text-muted hover:text-foreground transition-colors cursor-pointer"
                title="Clear notification history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear history</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Feed Container */}
        <div className="rounded-2xl bg-surface border border-border shadow-xs overflow-hidden flex flex-col">
          <NotificationTabs />
          <div className="p-1">
            <NotificationList isFullPage={true} />
          </div>
        </div>

        {/* Privacy Note */}
        <p className="text-center text-xs text-text-muted/60 mt-8">
          Quiet by default. Sensitive details like payment numbers and addresses stay out of this feed.
        </p>
      </div>
    </div>
  );
}
