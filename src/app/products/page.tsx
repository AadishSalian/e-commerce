'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { PullToRefresh } from '@/components/ui';
import ProductCard from '@/components/product/ProductCard';
import FilterToolbar from '@/components/product/FilterToolbar';
import {
  parseListingUrl,
  serializeListingUrl,
  applyListingFilters,
  isMajorNavigationChange,
  useScrollRestoration,
  ListingStatePatch,
} from '@/lib/scroll-restoration';

const PAGE_SIZE = 12;

function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse typed state from URL (the single source of truth)
  const parseResult = useMemo(() => {
    return parseListingUrl(searchParams, 'All');
  }, [searchParams]);

  const { state, hasInvalidParams, cleanedUrl } = parseResult;
  const [invalidNotice, setInvalidNotice] = useState<string | null>(null);

  // Clean invalid parameters from the URL immediately via router.replace
  useEffect(() => {
    if (hasInvalidParams) {
      router.replace(cleanedUrl, { scroll: false });
      setInvalidNotice('One or more invalid filter parameters were removed from the URL.');
    }
  }, [hasInvalidParams, cleanedUrl, router]);

  // Apply unified filtering and sorting
  const allFilteredProducts = useMemo(() => {
    return applyListingFilters(MOCK_PRODUCTS, state);
  }, [state]);

  // Multi-page chunking (infinite scroll / load more)
  const [loadedPages, setLoadedPages] = useState(state.page || 1);

  // Synchronize state.page if URL specifies page > 1
  useEffect(() => {
    if (state.page && state.page > loadedPages) {
      setLoadedPages(state.page);
    }
  }, [state.page, loadedPages]);

  const displayedProducts = useMemo(() => {
    const count = loadedPages * PAGE_SIZE;
    return allFilteredProducts.slice(0, count);
  }, [allFilteredProducts, loadedPages]);

  const hasMore = displayedProducts.length < allFilteredProducts.length;

  // Scroll Restoration hook
  const {
    gridRef,
    handleCardClick,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    filterUI,
    updateFilterUI,
    announcement,
    setAnnouncement,
  } = useScrollRestoration({
    listingId: 'products-collection',
    itemsCount: displayedProducts.length,
    isReady: displayedProducts.length > 0 || allFilteredProducts.length === 0,
    loadedPages,
    onBatchLoadPages: async (targetPages) => {
      setLoadedPages(targetPages);
    },
    debug: false,
  });

  // Announce results changes for screen readers
  useEffect(() => {
    const count = allFilteredProducts.length;
    const filterDesc = state.category !== 'All' ? ` in ${state.category}` : '';
    setAnnouncement(`Showing ${count} product${count === 1 ? '' : 's'}${filterDesc}.`);
  }, [allFilteredProducts.length, state.category, setAnnouncement]);

  // Filter update handler: push for major changes, replace for fine-grained
  const handleUpdateState = (patch: ListingStatePatch, forceMajor?: boolean) => {
    const nextState = { ...state, ...patch };
    const isMajor = forceMajor !== undefined ? forceMajor : isMajorNavigationChange(state, nextState);
    const nextUrl = serializeListingUrl(pathname, nextState);

    if (isMajor) {
      router.push(nextUrl, { scroll: false });
    } else {
      router.replace(nextUrl, { scroll: false });
    }
  };

  const handleResetFilters = () => {
    router.push('/products', { scroll: false });
  };

  const handleLoadMore = () => {
    const nextPages = loadedPages + 1;
    setLoadedPages(nextPages);
    handleUpdateState({ page: nextPages }, false);
  };

  const handleRefresh = async () => {
    await new Promise((resolve) => setTimeout(resolve, 800));
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background pt-8 md:pt-4 pb-32">
        <div className="container mx-auto px-4 md:px-8">
          {/* Header Section */}
          <div className="mb-10">
            <h1 id="results-heading" className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4 focus:outline-none">
              The Collection.
            </h1>
            <p className="text-text-muted text-lg max-w-2xl">
              Precision-engineered objects for your daily workflow. Designed to integrate seamlessly, built to last.
            </p>
            {/* Polite screen reader announcement region */}
            <p className="sr-only" aria-live="polite">
              {announcement}
            </p>
          </div>

          {/* Unified Filter Toolbar with URL Source of Truth */}
          <FilterToolbar
            state={state}
            totalResults={allFilteredProducts.length}
            invalidParamsNotice={invalidNotice}
            onClearInvalidParamsNotice={() => setInvalidNotice(null)}
            onUpdateState={handleUpdateState}
            onResetFilters={handleResetFilters}
            isDrawerOpen={isDrawerOpen}
            onOpenDrawer={openDrawer}
            onCloseDrawer={closeDrawer}
            filterUI={filterUI}
            onUpdateFilterUI={updateFilterUI}
          />

          {/* Product Grid with Anchor Ref */}
          <div
            ref={gridRef}
            className={
              filterUI.viewMode === 'list'
                ? 'flex flex-col gap-6'
                : 'grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 md:gap-x-8 md:gap-y-16'
            }
          >
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="default"
                onCardClick={handleCardClick}
              />
            ))}
          </div>

          {/* Load More Button for Infinite Progression */}
          {hasMore && (
            <div className="mt-16 flex flex-col items-center justify-center gap-3">
              <button
                onClick={handleLoadMore}
                className="px-8 py-3.5 rounded-full bg-surface hover:bg-surface-hover border border-border text-foreground font-semibold text-sm transition-all hover:scale-105"
              >
                Load More Products ({allFilteredProducts.length - displayedProducts.length} remaining)
              </button>
              <span className="text-xs text-text-muted">
                Showing {displayedProducts.length} of {allFilteredProducts.length} items
              </span>
            </div>
          )}

          {/* Empty State */}
          {allFilteredProducts.length === 0 && (
            <div className="py-24 text-center">
              <h3 className="text-xl font-bold text-foreground mb-2">No matching products found</h3>
              <p className="text-text-muted text-sm max-w-md mx-auto mb-6">
                Try loosening your filters or resetting to view the complete catalog.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-2.5 rounded-full bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}

function ProductsPageSkeleton() {
  return (
    <div className="min-h-screen bg-background pt-8 md:pt-4 pb-32">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-10 animate-pulse">
          <div className="h-10 w-64 bg-surface rounded-lg mb-4" />
          <div className="h-5 w-96 bg-surface rounded-lg" />
        </div>
        <div className="h-14 w-full bg-surface rounded-xl mb-12 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 md:gap-x-8 md:gap-y-16">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 animate-pulse">
              <div className="w-full aspect-[4/5] bg-surface rounded-xl" />
              <div className="h-4 w-3/4 bg-surface rounded" />
              <div className="h-4 w-1/4 bg-surface rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsContent />
    </Suspense>
  );
}
