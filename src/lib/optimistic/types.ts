/**
 * Core type definitions for the Optimistic UI Layer.
 * Adheres to:
 * - Server is single source of truth.
 * - Idempotency keys for every mutation.
 * - Reversible low-risk actions vs non-reversible actions.
 * - Authoritative reconciliation for price shifts, stock caps, and inventory loss.
 */

export type OptimisticResource = 'cart' | 'wishlist' | 'compare' | 'notifications';

export type OptimisticActionType =
  | 'cart_add'
  | 'cart_remove'
  | 'cart_update_quantity'
  | 'cart_clear'
  | 'cart_apply_saved_coupon'
  | 'wishlist_toggle'
  | 'wishlist_add'
  | 'wishlist_remove'
  | 'wishlist_move'
  | 'wishlist_reorder'
  | 'compare_add'
  | 'compare_remove'
  | 'notification_mark_read'
  | 'notification_mark_unread'
  | 'notification_dismiss'
  | 'notification_mark_all_read';

export type MutationStatus =
  | 'pending'
  | 'syncing'
  | 'slow_syncing'
  | 'applied'
  | 'failed'
  | 'rolled_back';

export type OptimisticErrorType =
  | 'network'
  | 'timeout'
  | 'stock_capped'
  | 'out_of_stock'
  | 'price_changed'
  | 'conflict'
  | 'rate_limited'
  | 'unauthorized'
  | 'validation'
  | 'unknown';

export interface OptimisticError {
  type: OptimisticErrorType;
  message: string;
  statusCode?: number;
  retryable: boolean;
  originalError?: any;
  serverData?: any;
}

export interface OptimisticMutation<TPayload = any, TSnapshot = any> {
  id: string; // Internal mutation ID
  idempotencyKey: string; // UUID sent to server
  resource: OptimisticResource;
  action: OptimisticActionType;
  payload: TPayload;
  snapshot?: TSnapshot; // Confirmed state snapshot before mutation for clean rollback
  status: MutationStatus;
  createdAt: number;
  lastAttemptAt?: number;
  attemptCount: number;
  error?: OptimisticError;
  versionPrecondition?: number;
  sequenceNumber?: number;
  temporaryId?: string; // e.g. "temp_cart_xyz"
}

export type ReconciliationType =
  | 'price_updated'
  | 'quantity_capped'
  | 'item_unavailable'
  | 'cart_merged'
  | 'free_shipping_shifted'
  | 'coupon_recalculated';

export interface ReconciliationNotice {
  id: string;
  type: ReconciliationType;
  title: string;
  message: string;
  lineId?: string;
  productId?: string;
  productName?: string;
  oldValue?: number | string;
  newValue?: number | string;
  timestamp: number;
  actionLabel?: string;
  actionHref?: string;
  dismissed?: boolean;
}

export interface OptimisticFeatureFlags {
  optimisticCart: boolean;
  optimisticWishlist: boolean;
  optimisticCompare: boolean;
  optimisticNotifications: boolean;
  offlineQueueEnabled: boolean;
  coalesceDebounceMs: number;
  requestTimeoutMs: number;
  slowSyncThresholdMs: number;
  maxRetryAttempts: number;
}

export interface TelemetryMetrics {
  totalMutations: number;
  successfulMutations: number;
  failedMutations: number;
  rolledBackMutations: number;
  retriedMutations: number;
  averageConfirmationMs: number;
  reconciliationDiffsByType: Record<ReconciliationType, number>;
  rollbacksByReason: Record<OptimisticErrorType, number>;
}

export interface CrossTabMessage {
  type:
    | 'OPTIMISTIC_MUTATION_APPLIED'
    | 'OPTIMISTIC_MUTATION_CONFIRMED'
    | 'OPTIMISTIC_MUTATION_ROLLED_BACK'
    | 'SERVER_STATE_UPDATED'
    | 'OUTBOX_SYNC_REQUESTED';
  sourceTabId: string;
  resource: OptimisticResource;
  payload: any;
  timestamp: number;
}
