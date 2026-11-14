/**
 * Authoritative Server-Side Cart Service
 * Single source of truth for:
 * - Line item identification (real line IDs)
 * - Prices and currency calculations
 * - Real-time inventory & stock caps
 * - Precondition versioning
 * - Idempotency replay cache
 * - Outbox synchronization
 */

import { MOCK_PRODUCTS, Product } from '@/lib/mockData';
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from '@/config/shipping';
import {
  ServerCart,
  ServerCartLineItem,
  CartMutationRequest,
  CartMutationResponse,
} from './types';
import { ReconciliationNotice } from '@/lib/optimistic/types';
import { generateUUID } from '@/lib/optimistic/idempotency';

// In-memory persistent cart store (keyed by userId or guestToken)
const serverCarts = new Map<string, ServerCart>();

// Idempotency cache: key -> cached response (persisted for deduplication)
const idempotencyCache = new Map<
  string,
  { response: CartMutationResponse; expiresAt: number }
>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function getItemUnitPrice(item: Pick<ServerCartLineItem, 'price' | 'personalization'>): number {
  const base = item.price;
  const addon = item.personalization?.isPersonalized
    ? item.personalization.price_addon / 100
    : 0;
  return base + addon;
}

export function calculateCartTotals(cart: ServerCart): ServerCart {
  const subtotal = cart.items.reduce(
    (sum, item) => sum + getItemUnitPrice(item) * item.quantity,
    0
  );

  let discountAmount = 0;
  if (cart.appliedCoupon) {
    discountAmount = Math.round(subtotal * (cart.appliedCoupon.discountPercent / 100) * 100) / 100;
    cart.appliedCoupon.discountAmount = discountAmount;
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const isFreeShipping = discountedSubtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = discountedSubtotal > 0 ? (isFreeShipping ? 0 : STANDARD_SHIPPING_FEE) : 0;
  const total = discountedSubtotal + shipping;

  cart.subtotal = Math.round(subtotal * 100) / 100;
  cart.shipping = shipping;
  cart.isFreeShipping = isFreeShipping;
  cart.total = Math.round(total * 100) / 100;

  return cart;
}

export function getOrCreateCart(cartKey: string, userId?: string, guestToken?: string): ServerCart {
  let cart = serverCarts.get(cartKey);
  if (!cart) {
    cart = {
      id: `cart_${generateUUID().slice(0, 8)}`,
      userId,
      guestToken,
      version: 1,
      updatedAt: Date.now(),
      items: [],
      subtotal: 0,
      shipping: 0,
      isFreeShipping: false,
      total: 0,
      appliedCoupon: null,
    };
    serverCarts.set(cartKey, cart);
  }
  return cart;
}

export class CartService {
  /**
   * Retrieves the current authoritative cart
   */
  static getCart(userId?: string, guestToken?: string): ServerCart {
    const key = userId ? `user_${userId}` : `guest_${guestToken || 'default'}`;
    const cart = getOrCreateCart(key, userId, guestToken);
    return calculateCartTotals(cart);
  }

  /**
   * Executes a cart mutation with idempotency, concurrency preconditions, and reconciliation
   */
  static executeMutation(request: CartMutationRequest): CartMutationResponse {
    const { idempotencyKey, action, userId, guestToken, versionPrecondition, item } = request;

    // 1. Idempotency Check: if this exact key was processed before, return cached response
    if (idempotencyKey) {
      const cached = idempotencyCache.get(idempotencyKey);
      if (cached && cached.expiresAt > Date.now()) {
        return {
          ...cached.response,
          idempotencyReplayed: true,
        };
      }
    }

    const key = userId ? `user_${userId}` : `guest_${guestToken || 'default'}`;
    const cart = getOrCreateCart(key, userId, guestToken);
    const reconciliationNotices: ReconciliationNotice[] = [];
    let realLineId: string | undefined;

    // 2. Precondition check for stale updates
    if (
      versionPrecondition !== undefined &&
      versionPrecondition > 0 &&
      cart.version > versionPrecondition + 1
    ) {
      // Stale update detected: cart has moved ahead
      const res: CartMutationResponse = {
        success: false,
        cart: calculateCartTotals(cart),
        reconciliationNotices: [
          {
            id: `notice_${generateUUID()}`,
            type: 'cart_merged',
            title: 'Cart Updated',
            message: 'Your bag was updated in another window. We have synchronized your current items.',
            timestamp: Date.now(),
          },
        ],
        error: 'Stale version precondition',
      };
      return res;
    }

    // 3. Process Action
    if (action === 'add' && item) {
      const product = MOCK_PRODUCTS.find((p) => p.id === item.productId);
      if (!product) {
        return {
          success: false,
          cart: calculateCartTotals(cart),
          reconciliationNotices: [],
          error: 'Product not found',
        };
      }

      // Check stock availability
      const availableStock = product.stockCount !== undefined ? product.stockCount : 999;
      if (availableStock <= 0) {
        return {
          success: false,
          cart: calculateCartTotals(cart),
          reconciliationNotices: [
            {
              id: `notice_${generateUUID()}`,
              type: 'item_unavailable',
              title: 'Out of Stock',
              message: `${product.name} is currently out of stock.`,
              productId: product.id,
              productName: product.name,
              timestamp: Date.now(),
              actionLabel: 'See other finishes',
            },
          ],
          error: `${product.name} is out of stock`,
        };
      }

      // Reconcile requested quantity with stock limits
      let requestedQty = item.quantity;
      if (requestedQty > availableStock) {
        reconciliationNotices.push({
          id: `notice_${generateUUID()}`,
          type: 'quantity_capped',
          title: 'Quantity Adjusted',
          message: `Only ${availableStock} available. We've updated your quantity.`,
          productId: product.id,
          productName: product.name,
          oldValue: requestedQty,
          newValue: availableStock,
          timestamp: Date.now(),
        });
        requestedQty = availableStock;
      }

      // Reconcile price shifts
      const confirmedPrice = product.price;
      if (item.clientKnownPrice !== undefined && item.clientKnownPrice !== confirmedPrice) {
        reconciliationNotices.push({
          id: `notice_${generateUUID()}`,
          type: 'price_updated',
          title: 'Price Updated',
          message: `Price updated to $${confirmedPrice.toFixed(2)}`,
          productId: product.id,
          productName: product.name,
          oldValue: item.clientKnownPrice,
          newValue: confirmedPrice,
          timestamp: Date.now(),
        });
      }

      // Check if identical line already exists
      const existingIndex = cart.items.findIndex(
        (line) =>
          line.productId === item.productId &&
          line.selectedVariant === item.selectedVariant &&
          JSON.stringify(line.personalization || null) ===
            JSON.stringify(item.personalization || null)
      );

      if (existingIndex >= 0) {
        const existing = cart.items[existingIndex];
        const newQty = Math.min(existing.quantity + requestedQty, availableStock);
        if (newQty < existing.quantity + requestedQty) {
          reconciliationNotices.push({
            id: `notice_${generateUUID()}`,
            type: 'quantity_capped',
            title: 'Stock Limit Reached',
            message: `Maximum available quantity (${availableStock}) reached for ${product.name}.`,
            productId: product.id,
            productName: product.name,
            timestamp: Date.now(),
          });
        }
        existing.quantity = newQty;
        existing.price = confirmedPrice;
        realLineId = existing.id;
      } else {
        const lineId = `line_${generateUUID().slice(0, 10)}`;
        const newLine: ServerCartLineItem = {
          id: lineId,
          productId: product.id,
          name: product.name,
          price: confirmedPrice,
          image: product.image,
          category: product.category,
          quantity: requestedQty,
          selectedVariant: item.selectedVariant,
          selectedEmiPlan: item.selectedEmiPlan,
          personalization: item.personalization,
          addedAt: new Date().toISOString(),
          addedPrice: confirmedPrice,
          availableStock,
          isAvailable: true,
        };
        cart.items.push(newLine);
        realLineId = lineId;
      }

      cart.version++;
      cart.updatedAt = Date.now();
    } else if (action === 'update_quantity' && item) {
      // Find line item by ID or matching product/variant
      const targetIndex = cart.items.findIndex(
        (line) =>
          line.id === item.cartId ||
          (line.productId === item.productId && line.selectedVariant === item.selectedVariant)
      );

      if (targetIndex >= 0) {
        const line = cart.items[targetIndex];
        const product = MOCK_PRODUCTS.find((p) => p.id === line.productId);
        const availableStock = product?.stockCount !== undefined ? product.stockCount : 999;

        if (item.quantity <= 0) {
          cart.items.splice(targetIndex, 1);
        } else {
          let finalQty = item.quantity;
          if (finalQty > availableStock) {
            reconciliationNotices.push({
              id: `notice_${generateUUID()}`,
              type: 'quantity_capped',
              title: 'Quantity Adjusted',
              message: `Only ${availableStock} available. We've updated your quantity.`,
              productId: line.productId,
              productName: line.name,
              oldValue: item.quantity,
              newValue: availableStock,
              timestamp: Date.now(),
            });
            finalQty = availableStock;
          }
          line.quantity = finalQty;
          realLineId = line.id;
        }

        cart.version++;
        cart.updatedAt = Date.now();
      }
    } else if (action === 'remove' && item) {
      const targetIndex = cart.items.findIndex(
        (line) =>
          line.id === item.cartId ||
          (line.productId === item.productId && line.selectedVariant === item.selectedVariant)
      );

      if (targetIndex >= 0) {
        cart.items.splice(targetIndex, 1);
        cart.version++;
        cart.updatedAt = Date.now();
      }
    } else if (action === 'clear') {
      cart.items = [];
      cart.appliedCoupon = null;
      cart.version++;
      cart.updatedAt = Date.now();
    } else if (action === 'apply_coupon' && request.couponCode) {
      const code = request.couponCode.toUpperCase().trim();
      if (code === 'MATTE10') {
        cart.appliedCoupon = { code: 'MATTE10', discountPercent: 10, discountAmount: 0 };
        cart.version++;
        cart.updatedAt = Date.now();
      } else {
        return {
          success: false,
          cart: calculateCartTotals(cart),
          reconciliationNotices: [],
          error: 'Invalid coupon code',
        };
      }
    } else if (action === 'remove_coupon') {
      cart.appliedCoupon = null;
      cart.version++;
      cart.updatedAt = Date.now();
    }

    const updatedCart = calculateCartTotals(cart);

    const response: CartMutationResponse = {
      success: true,
      cart: updatedCart,
      realLineId,
      reconciliationNotices,
    };

    // Store in idempotency cache
    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, {
        response,
        expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
      });
    }

    return response;
  }

  /**
   * Merges a guest cart into a user cart on sign-in
   */
  static mergeGuestCart(guestToken: string, userId: string): { cart: ServerCart; notice: ReconciliationNotice | null } {
    const guestCart = serverCarts.get(`guest_${guestToken}`);
    const userCart = getOrCreateCart(`user_${userId}`, userId);

    if (!guestCart || guestCart.items.length === 0) {
      return { cart: calculateCartTotals(userCart), notice: null };
    }

    let mergedCount = 0;
    for (const guestItem of guestCart.items) {
      const existing = userCart.items.find(
        (i) =>
          i.productId === guestItem.productId &&
          i.selectedVariant === guestItem.selectedVariant &&
          JSON.stringify(i.personalization || null) === JSON.stringify(guestItem.personalization || null)
      );

      if (existing) {
        existing.quantity += guestItem.quantity;
      } else {
        userCart.items.push({
          ...guestItem,
          id: `line_${generateUUID().slice(0, 10)}`,
        });
      }
      mergedCount += guestItem.quantity;
    }

    userCart.version++;
    userCart.updatedAt = Date.now();
    serverCarts.delete(`guest_${guestToken}`);

    const notice: ReconciliationNotice = {
      id: `notice_${generateUUID()}`,
      type: 'cart_merged',
      title: 'Bag Merged',
      message: 'We merged your saved bag with your account.',
      timestamp: Date.now(),
    };

    return { cart: calculateCartTotals(userCart), notice };
  }

  /**
   * Batch flushes outbox mutations in sequential order
   */
  static syncOutbox(mutations: CartMutationRequest[]): { cart: ServerCart; notices: ReconciliationNotice[] } {
    let latestCart: ServerCart | null = null;
    const allNotices: ReconciliationNotice[] = [];

    for (const req of mutations) {
      const res = this.executeMutation(req);
      latestCart = res.cart;
      if (res.reconciliationNotices) {
        allNotices.push(...res.reconciliationNotices);
      }
    }

    return {
      cart: latestCart || this.getCart(),
      notices: allNotices,
    };
  }

  /**
   * Resets all server carts (useful for tests)
   */
  static reset(): void {
    serverCarts.clear();
    idempotencyCache.clear();
  }
}
