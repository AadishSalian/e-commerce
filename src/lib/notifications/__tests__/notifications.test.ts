import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateDeepLink,
  sanitizeNotificationText,
  isPriceDropSignificant,
  scrubSensitiveDetails,
  formatRelativeTime,
  getFeedDayGroup,
} from '../validation';
import {
  getUserNotifications,
  getUnreadCount,
  getCategoryCounts,
  getUserPreferences,
  updateUserPreferences,
  createOrderNotification,
  createPriceDropNotification,
  createRestockNotification,
  createAccountNotification,
  markNotificationRead,
  markNotificationUnread,
  markAllNotificationsRead,
  dismissNotification,
  batchPriceDrops,
} from '../service';

describe('Notifications: Deep Link Validation & Allow-list', () => {
  it('approves legitimate internal routes', () => {
    assert.strictEqual(
      validateDeepLink('/account/orders/ORD-123'),
      '/account/orders/ORD-123'
    );
    assert.strictEqual(
      validateDeepLink('/checkout/success?orderId=ORD-948271&token=xyz'),
      '/checkout/success?orderId=ORD-948271&token=xyz'
    );
    assert.strictEqual(
      validateDeepLink('/products/t-1?variant=v-1'),
      '/products/t-1?variant=v-1'
    );
    assert.strictEqual(
      validateDeepLink('/wishlist'),
      '/wishlist'
    );
  });

  it('rejects external URLs, protocol-relative links, and javascript: exploits', () => {
    assert.strictEqual(validateDeepLink('https://phishing.site/login'), '/notifications');
    assert.strictEqual(validateDeepLink('http://example.com'), '/notifications');
    assert.strictEqual(validateDeepLink('//malicious.com/steal-cookie'), '/notifications');
    assert.strictEqual(validateDeepLink('javascript:alert(1)'), '/notifications');
    assert.strictEqual(validateDeepLink('data:text/html,<script>alert(1)</script>'), '/notifications');
    assert.strictEqual(validateDeepLink(''), '/notifications');
    assert.strictEqual(validateDeepLink('/admin/backdoor'), '/notifications');
  });
});

describe('Notifications: Sanitization, Privacy & Anti-Leakage', () => {
  it('strips HTML injection and escapes characters in user-derived text', () => {
    const malicious = '<script>alert("hack")</script>Living Room & "Kitchen"';
    const sanitized = sanitizeNotificationText(malicious, 60);
    assert.ok(!sanitized.includes('<script>'));
    assert.ok(sanitized.includes('&amp;'));
    assert.ok(sanitized.includes('&quot;'));
  });

  it('scrubs full credit card numbers and full emails from notification feed copy', () => {
    const raw = 'Sent to aadishsalian@gmail.com with card 4111 2222 3333 4444';
    const scrubbed = scrubSensitiveDetails(raw);
    assert.ok(!scrubbed.includes('4111 2222 3333 4444'));
    assert.ok(scrubbed.includes('•••• ••••'));
    assert.ok(!scrubbed.includes('aadishsalian@gmail.com'));
    assert.ok(scrubbed.includes('a***@gmail.com'));
  });

  it('truncates body cleanly without awkward mid-word chops', () => {
    const longText = 'This is an exceptionally detailed note describing why an artisan crafted ceramic mechanical keyboard dropped in price significantly today.';
    const truncated = sanitizeNotificationText(longText, 60);
    assert.ok(truncated.length <= 61);
    assert.ok(truncated.endsWith('…'));
  });
});

describe('Notifications: Price Drop Honesty & Thresholds', () => {
  it('requires at least 5% drop threshold by default', () => {
    // 28900 to 24900 -> 13.8% drop -> qualifies
    assert.strictEqual(isPriceDropSignificant(28900, 24900, 5), true);

    // 25000 to 24800 -> 0.8% drop -> does not qualify
    assert.strictEqual(isPriceDropSignificant(25000, 24800, 5), false);

    // Price increase 20000 to 25000 -> does not qualify
    assert.strictEqual(isPriceDropSignificant(20000, 25000, 5), false);

    // Equal price -> does not qualify
    assert.strictEqual(isPriceDropSignificant(20000, 20000, 5), false);
  });
});

describe('Notifications: Event-Driven Creation & Evolving Orders', () => {
  const testUserId = `test-user-${Date.now()}`;

  it('evolves an existing order entry instead of stacking duplicate rows', () => {
    // Step 1: Order confirmed
    const step1 = createOrderNotification({
      userId: testUserId,
      orderId: 'ORD-TEST-01',
      type: 'order_confirmed',
    });
    assert.strictEqual(step1.type, 'order_confirmed');
    assert.strictEqual(step1.category, 'orders');

    // Step 2: Order shipped with carrier
    const step2 = createOrderNotification({
      userId: testUserId,
      orderId: 'ORD-TEST-01',
      type: 'order_shipped',
      carrier: 'BlueDart Express',
      trackingNumber: 'TRK-9901',
      newEstimate: 'Thu 12 Nov',
    });

    // Verify it updated the existing entry
    assert.strictEqual(step2.id, step1.id);
    assert.strictEqual(step2.type, 'order_shipped');
    assert.ok(step2.body.includes('BlueDart Express'));

    // Verify feed has only ONE entry for this order
    const feed = getUserNotifications(testUserId, { category: 'orders' });
    const orderEntries = feed.notifications.filter((n) => n.entity_id === 'ORD-TEST-01');
    assert.strictEqual(orderEntries.length, 1);
  });

  it('enforces 7-day cooldown on price drops unless price drops further', () => {
    // First drop: 30000 -> 25000 (16.6% drop)
    const drop1 = createPriceDropNotification({
      userId: testUserId,
      productId: 'p-keyboard',
      productName: 'Studio Keyboard',
      oldPriceMinor: 30000,
      newPriceMinor: 25000,
    });
    assert.ok(drop1 !== null);

    // Immediate second drop to same newPriceMinor (25000) -> blocked by cooldown
    const drop2 = createPriceDropNotification({
      userId: testUserId,
      productId: 'p-keyboard',
      productName: 'Studio Keyboard',
      oldPriceMinor: 30000,
      newPriceMinor: 25000,
    });
    assert.strictEqual(drop2, null);

    // Third drop that falls strictly further: 25000 -> 22000 (12% further drop) -> allowed!
    const drop3 = createPriceDropNotification({
      userId: testUserId,
      productId: 'p-keyboard',
      productName: 'Studio Keyboard',
      oldPriceMinor: 25000,
      newPriceMinor: 22000,
    });
    assert.ok(drop3 !== null);
    assert.strictEqual(drop3.payload.newPriceMinor, 22000);
  });

  it('creates truthful restock alerts and respects hysteresis', () => {
    // Restock with zero stock -> rejected
    const invalid = createRestockNotification({
      userId: testUserId,
      productId: 'p-earbuds',
      productName: 'Ceramic Earbuds',
      stockCount: 0,
    });
    assert.strictEqual(invalid, null);

    // Legitimate restock with real stock
    const valid = createRestockNotification({
      userId: testUserId,
      productId: 'p-earbuds',
      productName: 'Ceramic Earbuds',
      variantValue: 'Matte Charcoal',
      stockCount: 8,
    });
    assert.ok(valid !== null);
    assert.strictEqual(valid.category, 'stock');

    // Rapid second call within 24h -> blocked by hysteresis
    const flapping = createRestockNotification({
      userId: testUserId,
      productId: 'p-earbuds',
      productName: 'Ceramic Earbuds',
      variantValue: 'Matte Charcoal',
      stockCount: 9,
    });
    assert.strictEqual(flapping, null);
  });

  it('creates account security notifications that cannot be muted', () => {
    const sec = createAccountNotification({
      userId: testUserId,
      type: 'account_new_device',
      device: 'iPad Pro',
      browser: 'Safari',
      ipLocation: 'Mumbai, India',
    });
    assert.strictEqual(sec.category, 'account');
    assert.ok(sec.body.includes('Mumbai, India'));

    // Even if user attempts to disable account notifications, preferences lock it on
    const prefs = updateUserPreferences(testUserId, {
      categories: { orders: true, price: false, stock: false, account: false },
    });
    assert.strictEqual(prefs.categories.account, true);
  });

  it('groups multiple price drop bursts into a consolidated batch', () => {
    const batched = batchPriceDrops(testUserId, [
      {
        productId: 'p-1',
        productName: 'Matte Keyboard',
        oldPriceMinor: 28900,
        newPriceMinor: 24900,
        image: 'https://example.com/k.jpg',
      },
      {
        productId: 'p-2',
        productName: 'Ceramic Earbuds',
        oldPriceMinor: 19900,
        newPriceMinor: 16900,
        image: 'https://example.com/e.jpg',
      },
    ]);
    assert.ok(batched !== null);
    assert.strictEqual(batched.type, 'price_drop_batch');
    assert.strictEqual(batched.payload.batchItems?.length, 2);
  });
});

describe('Notifications: Preference Enforcement & Read State Operations', () => {
  const testUserId = `test-user-prefs-${Date.now()}`;

  it('suppresses disabled categories in unread count and feed', () => {
    // Create an order and a price drop
    const orderNotif = createOrderNotification({
      userId: testUserId,
      orderId: 'ORD-PREF-1',
      type: 'order_confirmed',
    });
    const priceNotif = createPriceDropNotification({
      userId: testUserId,
      productId: 'p-desk',
      productName: 'Desk Mat',
      oldPriceMinor: 5000,
      newPriceMinor: 4000,
    });
    assert.ok(priceNotif !== null);

    // Initially both enabled -> unreadCount should be at least 2
    let count = getUnreadCount(testUserId);
    assert.strictEqual(count, 2);

    // Disable price category
    updateUserPreferences(testUserId, {
      categories: { orders: true, price: false, stock: true, account: true },
    });

    // Price items suppressed from unread count
    count = getUnreadCount(testUserId);
    assert.strictEqual(count, 1);

    // Price items suppressed from in-app feed
    const feed = getUserNotifications(testUserId);
    assert.strictEqual(feed.notifications.some((n) => n.category === 'price'), false);
    assert.strictEqual(feed.notifications.some((n) => n.category === 'orders'), true);

    // Re-enable price category
    updateUserPreferences(testUserId, {
      categories: { orders: true, price: true, stock: true, account: true },
    });
    assert.strictEqual(getUnreadCount(testUserId), 2);
  });

  it('supports optimistic mark as read, mark as unread, and mark all as read', () => {
    const initialUnread = getUnreadCount(testUserId);
    const feed = getUserNotifications(testUserId);
    const firstItem = feed.notifications[0];

    // Mark single as read
    const success = markNotificationRead(testUserId, firstItem.id);
    assert.strictEqual(success, true);
    assert.strictEqual(getUnreadCount(testUserId), initialUnread - 1);

    // Mark back as unread
    markNotificationUnread(testUserId, firstItem.id);
    assert.strictEqual(getUnreadCount(testUserId), initialUnread);

    // Mark all as read
    const cleared = markAllNotificationsRead(testUserId);
    assert.ok(cleared >= 1);
    assert.strictEqual(getUnreadCount(testUserId), 0);
  });

  it('dismisses notifications cleanly from the active list', () => {
    const order = createOrderNotification({
      userId: testUserId,
      orderId: 'ORD-DISMISS-1',
      type: 'order_confirmed',
    });

    const before = getUserNotifications(testUserId);
    assert.ok(before.notifications.some((n) => n.id === order.id));

    dismissNotification(testUserId, order.id);

    const after = getUserNotifications(testUserId);
    assert.strictEqual(after.notifications.some((n) => n.id === order.id), false);
  });
});

describe('Notifications: Date & Relative Time Math', () => {
  it('formats relative times accurately', () => {
    const now = new Date('2026-11-10T12:00:00Z');
    assert.strictEqual(formatRelativeTime('2026-11-10T11:59:45Z', now), 'Just now');
    assert.strictEqual(formatRelativeTime('2026-11-10T11:45:00Z', now), '15m ago');
    assert.strictEqual(formatRelativeTime('2026-11-10T09:00:00Z', now), '3h ago');
    assert.strictEqual(formatRelativeTime('2026-11-09T12:00:00Z', now), 'Yesterday');
    assert.strictEqual(formatRelativeTime('2026-11-07T12:00:00Z', now), '3d ago');
  });

  it('computes feed day groups properly', () => {
    const now = new Date('2026-11-10T12:00:00Z');
    assert.strictEqual(getFeedDayGroup('2026-11-10T08:00:00Z', now), 'Today');
    assert.strictEqual(getFeedDayGroup('2026-11-09T18:00:00Z', now), 'Yesterday');
    assert.strictEqual(getFeedDayGroup('2026-11-06T12:00:00Z', now), 'Earlier');
  });
});
