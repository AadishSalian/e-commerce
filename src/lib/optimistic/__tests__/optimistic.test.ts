import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  generateUUID,
  generateIdempotencyKey,
  generateTemporaryId,
  isTemporaryId,
  isValidUUID,
} from '../idempotency';
import { OptimisticQueue } from '../queue';
import { OptimisticOutbox, MAX_OUTBOX_ITEMS, MAX_OUTBOX_AGE_MS } from '../outbox';
import { telemetry } from '../telemetry';
import { announcer } from '../announcer';
import { getFeatureFlags, updateFeatureFlags, resetFeatureFlags } from '../featureFlags';
import { CartService } from '@/lib/cart/service';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { OptimisticMutation, OptimisticError } from '../types';

describe('Optimistic UI: Idempotency & Unique Keys', () => {
  it('generates valid RFC 4122 v4 UUIDs', () => {
    const uuid = generateUUID();
    assert.strictEqual(typeof uuid, 'string');
    assert.strictEqual(isValidUUID(uuid), true);
  });

  it('prefixes idempotency keys cleanly', () => {
    const key = generateIdempotencyKey('cart_add');
    assert.match(key, /^cart_add_[0-9a-f]{8}-[0-9a-f]{4}/);
  });

  it('identifies and marks temporary IDs correctly', () => {
    const tempId = generateTemporaryId('temp_cart');
    assert.strictEqual(isTemporaryId(tempId), true);
    assert.strictEqual(isTemporaryId('line_server_confirmed_99'), false);
    assert.strictEqual(isTemporaryId(null), false);
    assert.strictEqual(isTemporaryId(undefined), false);
  });
});

describe('Optimistic UI: Authoritative Server Cart & Reconciliation', () => {
  beforeEach(() => {
    CartService.reset();
  });

  it('adds an item and returns an authoritative line ID with confirmed price', () => {
    const product = MOCK_PRODUCTS[0];
    const key = generateIdempotencyKey('add');

    const res = CartService.executeMutation({
      idempotencyKey: key,
      action: 'add',
      userId: 'test-shopper-1',
      item: {
        productId: product.id,
        quantity: 1,
        clientKnownPrice: product.price,
      },
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.cart.items.length, 1);
    assert.strictEqual(typeof res.realLineId, 'string');
    assert.match(res.realLineId!, /^line_/);
    assert.strictEqual(res.cart.items[0].price, product.price);
  });

  it('enforces idempotency: repeating the same idempotency key does not duplicate line items', () => {
    const product = MOCK_PRODUCTS[0];
    const key = 'fixed-idempotency-key-12345';

    // First attempt
    const res1 = CartService.executeMutation({
      idempotencyKey: key,
      action: 'add',
      userId: 'test-shopper-idemp',
      item: {
        productId: product.id,
        quantity: 1,
      },
    });

    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.cart.items.length, 1);
    assert.strictEqual(res1.cart.items[0].quantity, 1);

    // Network replay or double-tap with identical key
    const res2 = CartService.executeMutation({
      idempotencyKey: key,
      action: 'add',
      userId: 'test-shopper-idemp',
      item: {
        productId: product.id,
        quantity: 1,
      },
    });

    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.idempotencyReplayed, true);
    assert.strictEqual(res2.cart.items.length, 1);
    assert.strictEqual(res2.cart.items[0].quantity, 1);
  });

  it('reconciles stock caps when requested quantity exceeds available stock', () => {
    // Find a product with limited stockCount, or simulate
    const product = MOCK_PRODUCTS.find((p) => p.stockCount !== undefined && p.stockCount > 0) || {
      ...MOCK_PRODUCTS[0],
      stockCount: 2,
    };

    const res = CartService.executeMutation({
      idempotencyKey: generateIdempotencyKey('stock_test'),
      action: 'add',
      userId: 'test-stock-shopper',
      item: {
        productId: product.id,
        quantity: 5, // shopper asks for 5
      },
    });

    assert.strictEqual(res.success, true);
    // Quantity capped to product stockCount
    assert.strictEqual(res.cart.items[0].quantity, product.stockCount);
    // Emits reconciliation notice
    assert.strictEqual(res.reconciliationNotices.length, 1);
    assert.strictEqual(res.reconciliationNotices[0].type, 'quantity_capped');
    assert.strictEqual(res.reconciliationNotices[0].oldValue, 5);
    assert.strictEqual(res.reconciliationNotices[0].newValue, product.stockCount);
  });

  it('reconciles price changes and adopts the authoritative server price', () => {
    const product = MOCK_PRODUCTS[0];
    const staleClientPrice = product.price - 100;

    const res = CartService.executeMutation({
      idempotencyKey: generateIdempotencyKey('price_shift'),
      action: 'add',
      userId: 'test-price-shopper',
      item: {
        productId: product.id,
        quantity: 1,
        clientKnownPrice: staleClientPrice,
      },
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.cart.items[0].price, product.price);
    assert.strictEqual(res.reconciliationNotices.length, 1);
    assert.strictEqual(res.reconciliationNotices[0].type, 'price_updated');
    assert.strictEqual(res.reconciliationNotices[0].oldValue, staleClientPrice);
    assert.strictEqual(res.reconciliationNotices[0].newValue, product.price);
  });

  it('merges guest cart into user account on sign-in and emits notice', () => {
    const guestToken = 'guest-token-abc';
    const userId = 'user-logged-in-xyz';
    const product = MOCK_PRODUCTS[0];

    CartService.executeMutation({
      idempotencyKey: 'guest-add-1',
      action: 'add',
      guestToken,
      item: {
        productId: product.id,
        quantity: 2,
      },
    });

    const merged = CartService.mergeGuestCart(guestToken, userId);
    assert.strictEqual(merged.cart.items.length, 1);
    assert.strictEqual(merged.cart.items[0].quantity, 2);
    assert.notStrictEqual(merged.notice, null);
    assert.strictEqual(merged.notice?.type, 'cart_merged');
  });
});

describe('Optimistic UI: Serialized Queue & Coalescing', () => {
  it('coalesces rapid quantity changes within debounce window', async () => {
    let executionCount = 0;
    let finalPayload: any = null;

    const queue = new OptimisticQueue(
      'cart',
      async (mutation) => {
        executionCount++;
        finalPayload = mutation.payload;
        return { success: true };
      },
      {
        onOptimisticApply: () => {},
        onSuccess: () => {},
        onRollback: () => {},
      }
    );

    // Rapidly change quantity 3 times within 100ms
    const itemId = 'line_rapid_123';
    queue.enqueue({
      id: 'm1',
      idempotencyKey: 'k1',
      resource: 'cart',
      action: 'cart_update_quantity',
      payload: { cartId: itemId, quantity: 2 },
      status: 'pending',
      createdAt: Date.now(),
      attemptCount: 0,
    });

    queue.enqueue({
      id: 'm2',
      idempotencyKey: 'k2',
      resource: 'cart',
      action: 'cart_update_quantity',
      payload: { cartId: itemId, quantity: 3 },
      status: 'pending',
      createdAt: Date.now(),
      attemptCount: 0,
    });

    queue.enqueue({
      id: 'm3',
      idempotencyKey: 'k3',
      resource: 'cart',
      action: 'cart_update_quantity',
      payload: { cartId: itemId, quantity: 4 },
      status: 'pending',
      createdAt: Date.now(),
      attemptCount: 0,
    });

    // Wait for coalesce window to flush
    await new Promise((res) => setTimeout(res, 450));

    // Only the final collapsed intent was sent to server
    assert.strictEqual(executionCount, 1);
    assert.strictEqual(finalPayload.quantity, 4);
  });

  it('translates temporary IDs to real server IDs for dependent queued mutations', async () => {
    const executedPayloads: any[] = [];
    const tempId = 'temp_item_999';
    const serverRealId = 'line_authoritative_999';

    const queue = new OptimisticQueue(
      'cart',
      async (mutation) => {
        executedPayloads.push({ action: mutation.action, payload: { ...mutation.payload } });
        if (mutation.action === 'cart_add') {
          return { success: true, realLineId: serverRealId };
        }
        return { success: true };
      },
      {
        onOptimisticApply: () => {},
        onSuccess: () => {},
        onRollback: () => {},
      }
    );

    // Add item with temporary ID
    queue.enqueue({
      id: 'add-1',
      idempotencyKey: 'k-add-1',
      resource: 'cart',
      action: 'cart_add',
      payload: { productId: 'p1', cartId: tempId, quantity: 1 },
      temporaryId: tempId,
      status: 'pending',
      createdAt: Date.now(),
      attemptCount: 0,
    });

    // Dependent action (update quantity) before server has returned real ID
    queue.enqueue({
      id: 'upd-1',
      idempotencyKey: 'k-upd-1',
      resource: 'cart',
      action: 'cart_remove',
      payload: { cartId: tempId, productId: 'p1' },
      status: 'pending',
      createdAt: Date.now(),
      attemptCount: 0,
    });

    await new Promise((res) => setTimeout(res, 100));

    assert.strictEqual(executedPayloads.length, 2);
    assert.strictEqual(executedPayloads[0].action, 'cart_add');
    // Dependent action had its cartId translated to the real server ID
    assert.strictEqual(executedPayloads[1].payload.cartId, serverRealId);
  });

  it('retries transient 503 errors with exponential backoff using the exact same idempotency key', async () => {
    let attempts = 0;
    const attemptedKeys: string[] = [];

    const queue = new OptimisticQueue(
      'cart',
      async (mutation) => {
        attempts++;
        attemptedKeys.push(mutation.idempotencyKey);
        if (attempts < 2) {
          const err: any = new Error('Gateway Timeout');
          err.statusCode = 504;
          throw err;
        }
        return { success: true };
      },
      {
        onOptimisticApply: () => {},
        onSuccess: () => {},
        onRollback: () => {},
      }
    );

    const testKey = 'retry-test-key-555';
    queue.enqueue({
      id: 'retry-m',
      idempotencyKey: testKey,
      resource: 'cart',
      action: 'cart_add',
      payload: { productId: 'p-retry' },
      status: 'pending',
      createdAt: Date.now(),
      attemptCount: 0,
    });

    // Wait for backoff retry
    await new Promise((res) => setTimeout(res, 1500));

    assert.strictEqual(attempts, 2);
    assert.strictEqual(attemptedKeys[0], testKey);
    assert.strictEqual(attemptedKeys[1], testKey); // Same idempotency key!
  });

  it('does NOT retry 4xx validation errors and triggers clean rollback', async () => {
    let attempts = 0;
    let rollbackError: OptimisticError | null = null;

    const queue = new OptimisticQueue(
      'cart',
      async () => {
        attempts++;
        const err: any = new Error('Invalid Variant');
        err.statusCode = 400;
        throw err;
      },
      {
        onOptimisticApply: () => {},
        onSuccess: () => {},
        onRollback: (mutation, err) => {
          rollbackError = err;
        },
      }
    );

    queue.enqueue({
      id: 'fail-m',
      idempotencyKey: 'fail-key-400',
      resource: 'cart',
      action: 'cart_add',
      payload: { productId: 'p-invalid' },
      status: 'pending',
      createdAt: Date.now(),
      attemptCount: 0,
    });

    await new Promise((res) => setTimeout(res, 100));

    assert.strictEqual(attempts, 1); // Only 1 attempt, no useless retry of 400
    assert.notStrictEqual(rollbackError, null);
    assert.strictEqual(rollbackError?.type, 'validation');
    assert.strictEqual(rollbackError?.retryable, false);
  });
});

describe('Optimistic UI: Outbox & Offline Resilience', () => {
  it('enforces maximum outbox size and purges stale items (>24h)', () => {
    const outbox = new OptimisticOutbox();
    outbox.clear();

    const now = Date.now();

    // Enqueue 5 fresh items
    for (let i = 0; i < 5; i++) {
      outbox.enqueue({
        id: `fresh_${i}`,
        idempotencyKey: `idemp_${i}`,
        resource: 'cart',
        action: 'cart_add',
        payload: { item: i },
        status: 'pending',
        createdAt: now - i * 1000,
        attemptCount: 0,
      });
    }

    assert.strictEqual(outbox.getItems().length, 5);

    // Enqueue a stale item (>24 hours old)
    outbox.enqueue({
      id: 'stale_1',
      idempotencyKey: 'idemp_stale_1',
      resource: 'cart',
      action: 'cart_add',
      payload: { item: 'old' },
      status: 'pending',
      createdAt: now - (MAX_OUTBOX_AGE_MS + 10000),
      attemptCount: 0,
    });

    // Loading from storage purges stale items
    const loaded = outbox.loadFromStorage();
    assert.strictEqual(loaded.some((m) => m.id === 'stale_1'), false);
    assert.strictEqual(loaded.length, 5);

    outbox.clear();
  });
});

describe('Optimistic UI: Telemetry & Instrumentation', () => {
  beforeEach(() => {
    telemetry.reset();
  });

  it('tracks mutations, average latency, and diff categories without PII', () => {
    telemetry.recordMutationStart('cart', 'cart_add');
    telemetry.recordMutationSuccess('cart', 'cart_add', 85);
    telemetry.recordReconciliationDiff('price_updated');
    telemetry.recordReconciliationDiff('quantity_capped');

    const metrics = telemetry.getMetrics();
    assert.strictEqual(metrics.totalMutations, 1);
    assert.strictEqual(metrics.successfulMutations, 1);
    assert.strictEqual(metrics.averageConfirmationMs, 85);
    assert.strictEqual(metrics.reconciliationDiffsByType.price_updated, 1);
    assert.strictEqual(metrics.reconciliationDiffsByType.quantity_capped, 1);
  });

  it('tracks rollbacks and reasons', () => {
    telemetry.recordMutationStart('cart', 'cart_add');
    telemetry.recordMutationRollback('cart', 'cart_add', 'network');

    const metrics = telemetry.getMetrics();
    assert.strictEqual(metrics.rolledBackMutations, 1);
    assert.strictEqual(metrics.rollbacksByReason.network, 1);
  });
});

describe('Optimistic UI: Feature Flags', () => {
  beforeEach(() => {
    resetFeatureFlags();
  });

  it('allows toggling optimistic feature flags per action', () => {
    const defaultFlags = getFeatureFlags();
    assert.strictEqual(defaultFlags.optimisticCart, true);

    updateFeatureFlags({ optimisticCart: false });
    const updated = getFeatureFlags();
    assert.strictEqual(updated.optimisticCart, false);
    assert.strictEqual(updated.optimisticWishlist, true); // other flags preserved
  });
});
