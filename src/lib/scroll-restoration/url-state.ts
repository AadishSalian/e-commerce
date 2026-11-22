import { ListingState, ListingStatePatch, ParseResult } from './types';

export const DEFAULT_LISTING_STATE: Readonly<ListingState> = Object.freeze({
  q: '',
  category: 'All',
  brand: [],
  material: [],
  size: [],
  color: [],
  minPrice: null,
  maxPrice: null,
  rating: null,
  inStock: null,
  sort: 'newest',
  page: 1,
});

export const VALID_SORTS = new Set([
  'newest',
  'relevance',
  'price-asc',
  'price-desc',
  'price-low',
  'price-high',
  'rating',
  'rating-desc',
]);

const CANONICAL_PARAM_ORDER = [
  'q',
  'category',
  'brand',
  'material',
  'size',
  'color',
  'price',
  'rating',
  'inStock',
  'sort',
  'page',
] as const;

/**
 * Normalizes array items: trims, filters empty, deduplicates, and sorts alphabetically.
 */
function normalizeStringArray(raw: string | string[] | null | undefined): string[] {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : raw.split(',');
  const cleaned = list
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return Array.from(new Set(cleaned)).sort((a, b) => a.localeCompare(b));
}

/**
 * Parses query string or URLSearchParams into a typed ListingState.
 * Identifies invalid or malformed parameters so they can be cleaned gracefully without crashing.
 */
export function parseListingUrl(
  searchParamsInput: string | URLSearchParams | Record<string, string | string[] | undefined> | null | undefined,
  defaultCategory = 'All'
): ParseResult {
  const params =
    typeof searchParamsInput === 'string'
      ? new URLSearchParams(searchParamsInput.startsWith('?') ? searchParamsInput.slice(1) : searchParamsInput)
      : searchParamsInput instanceof URLSearchParams
      ? searchParamsInput
      : searchParamsInput && typeof searchParamsInput === 'object'
      ? new URLSearchParams(
          Object.entries(searchParamsInput).reduce<Record<string, string>>((acc, [k, v]) => {
            if (v !== undefined) {
              acc[k] = Array.isArray(v) ? v.join(',') : String(v);
            }
            return acc;
          }, {})
        )
      : new URLSearchParams();

  const invalidParams: string[] = [];

  // 1. Search Query
  const rawQ = params.get('q') || params.get('search') || '';
  const q = rawQ.trim();

  // 2. Category
  const rawCategory = params.get('category')?.trim() || defaultCategory;
  const category = rawCategory || defaultCategory;

  // 3. Multi-value string filters (canonical arrays)
  const brand = normalizeStringArray(params.get('brand') || params.getAll('brand'));
  const material = normalizeStringArray(params.get('material') || params.getAll('material'));
  const size = normalizeStringArray(params.get('size') || params.getAll('size'));
  const color = normalizeStringArray(params.get('color') || params.getAll('color'));

  // 4. Price range: supports price=min-max or minPrice=X&maxPrice=Y
  let minPrice: number | null = null;
  let maxPrice: number | null = null;

  const rawPrice = params.get('price');
  if (rawPrice !== null) {
    const parts = rawPrice.split('-').map((s) => s.trim());
    if (parts.length === 2) {
      const minVal = parts[0] ? Number(parts[0]) : null;
      const maxVal = parts[1] ? Number(parts[1]) : null;

      const isValidMin = minVal === null || (!Number.isNaN(minVal) && minVal >= 0);
      const isValidMax = maxVal === null || (!Number.isNaN(maxVal) && maxVal >= 0);

      if (isValidMin && isValidMax && (minVal === null || maxVal === null || minVal <= maxVal)) {
        minPrice = minVal;
        maxPrice = maxVal;
      } else {
        invalidParams.push('price');
      }
    } else {
      invalidParams.push('price');
    }
  } else {
    // Check separate minPrice / maxPrice
    const rawMin = params.get('minPrice');
    const rawMax = params.get('maxPrice');
    if (rawMin !== null) {
      const minVal = Number(rawMin);
      if (!Number.isNaN(minVal) && minVal >= 0) {
        minPrice = minVal;
      } else {
        invalidParams.push('minPrice');
      }
    }
    if (rawMax !== null) {
      const maxVal = Number(rawMax);
      if (!Number.isNaN(maxVal) && maxVal >= 0) {
        maxPrice = maxVal;
      } else {
        invalidParams.push('maxPrice');
      }
    }
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      invalidParams.push('priceRange');
      minPrice = null;
      maxPrice = null;
    }
  }

  // 5. Rating (1 to 5)
  let rating: number | null = null;
  const rawRating = params.get('rating');
  if (rawRating !== null) {
    const rVal = Number(rawRating);
    if (!Number.isNaN(rVal) && rVal >= 1 && rVal <= 5) {
      rating = rVal;
    } else {
      invalidParams.push('rating');
    }
  }

  // 6. In Stock
  let inStock: boolean | null = null;
  const rawInStock = params.get('inStock');
  if (rawInStock !== null) {
    const lower = rawInStock.toLowerCase().trim();
    if (lower === 'true' || lower === '1') {
      inStock = true;
    } else if (lower === 'false' || lower === '0') {
      inStock = false;
    } else {
      invalidParams.push('inStock');
    }
  }

  // 7. Sort
  let sort = 'newest';
  const rawSort = params.get('sort')?.trim();
  if (rawSort) {
    if (VALID_SORTS.has(rawSort)) {
      sort = rawSort;
    } else {
      invalidParams.push('sort');
    }
  }

  // 8. Page (positive integer)
  let page = 1;
  const rawPage = params.get('page');
  if (rawPage !== null) {
    const pVal = parseInt(rawPage, 10);
    if (!Number.isNaN(pVal) && pVal >= 1) {
      page = pVal;
    } else {
      invalidParams.push('page');
    }
  }

  const state: ListingState = {
    q,
    category,
    brand,
    material,
    size,
    color,
    minPrice,
    maxPrice,
    rating,
    inStock,
    sort,
    page,
  };

  const cleanedUrl = serializeListingUrl('', state, defaultCategory);
  const hasInvalidParams = invalidParams.length > 0;

  return {
    state,
    invalidParams,
    cleanedUrl,
    hasInvalidParams,
  };
}

/**
 * Serializes a ListingState object into a canonical, deterministic query string or full URL.
 * Keys are ordered canonically, values sorted alphabetically, and defaults are omitted.
 */
export function serializeListingUrl(
  pathname: string,
  state: Partial<ListingState>,
  defaultCategory = 'All'
): string {
  const merged: ListingState = {
    ...DEFAULT_LISTING_STATE,
    category: defaultCategory,
    ...state,
  };

  const paramEntries: [string, string][] = [];

  for (const key of CANONICAL_PARAM_ORDER) {
    switch (key) {
      case 'q':
        if (merged.q && merged.q.trim()) {
          paramEntries.push(['q', merged.q.trim()]);
        }
        break;
      case 'category':
        if (merged.category && merged.category !== 'All' && merged.category !== defaultCategory) {
          paramEntries.push(['category', merged.category]);
        }
        break;
      case 'brand':
        if (merged.brand && merged.brand.length > 0) {
          const sorted = normalizeStringArray(merged.brand);
          if (sorted.length > 0) paramEntries.push(['brand', sorted.join(',')]);
        }
        break;
      case 'material':
        if (merged.material && merged.material.length > 0) {
          const sorted = normalizeStringArray(merged.material);
          if (sorted.length > 0) paramEntries.push(['material', sorted.join(',')]);
        }
        break;
      case 'size':
        if (merged.size && merged.size.length > 0) {
          const sorted = normalizeStringArray(merged.size);
          if (sorted.length > 0) paramEntries.push(['size', sorted.join(',')]);
        }
        break;
      case 'color':
        if (merged.color && merged.color.length > 0) {
          const sorted = normalizeStringArray(merged.color);
          if (sorted.length > 0) paramEntries.push(['color', sorted.join(',')]);
        }
        break;
      case 'price':
        if (merged.minPrice !== null || merged.maxPrice !== null) {
          const minStr = merged.minPrice !== null ? String(merged.minPrice) : '';
          const maxStr = merged.maxPrice !== null ? String(merged.maxPrice) : '';
          paramEntries.push(['price', `${minStr}-${maxStr}`]);
        }
        break;
      case 'rating':
        if (merged.rating !== null && merged.rating >= 1 && merged.rating <= 5) {
          paramEntries.push(['rating', String(merged.rating)]);
        }
        break;
      case 'inStock':
        if (merged.inStock === true) {
          paramEntries.push(['inStock', 'true']);
        }
        break;
      case 'sort':
        if (merged.sort && merged.sort !== 'newest') {
          paramEntries.push(['sort', merged.sort]);
        }
        break;
      case 'page':
        if (merged.page && merged.page > 1) {
          paramEntries.push(['page', String(merged.page)]);
        }
        break;
    }
  }

  const queryParams = new URLSearchParams();
  for (const [k, v] of paramEntries) {
    queryParams.set(k, v);
  }

  const queryString = queryParams.toString();
  const cleanPath = pathname || '';
  return queryString ? `${cleanPath}?${queryString}` : cleanPath;
}

/**
 * Determines whether a state update represents a major navigation (requires router.push)
 * or a fine-grained refinement (requires router.replace).
 *
 * Major navigation:
 * - Switching category
 * - Executing a brand new search query
 * - Changing pages
 *
 * Fine-grained refinement:
 * - Toggling filter chips (material, brand, size, color)
 * - Adjusting price slider / range
 * - Toggling in-stock
 * - Changing sort order
 */
export function isMajorNavigationChange(prev: ListingState, next: ListingState): boolean {
  if (prev.category !== next.category) return true;
  if (prev.q.trim() !== next.q.trim()) return true;
  if (prev.page !== next.page) return true;
  return false;
}

/**
 * Generates active filter chips metadata with human-readable labels and removal patches.
 */
export interface FilterChip {
  id: string;
  key: keyof ListingState;
  label: string;
  value: string;
  removePatch: ListingStatePatch;
}

export function getActiveFilterChips(state: ListingState): FilterChip[] {
  const chips: FilterChip[] = [];

  // Category chip (if not All)
  if (state.category && state.category !== 'All') {
    chips.push({
      id: `category-${state.category}`,
      key: 'category',
      label: `Category: ${state.category}`,
      value: state.category,
      removePatch: { category: 'All' },
    });
  }

  // Search query chip
  if (state.q && state.q.trim()) {
    chips.push({
      id: `q-${state.q}`,
      key: 'q',
      label: `"${state.q.trim()}"`,
      value: state.q.trim(),
      removePatch: { q: '' },
    });
  }

  // Material chips
  for (const m of state.material) {
    chips.push({
      id: `material-${m}`,
      key: 'material',
      label: m,
      value: m,
      removePatch: {
        material: state.material.filter((item) => item !== m),
      },
    });
  }

  // Brand chips
  for (const b of state.brand) {
    chips.push({
      id: `brand-${b}`,
      key: 'brand',
      label: b,
      value: b,
      removePatch: {
        brand: state.brand.filter((item) => item !== b),
      },
    });
  }

  // Color chips
  for (const c of state.color) {
    chips.push({
      id: `color-${c}`,
      key: 'color',
      label: c,
      value: c,
      removePatch: {
        color: state.color.filter((item) => item !== c),
      },
    });
  }

  // Size chips
  for (const s of state.size) {
    chips.push({
      id: `size-${s}`,
      key: 'size',
      label: `Size ${s}`,
      value: s,
      removePatch: {
        size: state.size.filter((item) => item !== s),
      },
    });
  }

  // Price range chip
  if (state.minPrice !== null || state.maxPrice !== null) {
    const min = state.minPrice !== null ? `$${state.minPrice}` : '$0';
    const max = state.maxPrice !== null ? `$${state.maxPrice}` : '+';
    chips.push({
      id: 'price-range',
      key: 'minPrice',
      label: `${min} - ${max}`,
      value: `${min}-${max}`,
      removePatch: { minPrice: null, maxPrice: null },
    });
  }

  // Rating chip
  if (state.rating !== null) {
    chips.push({
      id: `rating-${state.rating}`,
      key: 'rating',
      label: `${state.rating}+ Stars`,
      value: String(state.rating),
      removePatch: { rating: null },
    });
  }

  // In Stock chip
  if (state.inStock === true) {
    chips.push({
      id: 'in-stock',
      key: 'inStock',
      label: 'In Stock Only',
      value: 'true',
      removePatch: { inStock: null },
    });
  }

  return chips;
}
