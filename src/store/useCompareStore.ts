import { create } from 'zustand';
import { Product } from '@/lib/mockData';
import {
  CompareItem,
  MAX_COMPARE_ITEMS,
  COMPARE_STORAGE_KEY,
  COMPARE_MINIMIZED_KEY,
  CanAddResult,
  PendingCategoryReplacement
} from '@/lib/compare/types';

interface CompareState {
  items: CompareItem[];
  isMinimized: boolean;
  highlightedId: string | null;
  pendingReplacement: PendingCategoryReplacement | null;
  activeCategory: string | null;

  // Actions
  add: (product: Product, variantId?: string | null) => { success: boolean; reason?: string };
  remove: (productId: string) => void;
  clear: () => void;
  has: (productId: string) => boolean;
  isFull: () => boolean;
  canAdd: (product: Product) => CanAddResult;
  setMinimized: (minimized: boolean) => void;
  toggleMinimized: () => void;
  setHighlightedId: (id: string | null) => void;

  // Category replacement dialog actions
  requestCategoryReplacement: (product: Product, variantId?: string | null) => void;
  confirmCategoryReplacement: () => void;
  cancelCategoryReplacement: () => void;

  // Storage and cross-tab sync
  syncFromStorage: () => void;
  syncFromServer: (serverItems: CompareItem[]) => void;
}

/**
 * Validates and sanitizes stored compare items from localStorage
 */
function sanitizeStoredItems(raw: unknown): CompareItem[] {
  if (!Array.isArray(raw)) return [];
  const valid: CompareItem[] = [];

  for (const item of raw) {
    if (
      item &&
      typeof item === 'object' &&
      typeof item.productId === 'string' &&
      typeof item.categoryId === 'string' &&
      typeof item.addedAt === 'number'
    ) {
      // Validate same category consistency on read
      if (valid.length === 0 || valid[0].categoryId === item.categoryId) {
        valid.push({
          productId: item.productId,
          variantId: typeof item.variantId === 'string' ? item.variantId : null,
          categoryId: item.categoryId,
          addedAt: item.addedAt
        });
      }
    }
    if (valid.length >= MAX_COMPARE_ITEMS) break;
  }

  return valid;
}

function loadInitialItems(): CompareItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return sanitizeStoredItems(parsed);
  } catch (err) {
    console.warn('Compare storage read fallback to memory:', err);
    return [];
  }
}

function loadInitialMinimized(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(COMPARE_MINIMIZED_KEY) === 'true';
  } catch {
    return false;
  }
}

function persistItems(items: CompareItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to persist compare items:', err);
  }
}

function persistMinimized(minimized: boolean) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(COMPARE_MINIMIZED_KEY, String(minimized));
  } catch {
    // Ignore in private browsing
  }
}

export const useCompareStore = create<CompareState>()((set, get) => {
  const initialItems = loadInitialItems();
  const initialCategory = initialItems.length > 0 ? initialItems[0].categoryId : null;

  return {
    items: initialItems,
    isMinimized: loadInitialMinimized(),
    highlightedId: null,
    pendingReplacement: null,
    activeCategory: initialCategory,

    has: (productId: string) => {
      return get().items.some((i) => i.productId === productId);
    },

    isFull: () => {
      return get().items.length >= MAX_COMPARE_ITEMS;
    },

    canAdd: (product: Product): CanAddResult => {
      const { items, activeCategory } = get();

      // Non-comparable items (e.g. gift cards or products without category)
      if (!product || !product.category || product.category === 'Gift Cards') {
        return {
          canAdd: false,
          reason: 'not_comparable',
          itemCount: items.length
        };
      }

      // Check duplicate
      if (items.some((i) => i.productId === product.id)) {
        return {
          canAdd: false,
          reason: 'duplicate',
          itemCount: items.length
        };
      }

      // Check category match
      if (items.length > 0 && activeCategory && activeCategory !== product.category) {
        return {
          canAdd: false,
          reason: 'different_category',
          existingCategory: activeCategory,
          itemCount: items.length
        };
      }

      // Check max limit
      if (items.length >= MAX_COMPARE_ITEMS) {
        return {
          canAdd: false,
          reason: 'limit_reached',
          itemCount: items.length
        };
      }

      return {
        canAdd: true,
        itemCount: items.length
      };
    },

    add: (product: Product, variantId?: string | null) => {
      const state = get();
      const check = state.canAdd(product);

      if (!check.canAdd) {
        // If duplicate: trigger highlight pulse on existing slot
        if (check.reason === 'duplicate') {
          set({ highlightedId: product.id });
          setTimeout(() => {
            if (get().highlightedId === product.id) {
              set({ highlightedId: null });
            }
          }, 1400);
          return { success: false, reason: 'duplicate' };
        }

        // If different category: prompt replacement modal/inline dialog
        if (check.reason === 'different_category') {
          state.requestCategoryReplacement(product, variantId);
          return { success: false, reason: 'different_category' };
        }

        return { success: false, reason: check.reason };
      }

      const newItem: CompareItem = {
        productId: product.id,
        variantId: variantId || null,
        categoryId: product.category,
        addedAt: Date.now()
      };

      const updated = [...state.items, newItem];
      persistItems(updated);

      set({
        items: updated,
        activeCategory: product.category,
        highlightedId: null
      });

      return { success: true };
    },

    remove: (productId: string) => {
      set((state) => {
        const updated = state.items.filter((i) => i.productId !== productId);
        persistItems(updated);
        const newCategory = updated.length > 0 ? updated[0].categoryId : null;
        return {
          items: updated,
          activeCategory: newCategory,
          highlightedId: null
        };
      });
    },

    clear: () => {
      persistItems([]);
      set({
        items: [],
        activeCategory: null,
        pendingReplacement: null,
        highlightedId: null
      });
    },

    setMinimized: (minimized: boolean) => {
      persistMinimized(minimized);
      set({ isMinimized: minimized });
    },

    toggleMinimized: () => {
      set((state) => {
        const next = !state.isMinimized;
        persistMinimized(next);
        return { isMinimized: next };
      });
    },

    setHighlightedId: (id: string | null) => {
      set({ highlightedId: id });
    },

    requestCategoryReplacement: (product: Product, variantId?: string | null) => {
      const { items, activeCategory } = get();
      set({
        pendingReplacement: {
          incomingProduct: {
            id: product.id,
            name: product.name,
            category: product.category,
            image: product.image,
            price: product.price,
            variantId: variantId || null
          },
          currentCategory: activeCategory || 'Current Category',
          newCategory: product.category,
          currentCount: items.length
        }
      });
    },

    confirmCategoryReplacement: () => {
      const { pendingReplacement } = get();
      if (!pendingReplacement) return;

      const p = pendingReplacement.incomingProduct;
      const newItem: CompareItem = {
        productId: p.id,
        variantId: p.variantId || null,
        categoryId: p.category,
        addedAt: Date.now()
      };

      const updated = [newItem];
      persistItems(updated);

      set({
        items: updated,
        activeCategory: p.category,
        pendingReplacement: null,
        isMinimized: false
      });
    },

    cancelCategoryReplacement: () => {
      set({ pendingReplacement: null });
    },

    syncFromStorage: () => {
      const items = loadInitialItems();
      const activeCategory = items.length > 0 ? items[0].categoryId : null;
      set({ items, activeCategory });
    },

    syncFromServer: (serverItems: CompareItem[]) => {
      if (!Array.isArray(serverItems)) return;
      const { items: localItems } = get();

      // Merge and deduplicate, respecting current active category if set
      const category = localItems.length > 0 ? localItems[0].categoryId : (serverItems[0]?.categoryId || null);
      if (!category) return;

      const combined: CompareItem[] = [...localItems];
      for (const item of serverItems) {
        if (item.categoryId === category && !combined.some((c) => c.productId === item.productId)) {
          combined.push(item);
        }
        if (combined.length >= MAX_COMPARE_ITEMS) break;
      }

      persistItems(combined);
      set({ items: combined, activeCategory: category });
    }
  };
});
