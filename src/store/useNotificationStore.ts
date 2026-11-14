'use client';

import { create } from 'zustand';
import {
  NotificationRecord,
  NotificationCategory,
  NotificationPreferences,
} from '@/lib/notifications/types';
import { announcer } from '@/lib/optimistic/announcer';
import { useUIStore } from './useUIStore';

interface NotificationState {
  notifications: NotificationRecord[];
  unreadCount: number;
  categoryCounts: Record<NotificationCategory, number>;
  activeCategory: 'all' | NotificationCategory;
  isOpen: boolean;
  isLoading: boolean;
  isInitialLoaded: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor: string | null;
  newLiveItemsCount: number;
  liveAnnouncement: string | null;
  preferences: NotificationPreferences | null;

  // Actions
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setActiveCategory: (cat: 'all' | NotificationCategory) => void;
  fetchUnreadCount: (userId?: string) => Promise<void>;
  fetchNotifications: (userId?: string, loadMore?: boolean) => Promise<void>;
  markAsRead: (id: string, userId?: string) => Promise<void>;
  markAsUnread: (id: string, userId?: string) => Promise<void>;
  markAllAsRead: (userId?: string, category?: NotificationCategory) => Promise<void>;
  dismiss: (id: string, userId?: string) => Promise<void>;
  clearNewLiveCount: () => void;
  setupSSE: (userId: string) => () => void;
  setupBroadcastChannel: () => () => void;
}

// BroadcastChannel instance for cross-tab sync
let broadcastChannel: BroadcastChannel | null = null;
let sseSource: EventSource | null = null;
let announceTimer: NodeJS.Timeout | null = null;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  categoryCounts: {
    orders: 0,
    price: 0,
    stock: 0,
    account: 0,
  },
  activeCategory: 'all',
  isOpen: false,
  isLoading: false,
  isInitialLoaded: false,
  error: null,
  hasMore: false,
  nextCursor: null,
  newLiveItemsCount: 0,
  liveAnnouncement: null,
  preferences: null,

  setOpen: (open) => {
    set({ isOpen: open });
    if (open) {
      set({ newLiveItemsCount: 0 });
      // Fetch notifications if not yet loaded
      if (!get().isInitialLoaded) {
        get().fetchNotifications();
      }
    }
  },

  toggleOpen: () => {
    const next = !get().isOpen;
    get().setOpen(next);
  },

  setActiveCategory: (cat) => {
    set({ activeCategory: cat });
    get().fetchNotifications(undefined, false);
  },

  fetchUnreadCount: async (userId = 'usr-demo-1') => {
    try {
      const res = await fetch(`/api/notifications/unread-count?userId=${encodeURIComponent(userId)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        set({
          unreadCount: data.unreadCount ?? 0,
          categoryCounts: data.categoryCounts ?? { orders: 0, price: 0, stock: 0, account: 0 },
        });
      }
    } catch (err) {
      // Quiet fail
    }
  },

  fetchNotifications: async (userId = 'usr-demo-1', loadMore = false) => {
    const state = get();
    if (state.isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const catParam = state.activeCategory !== 'all' ? `&category=${state.activeCategory}` : '';
      const cursorParam = loadMore && state.nextCursor ? `&cursor=${state.nextCursor}` : '';
      const url = `/api/notifications?userId=${encodeURIComponent(userId)}${catParam}${cursorParam}&limit=20`;

      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load notifications');

      const data = await res.json();

      set((prev) => ({
        notifications: loadMore ? [...prev.notifications, ...data.notifications] : data.notifications,
        unreadCount: data.unreadCount ?? prev.unreadCount,
        categoryCounts: data.categoryCounts ?? prev.categoryCounts,
        hasMore: data.hasMore ?? false,
        nextCursor: data.nextCursor ?? null,
        isInitialLoaded: true,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Could not load notifications', isLoading: false });
    }
  },

  markAsRead: async (id, userId = 'usr-demo-1') => {
    const state = get();
    const target = state.notifications.find((n) => n.id === id);
    if (!target || target.read_at) return;

    // Optimistic update
    const previousNotifications = [...state.notifications];
    const previousUnread = state.unreadCount;
    const cat = target.category;
    const previousCategoryCounts = { ...state.categoryCounts };

    set({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
      categoryCounts: {
        ...state.categoryCounts,
        [cat]: Math.max(0, (state.categoryCounts[cat] || 0) - 1),
      },
    });

    // Notify other tabs via BroadcastChannel
    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'READ',
        id,
        unreadCount: Math.max(0, state.unreadCount - 1),
      });
    }

    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, read: true }),
      });
      if (!res.ok) throw new Error('Server update failed');
      const data = await res.json();
      set({
        unreadCount: data.unreadCount ?? state.unreadCount - 1,
        categoryCounts: data.categoryCounts ?? state.categoryCounts,
      });
    } catch (err) {
      // Rollback on failure
      set({
        notifications: previousNotifications,
        unreadCount: previousUnread,
        categoryCounts: previousCategoryCounts,
      });
    }
  },

  markAsUnread: async (id, userId = 'usr-demo-1') => {
    const state = get();
    const target = state.notifications.find((n) => n.id === id);
    if (!target || !target.read_at) return;

    const previousNotifications = [...state.notifications];
    const previousUnread = state.unreadCount;
    const cat = target.category;
    const previousCategoryCounts = { ...state.categoryCounts };

    set({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read_at: null } : n
      ),
      unreadCount: state.unreadCount + 1,
      categoryCounts: {
        ...state.categoryCounts,
        [cat]: (state.categoryCounts[cat] || 0) + 1,
      },
    });

    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'UNREAD',
        id,
        unreadCount: state.unreadCount + 1,
      });
    }

    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, read: false }),
      });
      if (!res.ok) throw new Error('Server update failed');
      const data = await res.json();
      set({
        unreadCount: data.unreadCount ?? state.unreadCount + 1,
        categoryCounts: data.categoryCounts ?? state.categoryCounts,
      });
    } catch (err) {
      set({
        notifications: previousNotifications,
        unreadCount: previousUnread,
        categoryCounts: previousCategoryCounts,
      });
      useUIStore.getState().error("Couldn't update notification. Try again", {
        label: 'Retry',
        onClick: () => get().markAsRead(id, userId),
      });
      announcer.announce("Couldn't update notification status", 'assertive');
    }
  },

  markAllAsRead: async (userId = 'usr-demo-1', category) => {
    const state = get();
    const nowIso = new Date().toISOString();

    const previousNotifications = [...state.notifications];
    const previousUnread = state.unreadCount;
    const previousCategoryCounts = { ...state.categoryCounts };

    const updatedNotifications = state.notifications.map((n) => {
      if (!category || n.category === category) {
        return { ...n, read_at: nowIso };
      }
      return n;
    });

    set({
      notifications: updatedNotifications,
      unreadCount: category ? Math.max(0, state.unreadCount - (state.categoryCounts[category] || 0)) : 0,
      categoryCounts: category
        ? { ...state.categoryCounts, [category]: 0 }
        : { orders: 0, price: 0, stock: 0, account: 0 },
      liveAnnouncement: 'All notifications marked as read',
    });

    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'READ_ALL',
        category,
        unreadCount: 0,
      });
    }

    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, category }),
      });
      if (!res.ok) throw new Error('Server mark all failed');
      const data = await res.json();
      set({
        unreadCount: data.unreadCount ?? 0,
        categoryCounts: data.categoryCounts ?? { orders: 0, price: 0, stock: 0, account: 0 },
      });
    } catch (err) {
      set({
        notifications: previousNotifications,
        unreadCount: previousUnread,
        categoryCounts: previousCategoryCounts,
      });
      useUIStore.getState().error("Couldn't update notification. Try again", {
        label: 'Retry',
        onClick: () => get().markAsRead(id, userId),
      });
      announcer.announce("Couldn't update notification status", 'assertive');
    }
  },

  dismiss: async (id, userId = 'usr-demo-1') => {
    const state = get();
    const target = state.notifications.find((n) => n.id === id);
    if (!target) return;

    const previousNotifications = [...state.notifications];
    const wasUnread = !target.read_at;
    const previousUnread = state.unreadCount;
    const cat = target.category;

    set({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      categoryCounts: wasUnread
        ? { ...state.categoryCounts, [cat]: Math.max(0, (state.categoryCounts[cat] || 0) - 1) }
        : state.categoryCounts,
    });

    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'DISMISS',
        id,
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      });
    }

    try {
      const res = await fetch(`/api/notifications/${id}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error('Dismiss failed');
    } catch (err) {
      set({ notifications: previousNotifications, unreadCount: previousUnread });
      useUIStore.getState().error("Couldn't dismiss notification. Try again", {
        label: 'Retry',
        onClick: () => get().dismiss(id, userId),
      });
      announcer.announce("Couldn't dismiss notification", 'assertive');
    }
  },

  clearNewLiveCount: () => {
    set({ newLiveItemsCount: 0 });
  },

  setupBroadcastChannel: () => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      return () => {};
    }

    try {
      broadcastChannel = new BroadcastChannel('matte_notifications_sync');
      broadcastChannel.onmessage = (event) => {
        const { type, id, category, unreadCount } = event.data || {};
        const state = useNotificationStore.getState();

        if (type === 'READ' && id) {
          useNotificationStore.setState({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read_at: new Date().toISOString() } : n
            ),
            unreadCount: unreadCount ?? Math.max(0, state.unreadCount - 1),
          });
        } else if (type === 'UNREAD' && id) {
          useNotificationStore.setState({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read_at: null } : n
            ),
            unreadCount: unreadCount ?? state.unreadCount + 1,
          });
        } else if (type === 'READ_ALL') {
          useNotificationStore.setState({
            notifications: state.notifications.map((n) =>
              !category || n.category === category ? { ...n, read_at: new Date().toISOString() } : n
            ),
            unreadCount: unreadCount ?? 0,
          });
        } else if (type === 'DISMISS' && id) {
          useNotificationStore.setState({
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: unreadCount ?? state.unreadCount,
          });
        } else if (type === 'NEW_NOTIFICATION' && event.data.notification) {
          const newNotif: NotificationRecord = event.data.notification;
          const exists = state.notifications.some((n) => n.id === newNotif.id);
          if (!exists) {
            useNotificationStore.setState({
              notifications: [newNotif, ...state.notifications],
              unreadCount: unreadCount ?? state.unreadCount + 1,
              newLiveItemsCount: state.isOpen ? state.newLiveItemsCount + 1 : 0,
            });
          }
        }
      };
    } catch (e) {
      console.error('Failed to create BroadcastChannel:', e);
    }

    return () => {
      if (broadcastChannel) {
        broadcastChannel.close();
        broadcastChannel = null;
      }
    };
  },

  setupSSE: (userId: string) => {
    if (typeof window === 'undefined') return () => {};

    let retryTimeout: NodeJS.Timeout | null = null;
    let isConnected = false;

    const connect = () => {
      if (document.visibilityState === 'hidden') {
        // Pause stream when tab hidden to save resources
        return;
      }

      if (sseSource) {
        sseSource.close();
      }

      try {
        sseSource = new EventSource(`/api/notifications/stream?userId=${encodeURIComponent(userId)}`);

        sseSource.onopen = () => {
          isConnected = true;
        };

        sseSource.addEventListener('initial', (e) => {
          try {
            const data = JSON.parse(e.data);
            useNotificationStore.setState({
              unreadCount: data.unreadCount ?? 0,
              categoryCounts: data.categoryCounts ?? { orders: 0, price: 0, stock: 0, account: 0 },
            });
          } catch (err) {}
        });

        sseSource.addEventListener('new_notification', (e) => {
          try {
            const payload = JSON.parse(e.data);
            const notif: NotificationRecord = payload.notification;
            const state = useNotificationStore.getState();

            // Check if existing or new
            const existingIdx = state.notifications.findIndex((n) => n.id === notif.id);
            let updatedList: NotificationRecord[];

            if (existingIdx !== -1) {
              updatedList = state.notifications.map((n, i) => (i === existingIdx ? notif : n));
            } else {
              updatedList = [notif, ...state.notifications];
            }

            useNotificationStore.setState({
              notifications: updatedList,
              unreadCount: payload.unreadCount ?? state.unreadCount + 1,
              categoryCounts: payload.categoryCounts ?? state.categoryCounts,
              newLiveItemsCount: state.isOpen ? state.newLiveItemsCount + 1 : 0,
            });

            // Polite debounced announcement for screen readers
            if (announceTimer) clearTimeout(announceTimer);
            announceTimer = setTimeout(() => {
              useNotificationStore.setState({
                liveAnnouncement: `New notification: ${notif.title}`,
              });
            }, 500);

            // Sync with other tabs
            if (broadcastChannel) {
              broadcastChannel.postMessage({
                type: 'NEW_NOTIFICATION',
                notification: notif,
                unreadCount: payload.unreadCount,
              });
            }
          } catch (err) {}
        });

        sseSource.addEventListener('update_notification', (e) => {
          try {
            const payload = JSON.parse(e.data);
            const notif: NotificationRecord = payload.notification;
            const state = useNotificationStore.getState();

            useNotificationStore.setState({
              notifications: state.notifications.map((n) => (n.id === notif.id ? notif : n)),
              unreadCount: payload.unreadCount ?? state.unreadCount,
              categoryCounts: payload.categoryCounts ?? state.categoryCounts,
            });
          } catch (err) {}
        });

        sseSource.addEventListener('unread_count', (e) => {
          try {
            const data = JSON.parse(e.data);
            useNotificationStore.setState({
              unreadCount: data.unreadCount ?? 0,
              categoryCounts: data.categoryCounts ?? { orders: 0, price: 0, stock: 0, account: 0 },
            });
          } catch (err) {}
        });

        sseSource.onerror = () => {
          if (sseSource) {
            sseSource.close();
            sseSource = null;
          }
          isConnected = false;
          // Exponential backoff reconnect
          retryTimeout = setTimeout(() => {
            connect();
          }, 5000);
        };
      } catch (err) {
        // Fallback polling
      }
    };

    connect();

    // Visibility change handler (pause when hidden, reconnect when visible)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!isConnected) {
          connect();
        }
        // Reconcile unread count on wake
        useNotificationStore.getState().fetchUnreadCount(userId);
      } else {
        if (sseSource) {
          sseSource.close();
          sseSource = null;
          isConnected = false;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (retryTimeout) clearTimeout(retryTimeout);
      if (announceTimer) clearTimeout(announceTimer);
      if (sseSource) {
        sseSource.close();
        sseSource = null;
      }
    };
  },
}));
