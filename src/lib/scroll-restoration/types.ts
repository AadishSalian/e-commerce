/**
 * Scroll and Filter Restoration - Core Types & Schemas
 *
 * Designed for Next.js App Router & React 19 e-commerce environments.
 * Follows strict principles:
 * 1. URL is single source of truth for filters, sort, and pagination.
 * 2. Snapshots contain only non-personal data (product IDs, numeric metrics).
 * 3. Best-effort anchor restoration with pixel fallback and graceful degradation.
 */

export interface ListingState {
  q: string;
  category: string;
  brand: string[];
  material: string[];
  size: string[];
  color: string[];
  minPrice: number | null;
  maxPrice: number | null;
  rating: number | null;
  inStock: boolean | null;
  sort: string;
  page: number;
}

export type ListingStatePatch = Partial<ListingState>;

export interface FilterUIState {
  expandedGroups: Record<string, boolean>;
  viewMode: 'grid' | 'list';
  showMore: Record<string, boolean>;
}

export interface ScrollSnapshot {
  key: string;              // Unique history entry ID
  url: string;              // Canonical pathname + search
  scrollY: number;          // Fallback scroll position in px
  anchorProductId: string;  // Product ID of clicked/visible card
  anchorOffset: number;     // px from content top/viewport to top of anchor card
  loadedPages: number;      // For infinite scroll / multi-page batch rendering
  viewport: { w: number; h: number };
  savedAt: number;          // Timestamp in ms
  schemaVersion: number;    // Schema migration & validation version
}

export interface ParseResult {
  state: ListingState;
  invalidParams: string[];
  cleanedUrl: string;
  hasInvalidParams: boolean;
}

export interface RestorationResult {
  success: boolean;
  strategy: 'anchor' | 'scrollY' | 'top' | 'none';
  targetScrollY: number;
  corrections: number;
  aborted: boolean;
}

export interface HistoryEntryState {
  __sr_entry_id?: string;
  __sr_type?: 'fresh' | 'traversal' | 'replace';
  __filter_drawer_open?: boolean;
  [key: string]: unknown;
}

export interface LastListingRecord {
  url: string;
  title?: string;
  category?: string;
  savedAt: number;
}
