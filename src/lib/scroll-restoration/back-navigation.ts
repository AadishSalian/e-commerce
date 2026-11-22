import { LastListingRecord } from './types';
import { getLastListing, saveLastListing } from './snapshot-storage';

export const HAS_LISTING_HISTORY_KEY = '__sr_has_listing_history';

/**
 * Marks that a transition from a listing to a product page occurred in this tab.
 */
export function recordListingExit(record: LastListingRecord): void {
  saveLastListing(record);
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage?.setItem(HAS_LISTING_HISTORY_KEY, '1');
    } catch {}
  }
}

/**
 * Determines whether router.back() is safe to use in the current tab.
 * Router.back() is only safe if:
 * 1. The previous entry in this tab was an internal listing on our store.
 * 2. The document.referrer originates from the same site origin (not Google, external link, or empty).
 */
export function canSafelyRouterBack(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const hasHistoryMarker = window.sessionStorage?.getItem(HAS_LISTING_HISTORY_KEY) === '1';
    if (!hasHistoryMarker) return false;

    // Check referrer
    if (document.referrer) {
      const refUrl = new URL(document.referrer);
      if (refUrl.origin !== window.location.origin) {
        return false;
      }
    }

    // Check history length
    if (window.history.length <= 1) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Handles navigation back to the results listing.
 * Uses router.back() if safe, or router.push(storedUrl) if arrived via deep link.
 */
export function navigateBackToResults(
  router: { back: () => void; push: (url: string) => void },
  fallbackUrl: string = '/products'
): void {
  if (typeof window === 'undefined') {
    router.push(fallbackUrl);
    return;
  }

  // Pre-flag popstate restoration so listing restores snapshot seamlessly
  try {
    window.sessionStorage?.setItem('__sr_is_popstate', '1');
  } catch {}

  if (canSafelyRouterBack()) {
    router.back();
  } else {
    const lastListing = getLastListing();
    const destination = lastListing?.url || fallbackUrl;
    router.push(destination);
  }
}
