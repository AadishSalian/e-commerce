'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ensureHistoryEntryId,
  saveFilterUIState,
  getFilterUIState,
  getSnapshot,
  clearAllSnapshots,
} from './snapshot-storage';
import {
  captureListingSnapshot,
  enableManualScrollRestoration,
  executeScrollRestoration,
  isHistoryTraversalOrReload,
} from './restoration-engine';
import { recordListingExit } from './back-navigation';
import { FilterUIState, ListingState } from './types';

export interface UseScrollRestorationOptions {
  listingId: string;
  itemsCount: number;
  isReady?: boolean;
  loadedPages?: number;
  onBatchLoadPages?: (targetPages: number) => Promise<void>;
  debug?: boolean;
}

export function useScrollRestoration({
  listingId,
  itemsCount,
  isReady = true,
  loadedPages = 1,
  onBatchLoadPages,
  debug = false,
}: UseScrollRestorationOptions) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [entryId, setEntryId] = useState<string>('');
  const [hasRestored, setHasRestored] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const gridRef = useRef<HTMLDivElement | null>(null);
  const isBfcacheRestored = useRef(false);
  const scrollThrottleTimer = useRef<NodeJS.Timeout | null>(null);

  // Filter UI state (open/collapsed filter sections, view mode)
  const [filterUI, setFilterUI] = useState<FilterUIState>(() => {
    return (
      getFilterUIState(listingId) || {
        expandedGroups: { Category: true, Price: true, Material: true, Brand: true },
        viewMode: 'grid',
        showMore: {},
      }
    );
  });

  // Ensure unique history entry ID on mount
  useEffect(() => {
    const id = ensureHistoryEntryId();
    setEntryId(id);
  }, [pathname]);

  // Set manual scroll restoration on listing route
  useEffect(() => {
    const cleanup = enableManualScrollRestoration();
    return cleanup;
  }, []);

  // Listen to popstate for Mobile Filter Drawer history integration
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // Mark session flag so listing knows it's a history traversal
      try {
        window.sessionStorage?.setItem('__sr_is_popstate', '1');
      } catch {}

      // If mobile filter drawer was open, close it instead of leaving
      if (isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isDrawerOpen]);

  // Handle bfcache (Back-Forward Cache) pageshow
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Returned from bfcache: DOM and scroll are already intact!
        isBfcacheRestored.current = true;
        setHasRestored(true);
        if (debug) console.log('[ScrollRestoration] Restored from bfcache. Skipping manual DOM scroll.');
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [debug]);

  // Throttled scroll snapshotting (~500ms) for crash/discard resilience
  useEffect(() => {
    if (!entryId) return;

    const handleScroll = () => {
      if (scrollThrottleTimer.current) return;
      scrollThrottleTimer.current = setTimeout(() => {
        scrollThrottleTimer.current = null;
        const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        captureListingSnapshot({
          entryId,
          url: currentUrl,
          loadedPages,
          gridElement: gridRef.current,
        });
      }, 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollThrottleTimer.current) {
        clearTimeout(scrollThrottleTimer.current);
      }
    };
  }, [entryId, pathname, searchParams, loadedPages]);

  // Capture snapshot on visibilitychange / pagehide
  useEffect(() => {
    if (!entryId) return;

    const handlePageHide = () => {
      const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      captureListingSnapshot({
        entryId,
        url: currentUrl,
        loadedPages,
        gridElement: gridRef.current,
      });
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handlePageHide();
      }
    });

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [entryId, pathname, searchParams, loadedPages]);

  // Main Restoration Trigger: Restore content first, then scroll position
  useEffect(() => {
    if (!entryId || !isReady || hasRestored || isBfcacheRestored.current) return;

    const isHistory = isHistoryTraversalOrReload();
    if (!isHistory) {
      // Fresh navigation: start at top of page
      if (debug) console.log('[ScrollRestoration] Fresh navigation. Staying at top.');
      setHasRestored(true);
      return;
    }

    const snapshot = getSnapshot(entryId);
    if (!snapshot) {
      setHasRestored(true);
      return;
    }

    // Step 1: If infinite scroll has missing pages, load them in one batch before scrolling
    const restoreFlow = async () => {
      if (onBatchLoadPages && snapshot.loadedPages > loadedPages) {
        if (debug) {
          console.log(`[ScrollRestoration] Batch loading pages up to ${snapshot.loadedPages}`);
        }
        await onBatchLoadPages(snapshot.loadedPages);
      }

      // Step 2: Content rendered. Now restore scroll position.
      requestAnimationFrame(() => {
        executeScrollRestoration({
          entryId,
          gridElement: gridRef.current,
          debug,
        }).then((result) => {
          setHasRestored(true);
          // Clear session popstate marker so subsequent in-page actions behave normally
          try {
            window.sessionStorage?.removeItem('__sr_is_popstate');
          } catch {}
        });
      });
    };

    restoreFlow();
  }, [entryId, isReady, hasRestored, loadedPages, onBatchLoadPages, debug]);

  // Convenience helper when a shopper clicks a product card
  const handleCardClick = useCallback(
    (productId: string) => {
      if (!entryId) return;

      const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      // Capture snapshot with explicit clicked card
      captureListingSnapshot({
        entryId,
        url: currentUrl,
        clickedCardId: productId,
        loadedPages,
        gridElement: gridRef.current,
      });

      // Record last listing exit so product page's "Back to results" link knows where to return
      recordListingExit({
        url: currentUrl,
        savedAt: Date.now(),
      });
    },
    [entryId, pathname, searchParams, loadedPages]
  );

  // Mobile Filter Drawer control with history integration
  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
    if (typeof window !== 'undefined') {
      window.history.pushState(
        { ...window.history.state, __filter_drawer_open: true },
        ''
      );
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    // If the top history state has our drawer marker, pop it safely
    if (typeof window !== 'undefined' && window.history.state?.__filter_drawer_open) {
      window.history.back();
    }
  }, []);

  // Update & persist Filter UI state (accordions, view mode)
  const updateFilterUI = useCallback(
    (updater: (prev: FilterUIState) => FilterUIState) => {
      setFilterUI((prev) => {
        const next = updater(prev);
        saveFilterUIState(listingId, next);
        return next;
      });
    },
    [listingId]
  );

  return {
    gridRef,
    entryId,
    hasRestored,
    handleCardClick,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    filterUI,
    updateFilterUI,
    announcement,
    setAnnouncement,
  };
}
