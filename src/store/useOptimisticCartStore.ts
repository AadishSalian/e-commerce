'use client';

/**
 * Optimistic Cart Store
 *
 * Implements Section 2, 3, 4, 5, 6, 7 & 11:
 * - Server state (confirmed cart) + Optimistic overlay (pending mutations)
 * - Under-100ms instant tap response
 * - Per-resource serialized queue with coalescing & exponential backoff retry
 * - Idempotency key per mutation
 * - Authoritative reconciliation (price changes, stock caps, out-of-stock removals)
 * - In-place line error retry rows & dismissals
 * - Offline outbox queue & automatic reconnection sync
 * - Multi-tab BroadcastChannel synchronization
 * - Privacy-safe telemetry and screen reader announcements
 */

import { create } from 'zustand';
import { Product, MOCK_PRODUCTS } from '@/lib/mockData';
import { SelectedEmiPlan } from '@/lib/emi/types';
import { calculateEmi, formatEmiCurrency } from '@/lib/emi/calculator';
import { PersonalizationCartProperty } from '@/lib/personalization/types';
import {
  OptimisticMutation,
  ReconciliationNotice,
  OptimisticError,
} from '@/lib/optimistic/types';
import {
  generateIdempotencyKey,
  generateTemporaryId,
  isTemporaryId,
} from '@/lib/optimistic/idempotency';
import { OptimisticQueue } from '@/lib/optimistic/queue';
import { outbox } from '@/lib/optimistic/outbox';
import { broadcaster } from '@/lib/optimistic/broadcast';
import { announcer } from '@/lib/optimistic/announcer';
import { useUIStore } from './useUIStore';
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from '@/config/shipping';

export interface OptimisticCartItem extends Product {
  cartId: string; // Temporary ID (e.g. "temp_xyz") or Server Line ID ("line_123")
  quantity: number;
  selectedVariant?: string;
  selectedEmiPlan?: SelectedEmiPlan;
  personalization?: PersonalizationCartProperty;
  addedAt?: string;
  addedPrice?: number;
  isOptimistic?: boolean;
  isSyncingSlow?: boolean;
  inlineError?: {
    message: string;
    retryable: boolean;
  } | null;
  reconciliationNote?: string | null;
}

export function getItemUnitPrice(item: Pick<OptimisticCartItem, 'price' | 'personalization'>): number {
  const base = item.price;
  const addon = item.personalization?.isPersonalized
    ? item.personalization.price_addon / 100
    : 0;
  return base + addon;
}

export interface OptimisticCartState {
  // Server-confirmed state
  serverItems: OptimisticCartItem[];
  serverVersion: number;

  // Active Optimistic Overlay (pending mutations)
  pendingMutations: Map<string, OptimisticMutation>;
  failedMutations: Map<string, { mutation: OptimisticMutation; error: OptimisticError }>;
  reconciliationNotices: ReconciliationNotice[];

  // Computed displayed items: serverItems + optimistic overlay
  cartItems: OptimisticCartItem[];
  cartEmiPlan: SelectedEmiPlan | null;
  emiNotification: string | null;

  // Derived totals
  subtotal: number;
  shipping: number;
  isFreeShipping: boolean;
  total: number;

  // Status & Connectivity
  isOnline: boolean;
  isSyncing: boolean;
  isCheckoutGated: boolean;
  pendingMutationCount: number;

  // Actions
  addToCart: (
    product: Product,
    quantity: number,
    selectedVariant?: string,
    selectedEmiPlan?: SelectedEmiPlan,
    personalization?: PersonalizationCartProperty
  ) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  setQuantity: (cartId: string, quantity: number) => void;
  removeFromCart: (cartId: string) => void;
  clearCart: () => void;
  retryFailedMutation: (cartId: string) => void;
  dismissFailedMutation: (cartId: string) => void;
  dismissNotice: (noticeId: string) => void;
  flushPending: () => Promise<void>;
  syncOutboxToServer: () => Promise<void>;
  setCartEmiPlan: (plan: SelectedEmiPlan | null) => void;
  setEmiNotification: (msg: string | null) => void;
}

function computeTotals(items: OptimisticCartItem[]) {
  const subtotal = items.reduce(
    (acc, item) => acc + getItemUnitPrice(item) * item.quantity,
    0
  );
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = subtotal > 0 ? (isFreeShipping ? 0 : STANDARD_SHIPPING_FEE) : 0;
  const total = subtotal + shipping;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    shipping,
    isFreeShipping,
    total: Math.round(total * 100) / 100,
  };
}

// Queue execution instance
let cartQueue: OptimisticQueue | null = null;

function getCartQueue(): OptimisticQueue {
  if (!cartQueue) {
    cartQueue = new OptimisticQueue(
      'cart',
      async (mutation, signal) => {
        // Send mutation to server API
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: mutation.action === 'cart_add'
              ? 'add'
              : mutation.action === 'cart_update_quantity'
              ? 'update_quantity'
              : mutation.action === 'cart_remove'
              ? 'remove'
              : mutation.action === 'cart_clear'
              ? 'clear'
              : mutation.action,
            idempotencyKey: mutation.idempotencyKey,
            versionPrecondition: mutation.versionPrecondition,
            item: mutation.payload,
          }),
          signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const error: any = new Error(data.error || 'Server rejected mutation');
          error.statusCode = res.status;
          error.serverData = data;
          throw error;
        }

        return await res.json();
      },
      {
        onOptimisticApply: (mutation) => {
          // Handled synchronously in store action
        },
        onSuccess: (mutation, result) => {
          useOptimisticCartStore.getState().handleMutationSuccess(mutation, result);
        },
        onRollback: (mutation, error) => {
          useOptimisticCartStore.getState().handleMutationRollback(mutation, error);
        },
        onSlowSyncWarning: (mutation) => {
          useOptimisticCartStore.getState().handleSlowSync(mutation);
        },
      }
    );
  }
  return cartQueue;
}

interface InternalStoreState extends OptimisticCartState {
  handleMutationSuccess: (mutation: OptimisticMutation, result: any) => void;
  handleMutationRollback: (mutation: OptimisticMutation, error: OptimisticError) => void;
  handleSlowSync: (mutation: OptimisticMutation) => void;
  setOnline: (isOnline: boolean) => void;
}

export const useOptimisticCartStore = create<InternalStoreState>((set, get) => {
  // Setup offline/online listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      get().setOnline(true);
      get().syncOutboxToServer();
    });
    window.addEventListener('offline', () => {
      get().setOnline(false);
    });

    // Cross-tab sync
    broadcaster.subscribe((msg) => {
      if (msg.resource === 'cart') {
        if (msg.type === 'SERVER_STATE_UPDATED' && msg.payload?.cart) {
          const serverItems: OptimisticCartItem[] = msg.payload.cart.items.map((i: any) => ({
            ...i,
            cartId: i.id,
          }));
          const totals = computeTotals(serverItems);
          set({
            serverItems,
            cartItems: serverItems,
            serverVersion: msg.payload.cart.version || get().serverVersion + 1,
            ...totals,
          });
        }
      }
    });
  }

  return {
    serverItems: [],
    serverVersion: 1,
    pendingMutations: new Map(),
    failedMutations: new Map(),
    reconciliationNotices: [],
    cartItems: [],
    cartEmiPlan: null,
    emiNotification: null,
    subtotal: 0,
    shipping: 0,
    isFreeShipping: false,
    total: 0,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    isCheckoutGated: false,
    pendingMutationCount: 0,

    setOnline: (isOnline) => set({ isOnline }),

    setCartEmiPlan: (plan) => set({ cartEmiPlan: plan }),
    setEmiNotification: (msg) => set({ emiNotification: msg }),

    addToCart: (product, quantity, selectedVariant, selectedEmiPlan, personalization) => {
      const state = get();
      const tempId = generateTemporaryId('temp');
      const idempotencyKey = generateIdempotencyKey('cart_add');

      // 1. Snapshot previous state for clean rollback
      const snapshot = [...state.cartItems];

      // 2. Compute optimistic line item
      const existingItem = state.cartItems.find(
        (i) =>
          i.id === product.id &&
          i.selectedVariant === selectedVariant &&
          JSON.stringify(i.personalization || null) === JSON.stringify(personalization || null)
      );

      let newItems: OptimisticCartItem[];
      if (existingItem) {
        newItems = state.cartItems.map((item) =>
          item.cartId === existingItem.cartId
            ? {
                ...item,
                quantity: item.quantity + quantity,
                isOptimistic: true,
                selectedEmiPlan: selectedEmiPlan || item.selectedEmiPlan,
              }
            : item
        );
      } else {
        const newLine: OptimisticCartItem = {
          ...product,
          cartId: tempId,
          quantity,
          selectedVariant,
          selectedEmiPlan,
          personalization: personalization?.isPersonalized ? personalization : undefined,
          addedAt: new Date().toISOString(),
          addedPrice: product.price,
          isOptimistic: true,
        };
        newItems = [...state.cartItems, newLine];
      }

      const totals = computeTotals(newItems);
      const mutation: OptimisticMutation = {
        id: generateIdempotencyKey('mut'),
        idempotencyKey,
        resource: 'cart',
        action: 'cart_add',
        payload: {
          productId: product.id,
          quantity,
          selectedVariant,
          selectedEmiPlan,
          personalization,
          clientKnownPrice: product.price,
          cartId: tempId,
        },
        snapshot,
        status: 'pending',
        createdAt: Date.now(),
        attemptCount: 0,
        temporaryId: tempId,
        versionPrecondition: state.serverVersion,
      };

      const updatedPending = new Map(state.pendingMutations);
      updatedPending.set(mutation.idempotencyKey, mutation);

      // Instant optimistic state application (<100ms)
      set({
        cartItems: newItems,
        pendingMutations: updatedPending,
        isSyncing: true,
        isCheckoutGated: true,
        pendingMutationCount: updatedPending.size,
        ...totals,
      });

      // Accessible polite announcement (debounced)
      announcer.announce(`${product.name} added to bag, ${newItems.reduce((acc, i) => acc + i.quantity, 0)} items`, 'polite');

      // Dispatch to per-resource serialized queue
      getCartQueue().enqueue(mutation);
    },

    updateQuantity: (cartId, delta) => {
      const state = get();
      const target = state.cartItems.find((i) => i.cartId === cartId);
      if (!target) return;

      const newQty = Math.max(1, target.quantity + delta);
      state.setQuantity(cartId, newQty);
    },

    setQuantity: (cartId, quantity) => {
      const state = get();
      const target = state.cartItems.find((i) => i.cartId === cartId);
      if (!target) return;

      const snapshot = [...state.cartItems];
      const newItems = state.cartItems.map((item) =>
        item.cartId === cartId
          ? { ...item, quantity, isOptimistic: true, inlineError: null }
          : item
      );

      const totals = computeTotals(newItems);
      const idempotencyKey = generateIdempotencyKey(`qty_${cartId}`);

      const mutation: OptimisticMutation = {
        id: generateIdempotencyKey('mut'),
        idempotencyKey,
        resource: 'cart',
        action: 'cart_update_quantity',
        payload: {
          cartId,
          productId: target.id,
          selectedVariant: target.selectedVariant,
          quantity,
        },
        snapshot,
        status: 'pending',
        createdAt: Date.now(),
        attemptCount: 0,
        versionPrecondition: state.serverVersion,
      };

      const updatedPending = new Map(state.pendingMutations);
      updatedPending.set(mutation.idempotencyKey, mutation);

      set({
        cartItems: newItems,
        pendingMutations: updatedPending,
        isSyncing: true,
        isCheckoutGated: true,
        pendingMutationCount: updatedPending.size,
        ...totals,
      });

      announcer.announce(`${target.name} quantity updated to ${quantity}`, 'polite');

      getCartQueue().enqueue(mutation);
    },

    removeFromCart: (cartId) => {
      const state = get();
      const target = state.cartItems.find((i) => i.cartId === cartId);
      if (!target) return;

      const snapshot = [...state.cartItems];
      const newItems = state.cartItems.filter((item) => item.cartId !== cartId);
      const totals = computeTotals(newItems);
      const idempotencyKey = generateIdempotencyKey(`rem_${cartId}`);

      const mutation: OptimisticMutation = {
        id: generateIdempotencyKey('mut'),
        idempotencyKey,
        resource: 'cart',
        action: 'cart_remove',
        payload: {
          cartId,
          productId: target.id,
          selectedVariant: target.selectedVariant,
        },
        snapshot,
        status: 'pending',
        createdAt: Date.now(),
        attemptCount: 0,
        versionPrecondition: state.serverVersion,
      };

      const updatedPending = new Map(state.pendingMutations);
      updatedPending.set(mutation.idempotencyKey, mutation);

      set({
        cartItems: newItems,
        pendingMutations: updatedPending,
        isSyncing: true,
        isCheckoutGated: true,
        pendingMutationCount: updatedPending.size,
        ...totals,
      });

      announcer.announce(`${target.name} removed from bag`, 'polite');

      getCartQueue().enqueue(mutation);
    },

    clearCart: () => {
      const state = get();
      const snapshot = [...state.cartItems];
      const idempotencyKey = generateIdempotencyKey('cart_clear');

      const mutation: OptimisticMutation = {
        id: generateIdempotencyKey('mut'),
        idempotencyKey,
        resource: 'cart',
        action: 'cart_clear',
        payload: {},
        snapshot,
        status: 'pending',
        createdAt: Date.now(),
        attemptCount: 0,
        versionPrecondition: state.serverVersion,
      };

      set({
        cartItems: [],
        subtotal: 0,
        shipping: 0,
        isFreeShipping: false,
        total: 0,
      });

      getCartQueue().enqueue(mutation);
    },

    handleMutationSuccess: (mutation, result) => {
      const state = get();
      const updatedPending = new Map(state.pendingMutations);
      updatedPending.delete(mutation.idempotencyKey);

      // Clean up any failed state for this item
      const updatedFailed = new Map(state.failedMutations);
      if (mutation.payload?.cartId) {
        updatedFailed.delete(mutation.payload.cartId);
      }

      // Reconcile server response
      if (result && result.cart) {
        const serverCart = result.cart;
        const newServerItems: OptimisticCartItem[] = serverCart.items.map((i: any) => ({
          ...i,
          cartId: i.id,
          isOptimistic: false,
          isSyncingSlow: false,
          inlineError: null,
        }));

        // Handle reconciliation notices
        const notices = [...state.reconciliationNotices];
        if (result.reconciliationNotices && Array.isArray(result.reconciliationNotices)) {
          notices.push(...result.reconciliationNotices);
        }

        const totals = computeTotals(newServerItems);

        set({
          serverItems: newServerItems,
          cartItems: newServerItems,
          serverVersion: serverCart.version || state.serverVersion + 1,
          pendingMutations: updatedPending,
          failedMutations: updatedFailed,
          reconciliationNotices: notices,
          isSyncing: updatedPending.size > 0,
          isCheckoutGated: updatedPending.size > 0,
          pendingMutationCount: updatedPending.size,
          ...totals,
        });

        // Broadcast to other tabs
        broadcaster.post('SERVER_STATE_UPDATED', 'cart', { cart: serverCart });
      } else {
        set({
          pendingMutations: updatedPending,
          failedMutations: updatedFailed,
          isSyncing: updatedPending.size > 0,
          isCheckoutGated: updatedPending.size > 0,
          pendingMutationCount: updatedPending.size,
        });
      }
    },

    handleMutationRollback: (mutation, error) => {
      const state = get();
      const updatedPending = new Map(state.pendingMutations);
      updatedPending.delete(mutation.idempotencyKey);

      const targetId = mutation.payload?.cartId || mutation.temporaryId;
      const updatedFailed = new Map(state.failedMutations);

      // Roll back to prior snapshot
      const restoredItems: OptimisticCartItem[] = mutation.snapshot ? [...mutation.snapshot] : [...state.serverItems];

      // For quantity update failure: mark the affected line with in-place retry row
      if (mutation.action === 'cart_update_quantity' && targetId) {
        updatedFailed.set(targetId, { mutation, error });
        const lineWithErr = restoredItems.find((i) => i.cartId === targetId);
        if (lineWithErr) {
          lineWithErr.inlineError = {
            message: "Couldn't update. Retry",
            retryable: error.retryable,
          };
        }
      }

      const totals = computeTotals(restoredItems);

      // Human-readable gentle failure message
      const productName = mutation.payload?.productName || (mutation.payload?.productId ? MOCK_PRODUCTS.find(p => p.id === mutation.payload.productId)?.name : null) || 'item';
      let toastMessage = `Couldn't add ${productName}. Try again`;
      if (error.type === 'stock_capped' || error.type === 'out_of_stock') {
        toastMessage = `${productName} is currently out of stock.`;
      } else if (error.type === 'network' && !state.isOnline) {
        toastMessage = "We're having trouble connecting. Your changes will be saved when you're back online.";
      }

      useUIStore.getState().error(toastMessage, {
        label: 'Try again',
        onClick: () => {
          get().retryFailedMutation(targetId || mutation.idempotencyKey);
        },
      });

      announcer.announce(toastMessage, 'assertive');

      set({
        cartItems: restoredItems,
        pendingMutations: updatedPending,
        failedMutations: updatedFailed,
        isSyncing: updatedPending.size > 0,
        isCheckoutGated: updatedPending.size > 0,
        pendingMutationCount: updatedPending.size,
        ...totals,
      });
    },

    handleSlowSync: (mutation) => {
      const targetId = mutation.payload?.cartId || mutation.temporaryId;
      if (!targetId) return;

      const items = get().cartItems.map((item) =>
        item.cartId === targetId ? { ...item, isSyncingSlow: true } : item
      );
      set({ cartItems: items });
    },

    retryFailedMutation: (cartId) => {
      const state = get();
      const failed = state.failedMutations.get(cartId);
      if (!failed) return;

      const updatedFailed = new Map(state.failedMutations);
      updatedFailed.delete(cartId);

      // Clear inline error from item
      const items = state.cartItems.map((item) =>
        item.cartId === cartId ? { ...item, inlineError: null } : item
      );

      set({ failedMutations: updatedFailed, cartItems: items });

      // Re-enqueue mutation with the exact same idempotency key
      getCartQueue().enqueue(failed.mutation);
    },

    dismissFailedMutation: (cartId) => {
      const state = get();
      const updatedFailed = new Map(state.failedMutations);
      updatedFailed.delete(cartId);

      const items = state.cartItems.map((item) =>
        item.cartId === cartId ? { ...item, inlineError: null } : item
      );
      set({ failedMutations: updatedFailed, cartItems: items });
    },

    dismissNotice: (noticeId) => {
      set((state) => ({
        reconciliationNotices: state.reconciliationNotices.filter((n) => n.id !== noticeId),
      }));
    },

    flushPending: async () => {
      getCartQueue().flushAllDebounced();
      // Poll briefly if any mutations are in flight
      let safetyCount = 0;
      while (getCartQueue().hasPending() && safetyCount < 30) {
        await new Promise((res) => setTimeout(res, 100));
        safetyCount++;
      }
    },

    syncOutboxToServer: async () => {
      const queuedItems = outbox.getItemsForResource('cart');
      if (queuedItems.length === 0) return;

      try {
        const res = await fetch('/api/cart/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mutations: queuedItems }),
        });

        if (res.ok) {
          const data = await res.json();
          outbox.clear();
          if (data.cart) {
            const serverItems = data.cart.items.map((i: any) => ({
              ...i,
              cartId: i.id,
            }));
            const totals = computeTotals(serverItems);
            set({
              serverItems,
              cartItems: serverItems,
              serverVersion: data.cart.version || get().serverVersion + 1,
              reconciliationNotices: [
                ...get().reconciliationNotices,
                ...(data.reconciliationNotices || []),
              ],
              ...totals,
            });
          }
        }
      } catch (err) {
        console.error('Failed to sync offline outbox', err);
      }
    },
  };
});
