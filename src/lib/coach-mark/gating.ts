import { CoachMarkFeatureFlags, DEFAULT_FEATURE_FLAGS, DEFAULT_TOUR_CONFIG } from './config';
import { isEligibleByPersistence } from './persistence';
import { TourConfig } from './types';
import { dispatchTourAnalytics } from './analytics';

export interface GatingContext {
  pathname: string;
  searchParams?: URLSearchParams | Record<string, string>;
  isLoggedIn?: boolean;
  userOrderCount?: number;
  hasEngagedDeeply?: boolean;
  hasActiveOverlays?: boolean;
  isIntroComplete?: boolean;
  featureFlags?: CoachMarkFeatureFlags;
}

const BOT_USER_AGENT_REGEX =
  /(bot|crawler|spider|googlebot|bingbot|lighthouse|slurp|duckduckbot|baiduspider|yandexbot|headlesschrome)/i;

/**
 * Checks whether the current user-agent represents an automated bot or crawler.
 */
export function isBotOrCrawler(): boolean {
  if (typeof navigator === 'undefined' || !navigator.userAgent) return false;
  return BOT_USER_AGENT_REGEX.test(navigator.userAgent);
}

/**
 * Checks if the current URL contains marketing, affiliate, or shared link parameters
 * indicating the user arrived with a distinct deep-link intent.
 */
export function isDeepLink(
  pathname: string,
  searchParams?: URLSearchParams | Record<string, string>
): boolean {
  // Shared wishlist routes
  if (pathname.startsWith('/w/')) return true;

  // Single product direct navigation
  if (/^\/products\/[a-zA-Z0-9_-]+$/.test(pathname) && pathname !== '/products') {
    return true;
  }

  // Deep link tracking queries
  if (searchParams) {
    const hasParam = (key: string) => {
      if (searchParams instanceof URLSearchParams) {
        return searchParams.has(key);
      }
      return key in searchParams;
    };

    const deepParams = ['utm_source', 'utm_medium', 'ref', 'share', 'token', 'invite', 'source'];
    for (const p of deepParams) {
      if (hasParam(p)) return true;
    }
  }

  return false;
}

/**
 * Checks whether the route is in the allowed whitelist for the coach mark tour.
 */
export function isRouteAllowed(pathname: string, allowedRoutes: string[]): boolean {
  // Normalize pathname by stripping trailing slashes
  const cleanPath = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return allowedRoutes.some((route) => {
    const cleanRoute = route.length > 1 && route.endsWith('/') ? route.slice(0, -1) : route;
    return cleanPath === cleanRoute;
  });
}

/**
 * Checks if user has prefers-reduced-motion enabled.
 */
export function checkPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Master gating evaluation function that determines whether the coach mark tour
 * should automatically run for the current session.
 */
export function evaluateTourEligibility(
  config: TourConfig = DEFAULT_TOUR_CONFIG,
  context: GatingContext
): { eligible: boolean; reason?: string } {
  const flags = context.featureFlags || DEFAULT_FEATURE_FLAGS;

  // 1. Remote kill switch check
  if (!flags.isTourEnabled) {
    return { eligible: false, reason: 'kill_switch_active' };
  }

  // 2. A/B testing control branch
  if (flags.tourVariant === 'control') {
    dispatchTourAnalytics({
      event: 'tour_ab_control_assigned',
      tourId: config.id,
      variant: 'control',
      timestamp: Date.now(),
    });
    return { eligible: false, reason: 'ab_control_group' };
  }

  // 3. Bot and crawler suppression
  if (isBotOrCrawler()) {
    return { eligible: false, reason: 'bot_or_crawler' };
  }

  // 4. Route check
  if (!isRouteAllowed(context.pathname, config.allowedRoutes)) {
    return { eligible: false, reason: 'ineligible_route' };
  }

  // 5. Deep link check
  if (isDeepLink(context.pathname, context.searchParams)) {
    return { eligible: false, reason: 'deep_link_detected' };
  }

  // 6. Returning or logged-in user with history check
  if (context.isLoggedIn && (context.userOrderCount || 0) > 0) {
    return { eligible: false, reason: 'returning_user_with_history' };
  }

  // 7. Storage / persistence check (completed or skipped previously)
  if (!isEligibleByPersistence(config)) {
    return { eligible: false, reason: 'already_completed_or_skipped' };
  }

  // 8. Deep engagement check (added to cart, checkout started, etc.)
  if (context.hasEngagedDeeply) {
    return { eligible: false, reason: 'shopper_deeply_engaged' };
  }

  // 9. Overlay collisions (other modals, cookie banner, intro)
  if (context.hasActiveOverlays) {
    return { eligible: false, reason: 'overlay_collision' };
  }

  // 10. Site intro completion
  if (context.isIntroComplete === false) {
    return { eligible: false, reason: 'intro_pending' };
  }

  return { eligible: true };
}
