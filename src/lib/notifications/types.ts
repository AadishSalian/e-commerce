/**
 * Notification Center Types & Data Models
 * Truthful, timely, privacy-preserving transactional & watch notifications.
 */

export type NotificationCategory = 'orders' | 'price' | 'stock' | 'account';

export type NotificationType =
  // Order updates
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_out_for_delivery'
  | 'order_delivered'
  | 'order_delayed'
  | 'order_delivery_failed'
  | 'order_return_received'
  | 'order_refund_issued'
  | 'order_action_needed'
  // Price drops
  | 'price_drop'
  | 'price_drop_batch'
  // Restocks
  | 'restock'
  | 'low_stock'
  // Account & security
  | 'account_new_device'
  | 'account_password_changed'
  | 'account_security_change';

export interface NotificationPayload {
  // Order payload fields
  orderId?: string;
  orderNumber?: string;
  orderStatus?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  newEstimate?: string;
  delayReason?: string;
  failureReason?: string;
  actionRequiredType?: 'payment_pending' | 'address_problem' | 'id_verification';
  refundAmountMinor?: number;

  // Product / Price / Stock payload fields
  productId?: string;
  productName?: string;
  productImage?: string;
  variantId?: string;
  variantName?: string;
  variantValue?: string;
  oldPriceMinor?: number;
  newPriceMinor?: number;
  dropAmountMinor?: number;
  currency?: string;
  changeDate?: string;
  stockCount?: number;
  lowStockThreshold?: number;
  isStale?: boolean; // When price changed again or product unavailable
  staleReason?: string; // "Price has changed", "No longer available"

  // Batch items for burst grouping
  batchItems?: Array<{
    productId: string;
    productName: string;
    variantValue?: string;
    oldPriceMinor: number;
    newPriceMinor: number;
    dropAmountMinor: number;
    image: string;
    deepLink: string;
  }>;

  // Account / Security payload fields
  device?: string;
  browser?: string;
  ipLocation?: string;
  securityType?: 'password' | 'email' | 'phone' | 'device';
  securityActionUrl?: string; // "/account/security?action=verify"
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  entity_type: 'order' | 'product' | 'wishlist' | 'account';
  entity_id: string;
  deep_link: string; // validated typed internal route
  payload: NotificationPayload;
  created_at: string; // ISO 8601
  read_at: string | null; // ISO 8601 or null
  dismissed_at: string | null; // ISO 8601 or null
  dedupe_key: string;
  expires_at: string | null; // ISO 8601 or null
}

export interface ChannelSettings {
  in_app: boolean;
  email: boolean;
  push: boolean;
}

export interface NotificationPreferences {
  userId: string;
  categories: {
    orders: boolean;
    price: boolean;
    stock: boolean;
    account: boolean; // Always true, locked on
  };
  channels: {
    orders: ChannelSettings;
    price: ChannelSettings;
    stock: ChannelSettings;
    account: ChannelSettings;
  };
  scope: 'all_wishlist' | 'specific_lists' | 'specific_products';
  specificListIds: string[];
  specificProductIds: string[];
  priceDropThresholdPercent: number; // default 5%
  digestFrequency: 'instant' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string; // e.g. "22:00"
    end: string;   // e.g. "07:00"
  };
  pushDetailedPreviews: boolean; // default false for lock screen privacy
  tabBadgeEnabled: boolean; // default false
  autoMarkReadOnOpen: boolean; // default false
}

export interface NotificationQueryOptions {
  category?: 'all' | NotificationCategory;
  status?: 'all' | 'unread' | 'read';
  cursor?: string;
  limit?: number;
  includeDismissed?: boolean;
}

export interface PaginatedNotificationsResponse {
  notifications: NotificationRecord[];
  unreadCount: number;
  categoryCounts: Record<NotificationCategory, number>;
  totalCount: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SSEEventMessage {
  type: 'initial' | 'new_notification' | 'update_notification' | 'unread_count' | 'ping';
  data: any;
  timestamp: string;
}
