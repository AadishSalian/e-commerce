import { ScrollSnapshot, RestorationResult } from './types';
import { getSnapshot, saveSnapshot, ensureHistoryEntryId } from './snapshot-storage';

export interface RestoreOptions {
  entryId: string;
  gridElement?: HTMLElement | null;
  onAnnounce?: (message: string) => void;
  debug?: boolean;
}

let isRestoringInProgress = false;
let cancelRestorationFn: (() => void) | null = null;

/**
 * Checks if the current navigation is a history traversal (popstate / back_forward)
 * or a browser reload vs a fresh navigation.
 */
export function isHistoryTraversalOrReload(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Session popstate flag set by popstate listener
  if (window.sessionStorage?.getItem('__sr_is_popstate') === '1') {
    return true;
  }

  // 2. Performance navigation timing
  try {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries.length > 0) {
      const type = navEntries[0].type;
      if (type === 'back_forward' || type === 'reload') {
        return true;
      }
    }
  } catch {}

  // 3. Window history state traversal marker
  const state = window.history.state;
  if (state && state.__sr_type === 'traversal') {
    return true;
  }

  return false;
}

/**
 * Sets history.scrollRestoration to 'manual' safely.
 */
export function enableManualScrollRestoration(): () => void {
  if (typeof window === 'undefined' || !('scrollRestoration' in window.history)) {
    return () => {};
  }

  const prev = window.history.scrollRestoration;
  try {
    window.history.scrollRestoration = 'manual';
  } catch {}

  return () => {
    try {
      window.history.scrollRestoration = prev;
    } catch {}
  };
}

/**
 * Captures a complete scroll snapshot for the current listing page.
 */
export function captureListingSnapshot(params: {
  entryId: string;
  url: string;
  clickedCardId?: string;
  loadedPages?: number;
  gridElement?: HTMLElement | null;
}): ScrollSnapshot {
  const scrollY = typeof window !== 'undefined' ? Math.round(window.scrollY) : 0;
  const viewport = {
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? window.innerHeight : 800,
  };

  let anchorProductId = params.clickedCardId || '';
  let anchorOffset = 0;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // If no clicked card provided, find the topmost product card currently visible in the viewport
    if (!anchorProductId && params.gridElement) {
      const cards = params.gridElement.querySelectorAll<HTMLElement>('[data-product-id]');
      let closestCard: HTMLElement | null = null;
      let closestTop = Infinity;

      // Find card whose top is >= 0 or closest to viewport top
      for (let i = 0; i < cards.length; i++) {
        const rect = cards[i].getBoundingClientRect();
        if (rect.top >= -100 && rect.top < closestTop) {
          closestTop = rect.top;
          closestCard = cards[i];
          if (rect.top >= 0) break;
        }
      }

      if (closestCard) {
        anchorProductId = closestCard.getAttribute('data-product-id') || '';
        anchorOffset = Math.round(closestCard.getBoundingClientRect().top);
      }
    } else if (anchorProductId) {
      const card = document.querySelector<HTMLElement>(`[data-product-id="${anchorProductId}"]`);
      if (card) {
        anchorOffset = Math.round(card.getBoundingClientRect().top);
      }
    }
  }

  const snapshot: ScrollSnapshot = {
    key: params.entryId,
    url: params.url,
    scrollY,
    anchorProductId,
    anchorOffset,
    loadedPages: params.loadedPages || 1,
    viewport,
    savedAt: Date.now(),
    schemaVersion: 1,
  };

  saveSnapshot(snapshot);
  return snapshot;
}

/**
 * Restores scroll position using Anchor-First strategy with pixel fallback.
 * Includes layout verification and user input cancellation guards.
 */
export async function executeScrollRestoration(
  options: RestoreOptions
): Promise<RestorationResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { success: false, strategy: 'none', targetScrollY: 0, corrections: 0, aborted: false };
  }

  // Cancel any existing restoration loop
  if (cancelRestorationFn) {
    cancelRestorationFn();
    cancelRestorationFn = null;
  }

  const snapshot = getSnapshot(options.entryId);
  if (!snapshot) {
    if (options.debug) console.log('[ScrollRestoration] No snapshot found for entry:', options.entryId);
    return { success: false, strategy: 'none', targetScrollY: 0, corrections: 0, aborted: false };
  }

  if (options.debug) {
    console.log('[ScrollRestoration] Restoring snapshot:', snapshot);
  }

  let isAborted = false;
  let corrections = 0;
  let cleanupListeners: (() => void) | null = null;

  // Cancellation guard: abort immediately if shopper interacts with wheel, touch, pointer, or navigation keys
  const abortOnUserInput = (e: Event) => {
    isAborted = true;
    if (options.debug) console.log(`[ScrollRestoration] User interaction detected (${e.type}). Halting restoration.`);
    if (cleanupListeners) cleanupListeners();
    isRestoringInProgress = false;
  };

  const cancel = () => {
    isAborted = true;
    if (cleanupListeners) cleanupListeners();
    isRestoringInProgress = false;
  };
  cancelRestorationFn = cancel;

  const events = ['wheel', 'touchstart', 'touchmove', 'keydown', 'pointerdown'];
  for (const ev of events) {
    window.addEventListener(ev, abortOnUserInput, { passive: true, capture: true });
  }

  cleanupListeners = () => {
    for (const ev of events) {
      window.removeEventListener(ev, abortOnUserInput, { capture: true });
    }
    cancelRestorationFn = null;
  };

  isRestoringInProgress = true;

  // Check if viewport width changed drastically (e.g. mobile rotation or resize)
  const currentViewportW = window.innerWidth;
  const viewportWidthChangedSignificantly = Math.abs(currentViewportW - snapshot.viewport.w) > 120;

  // 1. Locate Anchor Element
  let anchorEl: HTMLElement | null = null;
  if (snapshot.anchorProductId) {
    anchorEl = document.querySelector<HTMLElement>(`[data-product-id="${snapshot.anchorProductId}"]`);
  }

  let strategy: 'anchor' | 'scrollY' | 'top' = 'top';
  let targetScrollY = 0;

  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  if (anchorEl) {
    strategy = 'anchor';
    const currentTop = anchorEl.getBoundingClientRect().top;
    targetScrollY = Math.max(0, Math.round(currentTop + window.scrollY - snapshot.anchorOffset));
    targetScrollY = Math.min(targetScrollY, maxScroll);
  } else if (!viewportWidthChangedSignificantly && snapshot.scrollY > 0) {
    strategy = 'scrollY';
    targetScrollY = Math.min(snapshot.scrollY, maxScroll);
  } else {
    strategy = 'top';
    targetScrollY = 0;
  }

  if (options.debug) {
    console.log(`[ScrollRestoration] Strategy: ${strategy}, Target ScrollY: ${targetScrollY}px`);
  }

  // 2. Perform Instant Scroll
  const applyScroll = (y: number) => {
    window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });

    // Sync with Lenis if attached to window
    const win = window as any;
    if (win.__lenis && typeof win.__lenis.scrollTo === 'function') {
      try {
        win.__lenis.scrollTo(y, { immediate: true });
      } catch {}
    }
  };

  applyScroll(targetScrollY);

  // 3. Accessibility: Restore focus to clicked card with visible focus ring
  if (anchorEl) {
    const focusable = anchorEl.querySelector<HTMLElement>('a, button') || anchorEl;
    try {
      focusable.focus({ preventScroll: true });
      focusable.setAttribute('data-restored-focus', 'true');
    } catch {}
  } else {
    const heading = document.getElementById('results-heading');
    if (heading) {
      try {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      } catch {}
    }
  }

  // 4. Verification and Micro-Correction Loop
  // Late-loading fonts, images, or layout shifts can offset the card by a few pixels.
  // We verify up to 2 times within 1000ms, stopping immediately if user scrolls.
  const verifyAndCorrect = () => {
    if (isAborted || corrections >= 2 || !anchorEl) return;

    const currentOffset = anchorEl.getBoundingClientRect().top;
    const diff = Math.round(currentOffset - snapshot.anchorOffset);

    // If drifted by more than 4px, correct instantly
    if (Math.abs(diff) > 4) {
      corrections++;
      const correctedY = Math.max(0, Math.round(window.scrollY + diff));
      if (options.debug) {
        console.log(`[ScrollRestoration] Correcting drift (${diff}px). New ScrollY: ${correctedY}px`);
      }
      applyScroll(correctedY);
    }
  };

  // Wait for font load & layout passes
  try {
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!isAborted) verifyAndCorrect();
      });
    }
  } catch {}

  // Micro-adjustment timers at 60ms and 250ms
  const t1 = setTimeout(() => {
    if (!isAborted) verifyAndCorrect();
  }, 60);
  t1.unref?.();

  const t2 = setTimeout(() => {
    if (!isAborted) verifyAndCorrect();
    if (cleanupListeners) cleanupListeners();
    isRestoringInProgress = false;
  }, 250);
  t2.unref?.();

  const safetyTimeout = setTimeout(() => {
    if (cleanupListeners) cleanupListeners();
    isRestoringInProgress = false;
  }, 1000);
  safetyTimeout.unref?.();

  return {
    success: true,
    strategy,
    targetScrollY,
    corrections,
    aborted: false,
  };
}
