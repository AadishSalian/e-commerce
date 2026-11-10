/**
 * Notification Service
 * Enforces truthful creation, deduplication & collapsing, privacy, rate limiting, and real-time delivery.
 */

import fs from 'fs';
import path from 'path';
import {
  NotificationRecord,
  NotificationPreferences,
  NotificationCategory,
  NotificationType,
  NotificationQueryOptions,
  PaginatedNotificationsResponse,
  NotificationPayload,
} from './types';
import {
  validateDeepLink,
  sanitizeNotificationText,
  isPriceDropSignificant,
  scrubSensitiveDetails,
} from './validation';
import { formatPriceMinor } from '@/lib/price-history/currency';

const DATA_DIR = path.join(process.cwd(), 'data');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');
const PREFERENCES_FILE = path.join(DATA_DIR, 'notification-preferences.json');

const MAX_ITEMS_PER_USER = 200;
const MAX_AGE_DAYS = 90;
const PRICE_DROP_COOLDOWN_DAYS = 7;

let cachedNotifications: NotificationRecord[] | null = null;
let cachedPreferences: Map<string, NotificationPreferences> | null = null;

// Real-time listener registry for SSE streams
type NotificationListener = (event: {
  type: 'new_notification' | 'update_notification' | 'unread_count';
  payload: any;
}) => void;

const userListeners = new Map<string, Set<NotificationListener>>();

export function subscribeUserEvents(userId: string, listener: NotificationListener): () => void {
  if (!userListeners.has(userId)) {
    userListeners.set(userId, new Set());
  }
  userListeners.get(userId)!.add(listener);

  return () => {
    const set = userListeners.get(userId);
    if (set) {
      set.delete(listener);
      if (set.size === 0) {
        userListeners.delete(userId);
      }
    }
  };
}

function broadcastToUser(userId: string, event: {
  type: 'new_notification' | 'update_notification' | 'unread_count';
  payload: any;
}) {
  const listeners = userListeners.get(userId);
  if (listeners) {
    for (const listener of listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error dispatching user notification event:', err);
      }
    }
  }
}

/**
 * Ensures data directory and json files exist.
 */
function ensureDataFiles() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(NOTIFICATIONS_FILE)) {
      const initial = getSeedNotifications();
      fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      cachedNotifications = initial;
    }
    if (!fs.existsSync(PREFERENCES_FILE)) {
      fs.writeFileSync(PREFERENCES_FILE, JSON.stringify({}, null, 2), 'utf-8');
      cachedPreferences = new Map();
    }
  } catch (err) {
    console.error('Failed to ensure notification files:', err);
  }
}

/**
 * Loads all notifications from disk or cache.
 */
export function getAllNotifications(): NotificationRecord[] {
  if (cachedNotifications) return cachedNotifications;
  ensureDataFiles();
  try {
    if (fs.existsSync(NOTIFICATIONS_FILE)) {
      const raw = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
      cachedNotifications = JSON.parse(raw);
      return cachedNotifications || [];
    }
  } catch (err) {
    console.error('Failed to read notifications file:', err);
  }
  cachedNotifications = getSeedNotifications();
  return cachedNotifications;
}

/**
 * Persists all notifications to disk.
 */
export function saveAllNotifications(notifications: NotificationRecord[]): void {
  ensureDataFiles();
  try {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2), 'utf-8');
    cachedNotifications = notifications;
  } catch (err) {
    console.error('Failed to write notifications file:', err);
  }
}

/**
 * Default preferences generator for a given user.
 */
export function getDefaultPreferences(userId: string): NotificationPreferences {
  return {
    userId,
    categories: {
      orders: true,
      price: true,
      stock: true,
      account: true, // Always locked on
    },
    channels: {
      orders: { in_app: true, email: true, push: true },
      price: { in_app: true, email: false, push: false },
      stock: { in_app: true, email: false, push: false },
      account: { in_app: true, email: true, push: true }, // Locked on for transactional & account
    },
    scope: 'all_wishlist',
    specificListIds: [],
    specificProductIds: [],
    priceDropThresholdPercent: 5,
    digestFrequency: 'daily',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00',
    },
    pushDetailedPreviews: false, // Privacy default: generic preview on lock screen
    tabBadgeEnabled: false,      // Quiet by default
    autoMarkReadOnOpen: false,   // Quiet by default: opening panel does not mark read
  };
}

/**
 * Retrieves preferences for a user.
 */
export function getUserPreferences(userId: string): NotificationPreferences {
  if (!cachedPreferences) {
    ensureDataFiles();
    try {
      if (fs.existsSync(PREFERENCES_FILE)) {
        const raw = fs.readFileSync(PREFERENCES_FILE, 'utf-8');
        const obj = JSON.parse(raw);
        cachedPreferences = new Map(Object.entries(obj));
      } else {
        cachedPreferences = new Map();
      }
    } catch (err) {
      cachedPreferences = new Map();
    }
  }

  const existing = cachedPreferences.get(userId);
  if (existing) return existing;

  const defaults = getDefaultPreferences(userId);
  cachedPreferences.set(userId, defaults);
  saveAllPreferences(cachedPreferences);
  return defaults;
}

/**
 * Updates preferences for a user.
 */
export function updateUserPreferences(
  userId: string,
  partial: Partial<NotificationPreferences>
): NotificationPreferences {
  const current = getUserPreferences(userId);

  const updated: NotificationPreferences = {
    ...current,
    ...partial,
    categories: {
      ...current.categories,
      ...(partial.categories || {}),
      account: true, // Account category cannot be turned off
    },
    channels: {
      orders: {
        ...current.channels.orders,
        ...(partial.channels?.orders || {}),
        email: true, // Essential order transactional emails cannot be muted
      },
      price: {
        ...current.channels.price,
        ...(partial.channels?.price || {}),
      },
      stock: {
        ...current.channels.stock,
        ...(partial.channels?.stock || {}),
      },
      account: {
        in_app: true,
        email: true,
        push: partial.channels?.account?.push ?? current.channels.account.push,
      },
    },
  };

  cachedPreferences?.set(userId, updated);
  saveAllPreferences(cachedPreferences || new Map([[userId, updated]]));

  // Trigger unread count recalculation for the user (since category toggle changes count)
  broadcastToUser(userId, {
    type: 'unread_count',
    payload: {
      unreadCount: getUnreadCount(userId),
      categoryCounts: getCategoryCounts(userId),
    },
  });

  return updated;
}

function saveAllPreferences(map: Map<string, NotificationPreferences>): void {
  ensureDataFiles();
  try {
    const obj = Object.fromEntries(map.entries());
    fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write preferences file:', err);
  }
}

/**
 * Computes unread count for a user across enabled categories only.
 */
export function getUnreadCount(userId: string): number {
  const prefs = getUserPreferences(userId);
  const items = getAllNotifications();

  return items.filter((n) => {
    if (n.user_id !== userId) return false;
    if (n.dismissed_at) return false;
    if (n.read_at) return false;

    // Suppress if category is disabled in user preferences or in_app channel disabled
    if (!prefs.categories[n.category]) return false;
    if (!prefs.channels[n.category]?.in_app) return false;

    // Check expiration
    if (n.expires_at && new Date(n.expires_at).getTime() < Date.now()) return false;

    return true;
  }).length;
}

/**
 * Computes unread counts per category.
 */
export function getCategoryCounts(userId: string): Record<NotificationCategory, number> {
  const prefs = getUserPreferences(userId);
  const items = getAllNotifications();

  const counts: Record<NotificationCategory, number> = {
    orders: 0,
    price: 0,
    stock: 0,
    account: 0,
  };

  for (const n of items) {
    if (n.user_id !== userId) continue;
    if (n.dismissed_at) continue;
    if (n.read_at) continue;
    if (!prefs.categories[n.category]) continue;
    if (!prefs.channels[n.category]?.in_app) continue;
    if (n.expires_at && new Date(n.expires_at).getTime() < Date.now()) continue;

    counts[n.category] = (counts[n.category] || 0) + 1;
  }

  return counts;
}

/**
 * Retrieves paginated notifications for a user respecting category filters and preferences.
 */
export function getUserNotifications(
  userId: string,
  options: NotificationQueryOptions = {}
): PaginatedNotificationsResponse {
  const prefs = getUserPreferences(userId);
  const all = getAllNotifications();

  const now = Date.now();
  const maxRetentionDate = now - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  // Filter to user and enabled preferences
  let filtered = all.filter((n) => {
    if (n.user_id !== userId) return false;

    // Retention check (within 90 days)
    const createdAtMs = new Date(n.created_at).getTime();
    if (createdAtMs < maxRetentionDate) return false;

    // Expiration check
    if (n.expires_at && new Date(n.expires_at).getTime() < now) return false;

    // Hide dismissed unless explicitly requested
    if (!options.includeDismissed && n.dismissed_at) return false;

    // Preference suppression: hide in-app items for categories user disabled
    if (!prefs.categories[n.category] || !prefs.channels[n.category]?.in_app) {
      return false;
    }

    // Category filter
    if (options.category && options.category !== 'all' && n.category !== options.category) {
      return false;
    }

    // Read/Unread status filter
    if (options.status === 'unread' && n.read_at !== null) return false;
    if (options.status === 'read' && n.read_at === null) return false;

    return true;
  });

  // Sort newest first
  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Cursor-based pagination
  const limit = options.limit || 20;
  let startIndex = 0;

  if (options.cursor) {
    const cursorIdx = filtered.findIndex((it) => it.id === options.cursor);
    if (cursorIdx !== -1) {
      startIndex = cursorIdx + 1;
    }
  }

  const pagedItems = filtered.slice(startIndex, startIndex + limit);
  const nextCursor = startIndex + limit < filtered.length ? pagedItems[pagedItems.length - 1]?.id || null : null;
  const hasMore = nextCursor !== null;

  return {
    notifications: pagedItems,
    unreadCount: getUnreadCount(userId),
    categoryCounts: getCategoryCounts(userId),
    totalCount: filtered.length,
    nextCursor,
    hasMore,
  };
}

/**
 * Marks a notification as read.
 */
export function markNotificationRead(userId: string, notificationId: string): boolean {
  const all = getAllNotifications();
  const item = all.find((n) => n.id === notificationId && n.user_id === userId);
  if (!item) return false;

  if (!item.read_at) {
    item.read_at = new Date().toISOString();
    saveAllNotifications(all);

    broadcastToUser(userId, {
      type: 'update_notification',
      payload: {
        notification: item,
        unreadCount: getUnreadCount(userId),
        categoryCounts: getCategoryCounts(userId),
      },
    });
  }

  return true;
}

/**
 * Marks a notification as unread.
 */
export function markNotificationUnread(userId: string, notificationId: string): boolean {
  const all = getAllNotifications();
  const item = all.find((n) => n.id === notificationId && n.user_id === userId);
  if (!item) return false;

  item.read_at = null;
  saveAllNotifications(all);

  broadcastToUser(userId, {
    type: 'update_notification',
    payload: {
      notification: item,
      unreadCount: getUnreadCount(userId),
      categoryCounts: getCategoryCounts(userId),
    },
  });

  return true;
}

/**
 * Marks all notifications as read for a user (optionally scoped to a category).
 */
export function markAllNotificationsRead(userId: string, category?: NotificationCategory): number {
  const all = getAllNotifications();
  const nowIso = new Date().toISOString();
  let count = 0;

  for (const item of all) {
    if (item.user_id === userId && !item.read_at && !item.dismissed_at) {
      if (!category || item.category === category) {
        item.read_at = nowIso;
        count++;
      }
    }
  }

  if (count > 0) {
    saveAllNotifications(all);
    broadcastToUser(userId, {
      type: 'unread_count',
      payload: {
        unreadCount: getUnreadCount(userId),
        categoryCounts: getCategoryCounts(userId),
      },
    });
  }

  return count;
}

/**
 * Dismisses a notification (soft delete from active feed).
 */
export function dismissNotification(userId: string, notificationId: string): boolean {
  const all = getAllNotifications();
  const item = all.find((n) => n.id === notificationId && n.user_id === userId);
  if (!item) return false;

  item.dismissed_at = new Date().toISOString();
  saveAllNotifications(all);

  broadcastToUser(userId, {
    type: 'unread_count',
    payload: {
      unreadCount: getUnreadCount(userId),
      categoryCounts: getCategoryCounts(userId),
    },
  });

  return true;
}

/**
 * Clears all notifications for a user (history purge).
 */
export function clearAllNotifications(userId: string): number {
  const all = getAllNotifications();
  const nowIso = new Date().toISOString();
  let count = 0;

  for (const item of all) {
    if (item.user_id === userId && !item.dismissed_at) {
      item.dismissed_at = nowIso;
      count++;
    }
  }

  if (count > 0) {
    saveAllNotifications(all);
    broadcastToUser(userId, {
      type: 'unread_count',
      payload: {
        unreadCount: 0,
        categoryCounts: { orders: 0, price: 0, stock: 0, account: 0 },
      },
    });
  }

  return count;
}

// -------------------------------------------------------------
// EVENT HANDLERS & NOTIFICATION CREATION (SERVER-SIDE ONLY)
// -------------------------------------------------------------

/**
 * Creates or updates an Order notification.
 * Evolving deduplication: Shipped -> Out for delivery -> Delivered evolves the single entry for the order!
 */
export function createOrderNotification(params: {
  userId: string;
  orderId: string;
  type: NotificationType;
  carrier?: string;
  trackingNumber?: string;
  newEstimate?: string;
  delayReason?: string;
  failureReason?: string;
  actionRequiredType?: 'payment_pending' | 'address_problem';
  refundAmountMinor?: number;
}): NotificationRecord {
  const { userId, orderId, type } = params;
  const all = getAllNotifications();
  const dedupeKey = `order:${orderId}`;

  // Build truthful title and body
  let title = `Order #${orderId}`;
  let body = '';

  switch (type) {
    case 'order_confirmed':
      title = `Order #${orderId} confirmed`;
      body = 'Your order has been received and verified by our workshop.';
      break;
    case 'order_shipped':
      title = `Order #${orderId} has shipped`;
      body = params.carrier
        ? `Arriving ${params.newEstimate || 'soon'} via ${params.carrier}`
        : 'Your package is on its way with the carrier.';
      break;
    case 'order_out_for_delivery':
      title = `Order #${orderId} is out for delivery`;
      body = params.carrier
        ? `Expected today with your ${params.carrier} courier.`
        : 'Your package is scheduled for delivery today.';
      break;
    case 'order_delivered':
      title = `Order #${orderId} delivered`;
      body = 'Delivered to your shipping address. Enjoy your craftsmanship.';
      break;
    case 'order_delayed':
      title = `Order #${orderId} delay update`;
      body = params.delayReason && params.newEstimate
        ? `${params.delayReason} · New delivery estimate: ${params.newEstimate}`
        : `Updated delivery estimate: ${params.newEstimate || 'Revised schedule soon'}`;
      break;
    case 'order_delivery_failed':
      title = `Delivery attempt failed for #${orderId}`;
      body = 'The carrier could not complete delivery. A second attempt will follow.';
      break;
    case 'order_return_received':
      title = `Return received for #${orderId}`;
      body = 'Our workshop has inspected the returned items. Processing resolution.';
      break;
    case 'order_refund_issued':
      const amountStr = params.refundAmountMinor ? formatPriceMinor(params.refundAmountMinor) : '';
      title = `Refund issued for #${orderId}`;
      body = amountStr
        ? `Refund of ${amountStr} has been credited to your original payment method.`
        : 'Refund credited to your original payment method.';
      break;
    case 'order_action_needed':
      title = `Action needed on #${orderId}`;
      body = params.actionRequiredType === 'address_problem'
        ? 'Please confirm your apartment or landmark with dispatch.'
        : 'Payment authorization requires your review.';
      break;
  }

  const payload: NotificationPayload = {
    orderId,
    orderNumber: orderId,
    carrier: params.carrier,
    trackingNumber: params.trackingNumber,
    newEstimate: params.newEstimate,
    delayReason: params.delayReason,
    failureReason: params.failureReason,
    actionRequiredType: params.actionRequiredType,
    refundAmountMinor: params.refundAmountMinor,
  };

  const deepLink = validateDeepLink(`/checkout/success?orderId=${orderId}`);

  // Check for existing evolving notification
  const existingIdx = all.findIndex((n) => n.user_id === userId && n.dedupe_key === dedupeKey);
  const nowIso = new Date().toISOString();

  let resultRecord: NotificationRecord;

  if (existingIdx !== -1) {
    // Evolve existing notification
    const existing = all[existingIdx];
    existing.type = type;
    existing.title = sanitizeNotificationText(title, 60);
    existing.body = scrubSensitiveDetails(sanitizeNotificationText(body, 120));
    existing.payload = payload;
    existing.created_at = nowIso;
    existing.read_at = null; // Mark as unread so user is alerted to the latest status change
    existing.dismissed_at = null;
    resultRecord = existing;
  } else {
    // Create new
    resultRecord = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      user_id: userId,
      type,
      category: 'orders',
      title: sanitizeNotificationText(title, 60),
      body: scrubSensitiveDetails(sanitizeNotificationText(body, 120)),
      entity_type: 'order',
      entity_id: orderId,
      deep_link: deepLink,
      payload,
      created_at: nowIso,
      read_at: null,
      dismissed_at: null,
      dedupe_key: dedupeKey,
      expires_at: null,
    };
    all.unshift(resultRecord);
  }

  saveAllNotifications(all);

  broadcastToUser(userId, {
    type: 'new_notification',
    payload: {
      notification: resultRecord,
      unreadCount: getUnreadCount(userId),
      categoryCounts: getCategoryCounts(userId),
    },
  });

  return resultRecord;
}

/**
 * Creates a truthful Price Drop notification.
 * Enforces >= 5% drop threshold, 7-day cooldown, and exact price history rules.
 */
export function createPriceDropNotification(params: {
  userId: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantValue?: string;
  oldPriceMinor: number;
  newPriceMinor: number;
  currency?: string;
  productImage?: string;
  wishlistName?: string;
}): NotificationRecord | null {
  const {
    userId,
    productId,
    productName,
    variantId,
    variantValue,
    oldPriceMinor,
    newPriceMinor,
    currency = 'INR',
    productImage,
    wishlistName,
  } = params;

  const prefs = getUserPreferences(userId);
  const threshold = prefs.priceDropThresholdPercent || 5;

  // Enforce meaningful threshold
  if (!isPriceDropSignificant(oldPriceMinor, newPriceMinor, threshold)) {
    return null;
  }

  const all = getAllNotifications();
  const dedupeKey = `price:${productId}:${variantId || 'base'}:${newPriceMinor}`;
  const nowMs = Date.now();
  const cooldownMs = PRICE_DROP_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

  // Check 7-day cooldown on this product/variant
  const recentDrop = all.find((n) => {
    if (n.user_id !== userId || n.category !== 'price') return false;
    if (n.entity_id !== productId) return false;
    if (n.payload.variantId !== variantId) return false;
    const itemTime = new Date(n.created_at).getTime();
    return nowMs - itemTime < cooldownMs;
  });

  if (recentDrop) {
    const prevNewPrice = recentDrop.payload.newPriceMinor || Infinity;
    // Only allow if price fell strictly further
    if (newPriceMinor >= prevNewPrice) {
      return null;
    }
  }

  const dropAmountMinor = oldPriceMinor - newPriceMinor;
  const newPriceStr = formatPriceMinor(newPriceMinor, currency);
  const dropAmountStr = formatPriceMinor(dropAmountMinor, currency);

  let title = `Price drop: ${productName}`;
  if (variantValue) {
    title = `Price drop: ${productName} (${variantValue})`;
  }

  let body = `Now ${newPriceStr} (dropped ${dropAmountStr})`;
  if (wishlistName) {
    body += ` · On your ${sanitizeNotificationText(wishlistName, 20)} list`;
  }

  const deepLink = validateDeepLink(
    `/products/${productId}${variantId ? `?variant=${variantId}` : ''}`
  );

  const newRecord: NotificationRecord = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    user_id: userId,
    type: 'price_drop',
    category: 'price',
    title: sanitizeNotificationText(title, 60),
    body: sanitizeNotificationText(body, 120),
    entity_type: 'product',
    entity_id: productId,
    deep_link: deepLink,
    payload: {
      productId,
      productName,
      productImage,
      variantId,
      variantValue,
      oldPriceMinor,
      newPriceMinor,
      dropAmountMinor,
      currency,
      changeDate: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
    read_at: null,
    dismissed_at: null,
    dedupe_key: dedupeKey,
    expires_at: null,
  };

  all.unshift(newRecord);
  saveAllNotifications(all);

  broadcastToUser(userId, {
    type: 'new_notification',
    payload: {
      notification: newRecord,
      unreadCount: getUnreadCount(userId),
      categoryCounts: getCategoryCounts(userId),
    },
  });

  return newRecord;
}

/**
 * Creates a truthful Restock notification.
 * Fired only when availability genuinely flips from unavailable (0) to available (>0).
 */
export function createRestockNotification(params: {
  userId: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantValue?: string;
  stockCount: number;
  productImage?: string;
}): NotificationRecord | null {
  const { userId, productId, productName, variantId, variantValue, stockCount, productImage } = params;

  if (stockCount <= 0) return null;

  const all = getAllNotifications();
  const dedupeKey = `restock:${productId}:${variantId || 'base'}`;
  const nowMs = Date.now();
  const cooldownMs = 24 * 60 * 60 * 1000; // 24h hysteresis

  // Check hysteresis
  const existingRecent = all.find(
    (n) => n.user_id === userId && n.dedupe_key === dedupeKey && nowMs - new Date(n.created_at).getTime() < cooldownMs
  );
  if (existingRecent) return null;

  const title = `${productName} is back in stock`;
  const body = variantValue
    ? `${variantValue} is back in stock and ready to dispatch.`
    : 'Now available in stock and ready to dispatch.';

  const deepLink = validateDeepLink(`/products/${productId}${variantId ? `?variant=${variantId}` : ''}`);

  const record: NotificationRecord = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    user_id: userId,
    type: 'restock',
    category: 'stock',
    title: sanitizeNotificationText(title, 60),
    body: sanitizeNotificationText(body, 120),
    entity_type: 'product',
    entity_id: productId,
    deep_link: deepLink,
    payload: {
      productId,
      productName,
      productImage,
      variantId,
      variantValue,
      stockCount,
    },
    created_at: new Date().toISOString(),
    read_at: null,
    dismissed_at: null,
    dedupe_key: dedupeKey,
    expires_at: null,
  };

  all.unshift(record);
  saveAllNotifications(all);

  broadcastToUser(userId, {
    type: 'new_notification',
    payload: {
      notification: record,
      unreadCount: getUnreadCount(userId),
      categoryCounts: getCategoryCounts(userId),
    },
  });

  return record;
}

/**
 * Creates an Account & Security notification.
 * Always-on, unmutable, high trust.
 */
export function createAccountNotification(params: {
  userId: string;
  type: 'account_new_device' | 'account_password_changed' | 'account_security_change';
  device?: string;
  browser?: string;
  ipLocation?: string;
  securityType?: 'password' | 'email' | 'phone' | 'device';
}): NotificationRecord {
  const { userId, type, device, browser, ipLocation, securityType } = params;
  const all = getAllNotifications();

  let title = 'Account security notice';
  let body = 'A change was made to your account.';

  switch (type) {
    case 'account_new_device':
      title = `New sign-in from ${browser || 'browser'} on ${device || 'device'}`;
      body = ipLocation
        ? `${ipLocation} · If this wasn't you, review your account security.`
        : 'If this was not you, protect your account immediately.';
      break;
    case 'account_password_changed':
      title = 'Password successfully changed';
      body = 'Your password was updated. If you did not initiate this, contact support.';
      break;
    case 'account_security_change':
      title = 'Security preferences updated';
      body = `Your ${securityType || 'account'} settings were updated.`;
      break;
  }

  const record: NotificationRecord = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    user_id: userId,
    type,
    category: 'account',
    title: sanitizeNotificationText(title, 60),
    body: scrubSensitiveDetails(sanitizeNotificationText(body, 120)),
    entity_type: 'account',
    entity_id: userId,
    deep_link: validateDeepLink('/account'),
    payload: {
      device,
      browser,
      ipLocation,
      securityType,
      securityActionUrl: '/account',
    },
    created_at: new Date().toISOString(),
    read_at: null,
    dismissed_at: null,
    dedupe_key: `account:${type}:${Date.now()}`,
    expires_at: null,
  };

  all.unshift(record);
  saveAllNotifications(all);

  broadcastToUser(userId, {
    type: 'new_notification',
    payload: {
      notification: record,
      unreadCount: getUnreadCount(userId),
      categoryCounts: getCategoryCounts(userId),
    },
  });

  return record;
}

/**
 * Groups a burst of price drops into a consolidated batch notification.
 */
export function batchPriceDrops(
  userId: string,
  drops: Array<{
    productId: string;
    productName: string;
    variantValue?: string;
    oldPriceMinor: number;
    newPriceMinor: number;
    image: string;
  }>
): NotificationRecord | null {
  if (drops.length < 2) return null;

  const all = getAllNotifications();
  const count = drops.length;
  const title = `${count} items on your wishlists dropped in price`;
  const firstItem = drops[0];
  const secondItem = drops[1];
  const body = count === 2
    ? `${firstItem.productName} and ${secondItem.productName} have dropped.`
    : `${firstItem.productName}, ${secondItem.productName}, and ${count - 2} more have dropped.`;

  const batchItems = drops.map((d) => ({
    productId: d.productId,
    productName: d.productName,
    variantValue: d.variantValue,
    oldPriceMinor: d.oldPriceMinor,
    newPriceMinor: d.newPriceMinor,
    dropAmountMinor: d.oldPriceMinor - d.newPriceMinor,
    image: d.image,
    deepLink: `/products/${d.productId}`,
  }));

  const record: NotificationRecord = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    user_id: userId,
    type: 'price_drop_batch',
    category: 'price',
    title: sanitizeNotificationText(title, 60),
    body: sanitizeNotificationText(body, 120),
    entity_type: 'wishlist',
    entity_id: 'batch',
    deep_link: validateDeepLink('/wishlist'),
    payload: {
      batchItems,
    },
    created_at: new Date().toISOString(),
    read_at: null,
    dismissed_at: null,
    dedupe_key: `batch_price_${Date.now()}`,
    expires_at: null,
  };

  all.unshift(record);
  saveAllNotifications(all);

  broadcastToUser(userId, {
    type: 'new_notification',
    payload: {
      notification: record,
      unreadCount: getUnreadCount(userId),
      categoryCounts: getCategoryCounts(userId),
    },
  });

  return record;
}

/**
 * Initial seed notifications for demo user (matching actual orders and products).
 */
export function getSeedNotifications(): NotificationRecord[] {
  const baseTime = Date.now();
  const twoHoursAgo = new Date(baseTime - 2 * 60 * 60 * 1000).toISOString();
  const yesterday = new Date(baseTime - 26 * 60 * 60 * 1000).toISOString();
  const threeDaysAgo = new Date(baseTime - 3 * 24 * 60 * 60 * 1000).toISOString();
  const fiveDaysAgo = new Date(baseTime - 5 * 24 * 60 * 60 * 1000).toISOString();

  const demoUserId = 'usr-demo-1';

  return [
    {
      id: 'notif_seed_order_1',
      user_id: demoUserId,
      type: 'order_shipped',
      category: 'orders',
      title: 'Order #ORD-948271 has shipped',
      body: 'Arriving Thu 12 Nov to Fri 13 Nov via BlueDart Express',
      entity_type: 'order',
      entity_id: 'ORD-948271',
      deep_link: '/checkout/success?orderId=ORD-948271&token=7f9a8b1c4d2e3f4a5b6c7d8e9f0a1b2c',
      payload: {
        orderId: 'ORD-948271',
        orderNumber: 'ORD-948271',
        carrier: 'BlueDart Express',
        trackingNumber: 'BLR78491029',
        trackingUrl: 'https://track.bluedart.com/?track=BLR78491029',
        newEstimate: 'Thu 12 Nov – Fri 13 Nov',
        productImage: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=400&auto=format&fit=crop',
      },
      created_at: twoHoursAgo,
      read_at: null,
      dismissed_at: null,
      dedupe_key: 'order:ORD-948271',
      expires_at: null,
    },
    {
      id: 'notif_seed_price_1',
      user_id: demoUserId,
      type: 'price_drop',
      category: 'price',
      title: 'Price drop: Matte Keyboard 1',
      body: 'Now ₹249 (dropped ₹40) · Saved on your Studio Wishlist',
      entity_type: 'product',
      entity_id: 't-1',
      deep_link: '/products/t-1?variant=v-1',
      payload: {
        productId: 't-1',
        productName: 'Matte Keyboard 1',
        productImage: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=400&auto=format&fit=crop',
        variantId: 'v-1',
        variantValue: 'Matte Black',
        oldPriceMinor: 28900,
        newPriceMinor: 24900,
        dropAmountMinor: 4000,
        currency: 'INR',
        changeDate: yesterday,
      },
      created_at: yesterday,
      read_at: null,
      dismissed_at: null,
      dedupe_key: 'price:t-1:v-1:24900',
      expires_at: null,
    },
    {
      id: 'notif_seed_stock_1',
      user_id: demoUserId,
      type: 'restock',
      category: 'stock',
      title: 'Ceramic Earbuds is back in stock',
      body: 'Graphite is back in stock and ready to dispatch.',
      entity_type: 'product',
      entity_id: 't-2',
      deep_link: '/products/t-2',
      payload: {
        productId: 't-2',
        productName: 'Ceramic Earbuds',
        productImage: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=400&auto=format&fit=crop',
        variantValue: 'Graphite',
        stockCount: 12,
      },
      created_at: threeDaysAgo,
      read_at: threeDaysAgo,
      dismissed_at: null,
      dedupe_key: 'restock:t-2:base',
      expires_at: null,
    },
    {
      id: 'notif_seed_sec_1',
      user_id: demoUserId,
      type: 'account_new_device',
      category: 'account',
      title: 'New sign-in from Chrome on macOS',
      body: 'Bengaluru, India · If this wasn’t you, review your account security.',
      entity_type: 'account',
      entity_id: demoUserId,
      deep_link: '/account',
      payload: {
        device: 'MacBook Pro',
        browser: 'Chrome 128',
        ipLocation: 'Bengaluru, India',
        securityType: 'device',
        securityActionUrl: '/account',
      },
      created_at: fiveDaysAgo,
      read_at: fiveDaysAgo,
      dismissed_at: null,
      dedupe_key: 'account:device:seed_1',
      expires_at: null,
    },
  ];
}
