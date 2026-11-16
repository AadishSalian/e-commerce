import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  DEFAULT_TOUR_CONFIG,
  DEFAULT_FEATURE_FLAGS,
  validateTourConfig,
} from '../config';
import {
  getStorageKey,
  isEligibleByPersistence,
  markTourCompleted,
  markTourInterrupted,
  markTourSkipped,
  readTourPersistence,
  recordTourStep,
  resetTourPersistence,
  writeTourPersistence,
} from '../persistence';
import {
  evaluateTourEligibility,
  isBotOrCrawler,
  isDeepLink,
  isRouteAllowed,
} from '../gating';
import {
  buildCutoutSvgPath,
  computeCardPlacement,
  computeCutoutRect,
  TARGET_PADDING,
} from '../positioning';
import {
  addTourAnalyticsSubscriber,
  dispatchTourAnalytics,
} from '../analytics';
import {
  isElementVisible,
  isTargetScrolledOutOfBounds,
  isElementFixedOrSticky,
} from '../resolver';
import { TourAnalyticsEvent, TourConfig } from '../types';

// Mock in-memory localStorage for node test runner
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

const mockStorage = new MockLocalStorage();
(global as any).window = {
  localStorage: mockStorage,
  innerWidth: 1024,
  innerHeight: 768,
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: () => ({ matches: false }),
};

describe('Coach Mark Tour: Configuration & Content Guidelines', () => {
  it('validates default tour configuration satisfies core constraints', () => {
    const result = validateTourConfig(DEFAULT_TOUR_CONFIG);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('contains exactly 3 steps for search, filters, and wishlist', () => {
    assert.strictEqual(DEFAULT_TOUR_CONFIG.steps.length, 3);
    const stepIds = DEFAULT_TOUR_CONFIG.steps.map((s) => s.id);
    assert.deepStrictEqual(stepIds, ['search', 'filters', 'wishlist']);
  });

  it('strictly enforces stable data-tour attribute selectors', () => {
    for (const step of DEFAULT_TOUR_CONFIG.steps) {
      assert.ok(
        step.target.startsWith('[data-tour='),
        `Step ${step.id} target must use [data-tour=...] selector`
      );
    }
  });

  it('complies with copy guidelines: title <= 6 words, body <= 120 chars, plain and restrained', () => {
    for (const step of DEFAULT_TOUR_CONFIG.steps) {
      const words = step.title.trim().split(/\s+/).length;
      assert.ok(words <= 6, `Step ${step.id} title "${step.title}" has ${words} words (max 6)`);
      assert.ok(
        step.body.length <= 120,
        `Step ${step.id} body length ${step.body.length} exceeds 120 chars`
      );
      assert.ok(
        !step.body.includes('!'),
        `Step ${step.id} body must not use exclamation mark enthusiasm`
      );
    }
  });

  it('rejects tours with more than 3 steps', () => {
    const invalidConfig: TourConfig = {
      ...DEFAULT_TOUR_CONFIG,
      steps: [
        ...DEFAULT_TOUR_CONFIG.steps,
        {
          id: 'cart',
          target: '[data-tour="cart"]',
          title: 'Review Bag',
          body: 'Check out anytime.',
          placement: 'bottom',
          controlName: 'Cart Bag',
        },
      ],
    };
    const result = validateTourConfig(invalidConfig);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('at most 3 steps')));
  });

  it('rejects targets that use DOM classes or IDs without data-tour', () => {
    const invalidConfig: TourConfig = {
      ...DEFAULT_TOUR_CONFIG,
      steps: [
        {
          id: 'search',
          target: '.navbar-search-btn',
          title: 'Search',
          body: 'Search products.',
          placement: 'bottom',
          controlName: 'Search',
        },
      ],
    };
    const result = validateTourConfig(invalidConfig);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('stable data-tour attribute')));
  });
});

describe('Coach Mark Tour: Persistence & "Shown Once" Semantics', () => {
  const tourId = DEFAULT_TOUR_CONFIG.id;
  const version = DEFAULT_TOUR_CONFIG.version;

  beforeEach(() => {
    mockStorage.clear();
  });

  it('generates a versioned storage key', () => {
    const key = getStorageKey('first-visit-v1', 1);
    assert.strictEqual(key, 'matte_coach_mark_first-visit-v1_v1');
  });

  it('identifies brand new visitor as eligible when no storage record exists', () => {
    assert.strictEqual(isEligibleByPersistence(DEFAULT_TOUR_CONFIG), true);
  });

  it('permanently marks completed tour and suppresses future auto-runs', () => {
    markTourCompleted(tourId, version);
    const record = readTourPersistence(tourId, version);
    assert.strictEqual(record?.status, 'completed');
    assert.strictEqual(isEligibleByPersistence(DEFAULT_TOUR_CONFIG), false);
  });

  it('permanently marks skipped tour and suppresses future auto-runs', () => {
    markTourSkipped(tourId, version, 1);
    const record = readTourPersistence(tourId, version);
    assert.strictEqual(record?.status, 'skipped');
    assert.strictEqual(record?.lastStep, 1);
    assert.strictEqual(isEligibleByPersistence(DEFAULT_TOUR_CONFIG), false);
  });

  it('allows interrupted tour to show once more on a subsequent visit, then treats as skipped', () => {
    // 1st interruption (e.g. shopper opened a drawer or navigated away)
    markTourInterrupted(tourId, version, 0);
    let record = readTourPersistence(tourId, version);
    assert.strictEqual(record?.status, 'interrupted');
    assert.strictEqual(record?.interruptCount, 1);
    assert.strictEqual(isEligibleByPersistence(DEFAULT_TOUR_CONFIG), true);

    // 2nd interruption: exceeds 1 allowable interruption -> converted to 'skipped' permanently
    markTourInterrupted(tourId, version, 1);
    record = readTourPersistence(tourId, version);
    assert.strictEqual(record?.status, 'skipped');
    assert.strictEqual(record?.interruptCount, 2);
    assert.strictEqual(isEligibleByPersistence(DEFAULT_TOUR_CONFIG), false);
  });

  it('records active step progression without marking final', () => {
    recordTourStep(tourId, version, 2);
    const record = readTourPersistence(tourId, version);
    assert.strictEqual(record?.lastStep, 2);
    assert.strictEqual(record?.status, 'interrupted');
  });

  it('supports reset helper for clean testing', () => {
    markTourCompleted(tourId, version);
    assert.strictEqual(isEligibleByPersistence(DEFAULT_TOUR_CONFIG), false);
    resetTourPersistence(tourId, version);
    assert.strictEqual(isEligibleByPersistence(DEFAULT_TOUR_CONFIG), true);
  });
});

describe('Coach Mark Tour: Gating Rules & Priority Enforcement', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('allows tour on whitelisted routes: home ("/") and products ("/products")', () => {
    assert.strictEqual(isRouteAllowed('/', ['/', '/products']), true);
    assert.strictEqual(isRouteAllowed('/products', ['/', '/products']), true);
    assert.strictEqual(isRouteAllowed('/products/', ['/', '/products']), true);
  });

  it('strictly forbids tour on non-eligible or high-intent routes', () => {
    const forbiddenRoutes = [
      '/checkout',
      '/payment',
      '/account',
      '/profile',
      '/settings',
      '/admin',
      '/order-confirmation',
      '/w/shared-list-123',
    ];
    for (const route of forbiddenRoutes) {
      assert.strictEqual(
        isRouteAllowed(route, ['/', '/products']),
        false,
        `Route ${route} must not be allowed`
      );
    }
  });

  it('detects deep link intent from query parameters and product direct URLs', () => {
    assert.strictEqual(isDeepLink('/products/p-1'), true);
    assert.strictEqual(isDeepLink('/w/wishlist-token'), true);

    const utmSearch = new URLSearchParams('utm_source=newsletter');
    assert.strictEqual(isDeepLink('/products', utmSearch), true);

    const refSearch = new URLSearchParams('ref=influencer');
    assert.strictEqual(isDeepLink('/', refSearch), true);

    const normalSearch = new URLSearchParams('category=tech');
    assert.strictEqual(isDeepLink('/products', normalSearch), false);
  });

  it('aborts immediately when remote kill switch is active', () => {
    const result = evaluateTourEligibility(DEFAULT_TOUR_CONFIG, {
      pathname: '/',
      featureFlags: { isTourEnabled: false, tourVariant: 'tour' },
    });
    assert.strictEqual(result.eligible, false);
    assert.strictEqual(result.reason, 'kill_switch_active');
  });

  it('suppresses tour when A/B test variant is control', () => {
    const result = evaluateTourEligibility(DEFAULT_TOUR_CONFIG, {
      pathname: '/',
      featureFlags: { isTourEnabled: true, tourVariant: 'control' },
    });
    assert.strictEqual(result.eligible, false);
    assert.strictEqual(result.reason, 'ab_control_group');
  });

  it('suppresses tour when user has already engaged deeply (cart items > 0)', () => {
    const result = evaluateTourEligibility(DEFAULT_TOUR_CONFIG, {
      pathname: '/',
      hasEngagedDeeply: true,
    });
    assert.strictEqual(result.eligible, false);
    assert.strictEqual(result.reason, 'shopper_deeply_engaged');
  });

  it('delays or suppresses tour when another overlay is currently open', () => {
    const result = evaluateTourEligibility(DEFAULT_TOUR_CONFIG, {
      pathname: '/',
      hasActiveOverlays: true,
    });
    assert.strictEqual(result.eligible, false);
    assert.strictEqual(result.reason, 'overlay_collision');
  });

  it('delays tour when site intro animation is pending', () => {
    const result = evaluateTourEligibility(DEFAULT_TOUR_CONFIG, {
      pathname: '/',
      isIntroComplete: false,
    });
    assert.strictEqual(result.eligible, false);
    assert.strictEqual(result.reason, 'intro_pending');
  });

  it('suppresses tour for returning or logged-in users with prior order history', () => {
    const result = evaluateTourEligibility(DEFAULT_TOUR_CONFIG, {
      pathname: '/',
      isLoggedIn: true,
      userOrderCount: 3,
    });
    assert.strictEqual(result.eligible, false);
    assert.strictEqual(result.reason, 'returning_user_with_history');
  });

  it('passes all gating rules for an authentic first-time visitor', () => {
    const result = evaluateTourEligibility(DEFAULT_TOUR_CONFIG, {
      pathname: '/',
      isLoggedIn: false,
      userOrderCount: 0,
      hasEngagedDeeply: false,
      hasActiveOverlays: false,
      isIntroComplete: true,
    });
    assert.strictEqual(result.eligible, true);
    assert.strictEqual(result.reason, undefined);
  });
});

describe('Coach Mark Tour: Positioning Engine, Viewport Clamping & Mobile Docking', () => {
  it('computes cutout rectangle with standard 6px padding', () => {
    const mockElement = {
      getBoundingClientRect: () => ({
        left: 100,
        top: 200,
        width: 40,
        height: 40,
        right: 140,
        bottom: 240,
      }),
    } as any;

    const rect = computeCutoutRect(mockElement, TARGET_PADDING);
    assert.strictEqual(rect.x, 100 - TARGET_PADDING);
    assert.strictEqual(rect.y, 200 - TARGET_PADDING);
    assert.strictEqual(rect.width, 40 + TARGET_PADDING * 2);
    assert.strictEqual(rect.height, 40 + TARGET_PADDING * 2);
  });

  it('places card below target on desktop when space is available', () => {
    const targetRect = { x: 400, y: 50, width: 60, height: 40, rx: 8 };
    const placement = computeCardPlacement(targetRect, {
      preferredPlacement: 'bottom',
      cardWidth: 300,
      cardHeight: 150,
      viewportWidth: 1200,
      viewportHeight: 800,
    });

    assert.strictEqual(placement.placement, 'bottom');
    assert.strictEqual(placement.isBottomDocked, false);
    assert.ok(placement.top > targetRect.y + targetRect.height);
  });

  it('flips card to top when preferred bottom overflows viewport', () => {
    const targetRect = { x: 400, y: 700, width: 60, height: 40, rx: 8 };
    const placement = computeCardPlacement(targetRect, {
      preferredPlacement: 'bottom',
      cardWidth: 300,
      cardHeight: 150,
      viewportWidth: 1200,
      viewportHeight: 800,
    });

    assert.strictEqual(placement.placement, 'top');
    assert.strictEqual(placement.isBottomDocked, false);
    assert.ok(placement.top < targetRect.y);
  });

  it('clamps card horizontally to maintain 12px margin on screen edges', () => {
    // Target near the far right edge of viewport
    const targetRect = { x: 1180, y: 50, width: 40, height: 40, rx: 8 };
    const placement = computeCardPlacement(targetRect, {
      preferredPlacement: 'bottom',
      cardWidth: 300,
      cardHeight: 150,
      viewportWidth: 1200,
      viewportHeight: 800,
    });

    assert.ok(placement.left + 300 <= 1200 - 12);
  });

  it('docks card at the bottom of the viewport on mobile devices (< 640px) when card cannot sit beside target', () => {
    const targetRect = { x: 20, y: 500, width: 40, height: 40, rx: 8 };
    const placement = computeCardPlacement(targetRect, {
      preferredPlacement: 'bottom',
      cardWidth: 300,
      cardHeight: 150,
      viewportWidth: 375,
      viewportHeight: 667,
    });

    assert.strictEqual(placement.isBottomDocked, true);
    assert.strictEqual(placement.top, 667 - 150 - 76);
  });

  it('generates valid SVG cutout path with fill-rule="evenodd" outer and inner contours', () => {
    const targetRect = { x: 100, y: 150, width: 80, height: 40, rx: 8 };
    const path = buildCutoutSvgPath(1024, 768, targetRect);

    // Must contain outer screen rectangle
    assert.ok(path.startsWith('M 0 0 H 1024 V 768 H 0 Z'));
    // Must contain inner cutout coordinates with arc commands
    assert.ok(path.includes('M 108 150'));
    assert.ok(path.includes('A 8 8'));
  });
});

describe('Coach Mark Tour: Target Resolver & Out-of-Bounds Detection', () => {
  it('detects when an element has scrolled excessively out of bounds (> 150px)', () => {
    const inBoundsElement = {
      getBoundingClientRect: () => ({
        top: 200,
        bottom: 250,
        left: 50,
        right: 150,
      }),
    } as any;
    assert.strictEqual(isTargetScrolledOutOfBounds(inBoundsElement, 150), false);

    const scrolledFarAboveElement = {
      getBoundingClientRect: () => ({
        top: -300,
        bottom: -200,
        left: 50,
        right: 150,
      }),
    } as any;
    assert.strictEqual(isTargetScrolledOutOfBounds(scrolledFarAboveElement, 150), true);

    const scrolledFarBelowElement = {
      getBoundingClientRect: () => ({
        top: 1000,
        bottom: 1100,
        left: 50,
        right: 150,
      }),
    } as any;
    assert.strictEqual(isTargetScrolledOutOfBounds(scrolledFarBelowElement, 150), true);
  });
});

describe('Coach Mark Tour: Privacy-Friendly Analytics Dispatcher', () => {
  it('dispatches analytics events without PII to registered listeners', () => {
    const captured: TourAnalyticsEvent[] = [];
    const unsubscribe = addTourAnalyticsSubscriber((event) => {
      captured.push(event);
    });

    dispatchTourAnalytics({
      event: 'tour_started',
      tourId: 'first-visit-v1',
      version: 1,
      trigger: 'auto',
      variant: 'tour',
      stepCount: 3,
      timestamp: Date.now(),
    });

    dispatchTourAnalytics({
      event: 'tour_step_viewed',
      tourId: 'first-visit-v1',
      stepId: 'search',
      stepIndex: 0,
      totalSteps: 3,
      timestamp: Date.now(),
    });

    dispatchTourAnalytics({
      event: 'tour_completed',
      tourId: 'first-visit-v1',
      version: 1,
      durationMs: 8500,
      timestamp: Date.now(),
    });

    unsubscribe();

    assert.strictEqual(captured.length, 3);
    assert.strictEqual(captured[0].event, 'tour_started');
    assert.strictEqual(captured[1].event, 'tour_step_viewed');
    assert.strictEqual(captured[2].event, 'tour_completed');
  });
});
