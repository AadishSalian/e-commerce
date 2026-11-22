'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { CATEGORIES } from '@/lib/mockData';
import { searchProducts, SearchResult } from '@/lib/search';
import { Filter } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import ProductCard from '@/components/product/ProductCard';
import FilterToolbar from '@/components/product/FilterToolbar';
import {
  parseListingUrl,
  serializeListingUrl,
  isMajorNavigationChange,
  useScrollRestoration,
  ListingStatePatch,
} from '@/lib/scroll-restoration';

export default function SearchClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse state from URL
  const { state, hasInvalidParams, cleanedUrl } = useMemo(() => {
    return parseListingUrl(searchParams, 'All');
  }, [searchParams]);

  const query = state.q || '';
  const [invalidNotice, setInvalidNotice] = useState<string | null>(null);

  // Clean invalid parameters from URL
  useEffect(() => {
    if (hasInvalidParams) {
      router.replace(cleanedUrl, { scroll: false });
      setInvalidNotice('One or more invalid filter parameters were removed from the URL.');
    }
  }, [hasInvalidParams, cleanedUrl, router]);

  // Execute raw text search
  const rawSearchResults = useMemo(() => {
    if (!query) return [];
    return searchProducts(query);
  }, [query]);

  // Apply secondary filters (category, price, rating, inStock) and sort
  const processedResults = useMemo(() => {
    let list = rawSearchResults.map((r) => r.product);

    // Category
    if (state.category && state.category !== 'All') {
      list = list.filter((p) => p.category.toLowerCase() === state.category.toLowerCase());
    }

    // Material
    if (state.material.length > 0) {
      list = list.filter((p) => {
        const mat = (p.attributes?.material as string) || '';
        const desc = p.description.toLowerCase();
        return state.material.some((m) => mat.toLowerCase().includes(m.toLowerCase()) || desc.includes(m.toLowerCase()));
      });
    }

    // Price
    if (state.minPrice !== null) list = list.filter((p) => p.price >= state.minPrice!);
    if (state.maxPrice !== null) list = list.filter((p) => p.price <= state.maxPrice!);

    // Rating
    if (state.rating !== null) list = list.filter((p) => (p.rating || 4.5) >= state.rating!);

    // In Stock
    if (state.inStock === true) {
      list = list.filter((p) => p.stockCount === undefined || p.stockCount > 0);
    }

    // Sorting
    return list.sort((a, b) => {
      if (state.sort === 'price-asc' || state.sort === 'price-low') return a.price - b.price;
      if (state.sort === 'price-desc' || state.sort === 'price-high') return b.price - a.price;
      if (state.sort === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      if (state.sort === 'rating') return (b.rating || 4.5) - (a.rating || 4.5);
      return 0; // default 'relevance'
    });
  }, [rawSearchResults, state]);

  // Scroll Restoration hook for search
  const {
    gridRef,
    handleCardClick,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    announcement,
    setAnnouncement,
  } = useScrollRestoration({
    listingId: 'search-results-listing',
    itemsCount: processedResults.length,
    isReady: true,
  });

  useEffect(() => {
    if (query) {
      setAnnouncement(
        `Showing ${processedResults.length} search result${
          processedResults.length === 1 ? '' : 's'
        } for "${query}".`
      );
    }
  }, [processedResults.length, query, setAnnouncement]);

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
    router.push(serializeListingUrl(pathname, { q: state.q }), { scroll: false });
  };

  return (
    <div className="min-h-screen bg-background pt-8 md:pt-4 pb-32">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header Section */}
        <div className="mb-10">
          <h1 id="results-heading" className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4 focus:outline-none">
            Search Results
          </h1>
          <p className="text-text-muted text-lg max-w-2xl" aria-live="polite">
            {query ? (
              `${rawSearchResults.length} total result${rawSearchResults.length === 1 ? '' : 's'} for "${query}"`
            ) : (
              'Enter a search term to find products across our catalog.'
            )}
          </p>
        </div>

        {/* Filter & Sort Toolbar */}
        {rawSearchResults.length > 0 && (
          <FilterToolbar
            state={state}
            totalResults={processedResults.length}
            invalidParamsNotice={invalidNotice}
            onClearInvalidParamsNotice={() => setInvalidNotice(null)}
            onUpdateState={handleUpdateState}
            onResetFilters={handleResetFilters}
            isDrawerOpen={isDrawerOpen}
            onOpenDrawer={openDrawer}
            onCloseDrawer={closeDrawer}
          />
        )}

        {/* Product Grid */}
        {processedResults.length > 0 ? (
          <div
            ref={gridRef}
            className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 md:gap-x-8 md:gap-y-16"
          >
            {processedResults.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="default"
                onCardClick={handleCardClick}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="py-24 text-center max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-4">No matches found</h2>
            <p className="text-text-muted text-lg mb-8">
              We couldn&apos;t find anything matching &quot;{query}&quot;. Try checking your spelling or relaxing filters.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="px-6 py-3 bg-[#8ed500] text-[#121212] font-semibold rounded-full hover:bg-[#7ac500] transition-colors"
              >
                Browse All Products
              </Link>
              <Link
                href="/products?sort=newest"
                className="px-6 py-3 bg-surface text-foreground font-medium rounded-full hover:bg-surface-hover transition-colors border border-border"
              >
                Shop New Arrivals
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
