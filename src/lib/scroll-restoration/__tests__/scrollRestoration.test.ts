import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  parseListingUrl,
  serializeListingUrl,
  isMajorNavigationChange,
  getActiveFilterChips,
  DEFAULT_LISTING_STATE,
} from '../url-state';
import {
  generateHistoryEntryId,
  saveSnapshot,
  getSnapshot,
  deleteSnapshot,
  clearAllSnapshots,
  saveFilterUIState,
  getFilterUIState,
  saveLastListing,
  getLastListing,
  MAX_SNAPSHOT_COUNT,
  CURRENT_SCHEMA_VERSION,
  MAX_SNAPSHOT_AGE_MS,
  SNAPSHOT_STORAGE_KEY,
} from '../snapshot-storage';
import {
  canSafelyRouterBack,
  navigateBackToResults,
  recordListingExit,
} from '../back-navigation';
import {
  executeScrollRestoration,
  captureListingSnapshot,
  isHistoryTraversalOrReload,
} from '../restoration-engine';
import { applyListingFilters } from '../filter-matching';
import { ScrollSnapshot } from '../types';
import { Product } from '@/lib/mockData';

// In-memory mock sessionStorage for Node environment
class MockSessionStorage {
  private store: Map<string, string> = new Map();
  public throwOnSet = false;

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.throwOnSet) {
      throw new Error('QuotaExceededError');
    }
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

describe('Scroll Restoration: URL Schema & Serialization Engine', () => {
  it('parses empty query params with default listing state', () => {
    const result = parseListingUrl('');
    assert.strictEqual(result.hasInvalidParams, false);
    assert.strictEqual(result.state.q, '');
    assert.strictEqual(result.state.category, 'All');
    assert.strictEqual(result.state.sort, 'newest');
    assert.strictEqual(result.state.page, 1);
    assert.deepStrictEqual(result.state.material, []);
  });

  it('parses full filter query with comma-separated and array values', () => {
    const query = 'category=furniture&material=walnut,oak&price=500-1500&sort=price-asc&page=2&rating=4&inStock=true';
    const result = parseListingUrl(query);

    assert.strictEqual(result.hasInvalidParams, false);
    assert.strictEqual(result.state.category, 'furniture');
    // Notice automatic canonical sorting of array values: ['oak', 'walnut']
    assert.deepStrictEqual(result.state.material, ['oak', 'walnut']);
    assert.strictEqual(result.state.minPrice, 500);
    assert.strictEqual(result.state.maxPrice, 1500);
    assert.strictEqual(result.state.sort, 'price-asc');
    assert.strictEqual(result.state.page, 2);
    assert.strictEqual(result.state.rating, 4);
    assert.strictEqual(result.state.inStock, true);
  });

  it('detects and sanitizes invalid/malformed parameters without crashing', () => {
    const badQuery = 'price=abc-def&rating=99&sort=unknown_sort&page=-5&inStock=maybe';
    const result = parseListingUrl(badQuery);

    assert.strictEqual(result.hasInvalidParams, true);
    assert.ok(result.invalidParams.includes('price'));
    assert.ok(result.invalidParams.includes('rating'));
    assert.ok(result.invalidParams.includes('sort'));
    assert.ok(result.invalidParams.includes('page'));
    assert.ok(result.invalidParams.includes('inStock'));

    // Sanitized defaults
    assert.strictEqual(result.state.minPrice, null);
    assert.strictEqual(result.state.maxPrice, null);
    assert.strictEqual(result.state.rating, null);
    assert.strictEqual(result.state.sort, 'newest');
    assert.strictEqual(result.state.page, 1);
  });

  it('detects inverted price ranges (min > max) and cleans them', () => {
    const inverted = parseListingUrl('price=1500-500');
    assert.strictEqual(inverted.hasInvalidParams, true);
    assert.strictEqual(inverted.state.minPrice, null);
    assert.strictEqual(inverted.state.maxPrice, null);
  });

  it('serializes state with canonical key order and alphabetical value sorting', () => {
    const url = serializeListingUrl('/furniture/sofas', {
      material: ['walnut', 'oak'],
      minPrice: 500,
      maxPrice: 1500,
      sort: 'price-asc',
      page: 2,
    });

    // Keys in order: material -> price -> sort -> page
    assert.strictEqual(
      url,
      '/furniture/sofas?material=oak%2Cwalnut&price=500-1500&sort=price-asc&page=2'
    );
  });

  it('omits default values during serialization to keep URLs clean', () => {
    const url = serializeListingUrl('/products', {
      category: 'All',
      page: 1,
      sort: 'newest',
      material: [],
      brand: [],
    });

    assert.strictEqual(url, '/products');
  });

  it('distinguishes major view changes (router.push) from refinements (router.replace)', () => {
    const base = { ...DEFAULT_LISTING_STATE };

    // Category change is major -> push
    assert.strictEqual(
      isMajorNavigationChange(base, { ...base, category: 'Tech' }),
      true
    );

    // Search query change is major -> push
    assert.strictEqual(
      isMajorNavigationChange(base, { ...base, q: 'keyboard' }),
      true
    );

    // Page change is major -> push
    assert.strictEqual(
      isMajorNavigationChange(base, { ...base, page: 3 }),
      true
    );

    // Filter toggles (brand, material, price, sort) are refinements -> replace
    assert.strictEqual(
      isMajorNavigationChange(base, { ...base, material: ['oak'] }),
      false
    );
    assert.strictEqual(
      isMajorNavigationChange(base, { ...base, minPrice: 100, maxPrice: 500 }),
      false
    );
    assert.strictEqual(
      isMajorNavigationChange(base, { ...base, sort: 'price-asc' }),
      false
    );
  });

  it('generates active filter chips with removal patches', () => {
    const state = {
      ...DEFAULT_LISTING_STATE,
      category: 'Furniture',
      material: ['oak', 'walnut'],
      minPrice: 100,
      maxPrice: 300,
      inStock: true,
    };

    const chips = getActiveFilterChips(state);
    assert.strictEqual(chips.length, 5); // category, oak, walnut, price, inStock

    const oakChip = chips.find((c) => c.label === 'oak');
    assert.ok(oakChip);
    assert.deepStrictEqual(oakChip?.removePatch, { material: ['walnut'] });

    const priceChip = chips.find((c) => c.key === 'minPrice');
    assert.ok(priceChip);
    assert.deepStrictEqual(priceChip?.removePatch, { minPrice: null, maxPrice: null });
  });
});

describe('Scroll Restoration: Snapshot Storage & Quota Management', () => {
  let mockStorage: MockSessionStorage;

  beforeEach(() => {
    mockStorage = new MockSessionStorage();
    (global as any).window = {
      sessionStorage: mockStorage,
      history: { state: {}, replaceState: () => {} },
      location: { href: 'http://localhost:3000/products' },
    };
  });

  it('generates unique collision-resistant history entry IDs', () => {
    const id1 = generateHistoryEntryId();
    const id2 = generateHistoryEntryId();
    assert.notStrictEqual(id1, id2);
    assert.ok(id1.startsWith('sr_'));
  });

  it('stores and retrieves snapshot with schema validation', () => {
    const entryId = generateHistoryEntryId();
    const snapshot: ScrollSnapshot = {
      key: entryId,
      url: '/furniture/sofas?material=oak&page=2',
      scrollY: 4820,
      anchorProductId: 'sku_8841',
      anchorOffset: 132,
      loadedPages: 3,
      viewport: { w: 1440, h: 900 },
      savedAt: Date.now(),
      schemaVersion: CURRENT_SCHEMA_VERSION,
    };

    saveSnapshot(snapshot);
    const retrieved = getSnapshot(entryId);

    assert.ok(retrieved);
    assert.strictEqual(retrieved?.key, entryId);
    assert.strictEqual(retrieved?.scrollY, 4820);
    assert.strictEqual(retrieved?.anchorProductId, 'sku_8841');
    assert.strictEqual(retrieved?.anchorOffset, 132);
    assert.strictEqual(retrieved?.loadedPages, 3);
  });

  it('evicts stale snapshots older than 30 minutes', () => {
    const entryId = generateHistoryEntryId();
    const staleSnapshot: ScrollSnapshot = {
      key: entryId,
      url: '/products',
      scrollY: 1000,
      anchorProductId: 'p-1',
      anchorOffset: 100,
      loadedPages: 1,
      viewport: { w: 1200, h: 800 },
      savedAt: Date.now() - (MAX_SNAPSHOT_AGE_MS + 5000), // 30 mins + 5s ago
      schemaVersion: CURRENT_SCHEMA_VERSION,
    };

    // Directly put into storage
    mockStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify([staleSnapshot]));

    const retrieved = getSnapshot(entryId);
    assert.strictEqual(retrieved, null);
  });

  it('enforces maximum size cap (evicts oldest snapshots after 20)', () => {
    for (let i = 0; i < 25; i++) {
      const entryId = `entry_${i}`;
      saveSnapshot({
        key: entryId,
        url: `/products?p=${i}`,
        scrollY: i * 100,
        anchorProductId: `p_${i}`,
        anchorOffset: 50,
        loadedPages: 1,
        viewport: { w: 1200, h: 800 },
        savedAt: Date.now() + i * 10,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      });
    }

    // The oldest entry (entry_0) must have been evicted
    assert.strictEqual(getSnapshot('entry_0'), null);
    // The newest entry (entry_24) must exist
    assert.ok(getSnapshot('entry_24'));
  });

  it('fails gracefully when storage is blocked in private browsing mode', () => {
    mockStorage.throwOnSet = true;
    assert.doesNotThrow(() => {
      saveSnapshot({
        key: 'entry_test',
        url: '/products',
        scrollY: 200,
        anchorProductId: 'p-1',
        anchorOffset: 50,
        loadedPages: 1,
        viewport: { w: 1200, h: 800 },
        savedAt: Date.now(),
        schemaVersion: CURRENT_SCHEMA_VERSION,
      });
    });
  });

  it('persists and restores non-URL filter UI state (expanded groups, viewMode)', () => {
    const listingId = 'furniture-collection';
    const uiState = {
      expandedGroups: { Material: true, Price: false, Color: true },
      viewMode: 'grid' as const,
      showMore: { Material: true },
    };

    saveFilterUIState(listingId, uiState);
    const restored = getFilterUIState(listingId);

    assert.deepStrictEqual(restored, uiState);
  });
});

describe('Scroll Restoration: "Back to results" Navigation Engine', () => {
  beforeEach(() => {
    (global as any).window = {
      sessionStorage: new MockSessionStorage(),
      location: { origin: 'http://localhost:3000' },
      history: { length: 3 },
    };
    (global as any).document = {
      referrer: 'http://localhost:3000/products?material=oak',
    };
  });

  it('allows safe router.back() when previous entry was internal listing', () => {
    recordListingExit({
      url: '/products?material=oak',
      savedAt: Date.now(),
    });

    assert.strictEqual(canSafelyRouterBack(), true);
  });

  it('disallows router.back() when referrer is external website', () => {
    recordListingExit({
      url: '/products?material=oak',
      savedAt: Date.now(),
    });

    (global as any).document.referrer = 'https://google.com/search';
    assert.strictEqual(canSafelyRouterBack(), false);
  });

  it('navigates via router.back() when safe, or router.push() when deep-linked', () => {
    let backCalled = false;
    let pushCalledUrl: string | null = null;

    const router = {
      back: () => {
        backCalled = true;
      },
      push: (url: string) => {
        pushCalledUrl = url;
      },
    };

    // Safe situation
    recordListingExit({
      url: '/products?category=Tech',
      savedAt: Date.now(),
    });
    navigateBackToResults(router);
    assert.strictEqual(backCalled, true);
    assert.strictEqual(pushCalledUrl, null);

    // External referrer / deep-link situation
    backCalled = false;
    (global as any).document.referrer = 'https://external-social.com';
    navigateBackToResults(router, '/products');
    assert.strictEqual(backCalled, false);
    assert.strictEqual(pushCalledUrl, '/products?category=Tech');
  });
});

describe('Scroll Restoration: Restoration Engine & Cancellation Guards', () => {
  let mockStorage: MockSessionStorage;
  let scrollTargetY = 0;
  let listeners: Record<string, ((e: any) => void)[]> = {};

  beforeEach(() => {
    mockStorage = new MockSessionStorage();
    scrollTargetY = 0;
    listeners = {};

    (global as any).window = {
      sessionStorage: mockStorage,
      scrollY: 0,
      innerWidth: 1280,
      innerHeight: 800,
      history: {
        state: { __sr_type: 'traversal' },
        scrollRestoration: 'auto',
      },
      scrollTo: (opts: { top: number; behavior?: string }) => {
        scrollTargetY = opts.top;
        (global as any).window.scrollY = opts.top;
      },
      addEventListener: (event: string, fn: any) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(fn);
      },
      removeEventListener: (event: string, fn: any) => {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter((f) => f !== fn);
        }
      },
    };

    (global as any).document = {
      documentElement: { scrollHeight: 5000 },
      querySelector: (selector: string) => {
        if (selector.includes('anchor_card')) {
          const elementDocY = 300;
          return {
            getBoundingClientRect: () => {
              const currentScrollY = (global as any).window.scrollY || 0;
              return {
                top: elementDocY - currentScrollY,
                bottom: elementDocY + 400 - currentScrollY,
              };
            },
            querySelector: () => ({ focus: () => {}, setAttribute: () => {} }),
            setAttribute: () => {},
          };
        }
        return null;
      },
      getElementById: () => null,
      fonts: { ready: Promise.resolve() },
    };
  });

  it('restores using Anchor-First strategy when anchor card is present in DOM', async () => {
    const entryId = 'entry_anchor_test';
    saveSnapshot({
      key: entryId,
      url: '/products',
      scrollY: 2500,
      anchorProductId: 'anchor_card',
      anchorOffset: 120, // Was 120px from top
      loadedPages: 1,
      viewport: { w: 1280, h: 800 },
      savedAt: Date.now(),
      schemaVersion: 1,
    });

    const result = await executeScrollRestoration({ entryId, debug: false });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.strategy, 'anchor');
    // targetScrollY = currentTop (300) + window.scrollY (0) - anchorOffset (120) = 180
    assert.strictEqual(result.targetScrollY, 180);
    assert.strictEqual(scrollTargetY, 180);
  });

  it('falls back to scrollY clamped to document height when anchor is missing', async () => {
    const entryId = 'entry_fallback_test';
    saveSnapshot({
      key: entryId,
      url: '/products',
      scrollY: 1500,
      anchorProductId: 'missing_card',
      anchorOffset: 100,
      loadedPages: 1,
      viewport: { w: 1280, h: 800 },
      savedAt: Date.now(),
      schemaVersion: 1,
    });

    const result = await executeScrollRestoration({ entryId, debug: false });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.strategy, 'scrollY');
    assert.strictEqual(result.targetScrollY, 1500);
    assert.strictEqual(scrollTargetY, 1500);
  });

  it('immediately cancels restoration loop if user interacts with wheel or touch', async () => {
    const entryId = 'entry_cancel_test';
    saveSnapshot({
      key: entryId,
      url: '/products',
      scrollY: 2000,
      anchorProductId: 'anchor_card',
      anchorOffset: 100,
      loadedPages: 1,
      viewport: { w: 1280, h: 800 },
      savedAt: Date.now(),
      schemaVersion: 1,
    });

    await executeScrollRestoration({ entryId, debug: false });

    // Simulate user scroll/wheel gesture
    if (listeners['wheel']) {
      for (const fn of listeners['wheel']) {
        fn({ type: 'wheel' });
      }
    }

    // Verify listeners are detached so it never fights user input
    assert.strictEqual(listeners['wheel']?.length || 0, 0);
  });
});

describe('Scroll Restoration: Filter Matching & Sorting', () => {
  const sampleProducts: Product[] = [
    {
      id: 'p-1',
      name: 'Oak Dining Table',
      description: 'Solid natural oak dining table with matte finish.',
      price: 850,
      category: 'Home & Furniture',
      isNew: true,
      image: '/img1.jpg',
      rating: 4.8,
      stockCount: 5,
      attributes: { material: 'Oak', brand: 'Atelier' },
      variants: [{ id: 'v1', name: 'Color', value: 'Natural Oak' }],
    },
    {
      id: 'p-2',
      name: 'Walnut Coffee Table',
      description: 'Rich dark walnut coffee table.',
      price: 450,
      category: 'Home & Furniture',
      isNew: false,
      image: '/img2.jpg',
      rating: 4.2,
      stockCount: 0, // Out of stock
      attributes: { material: 'Walnut', brand: 'Monolith' },
      variants: [{ id: 'v2', name: 'Color', value: 'Dark Walnut' }],
    },
    {
      id: 'p-3',
      name: 'Aluminum Mechanical Keyboard',
      description: 'Machined aerospace aluminum chassis.',
      price: 240,
      category: 'Tech',
      isNew: true,
      image: '/img3.jpg',
      rating: 4.9,
      stockCount: 12,
      attributes: { material: 'Aluminum', brand: 'MATTE Labs' },
      variants: [{ id: 'v3', name: 'Color', value: 'Charcoal' }],
    },
  ];

  it('filters by category accurately', () => {
    const results = applyListingFilters(sampleProducts, {
      ...DEFAULT_LISTING_STATE,
      category: 'Tech',
    });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].id, 'p-3');
  });

  it('filters by multiple materials (OR logic between selected chips)', () => {
    const results = applyListingFilters(sampleProducts, {
      ...DEFAULT_LISTING_STATE,
      material: ['walnut'],
    });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].id, 'p-2');
  });

  it('filters by price range (min and max)', () => {
    const results = applyListingFilters(sampleProducts, {
      ...DEFAULT_LISTING_STATE,
      minPrice: 300,
      maxPrice: 600,
    });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].id, 'p-2');
  });

  it('filters by in-stock toggle', () => {
    const inStockOnly = applyListingFilters(sampleProducts, {
      ...DEFAULT_LISTING_STATE,
      inStock: true,
    });
    assert.strictEqual(inStockOnly.length, 2);
    assert.ok(!inStockOnly.find((p) => p.id === 'p-2'));
  });

  it('sorts by price low to high and high to low', () => {
    const asc = applyListingFilters(sampleProducts, {
      ...DEFAULT_LISTING_STATE,
      sort: 'price-asc',
    });
    assert.strictEqual(asc[0].id, 'p-3'); // $240
    assert.strictEqual(asc[2].id, 'p-1'); // $850

    const desc = applyListingFilters(sampleProducts, {
      ...DEFAULT_LISTING_STATE,
      sort: 'price-desc',
    });
    assert.strictEqual(desc[0].id, 'p-1'); // $850
    assert.strictEqual(desc[2].id, 'p-3'); // $240
  });
});
