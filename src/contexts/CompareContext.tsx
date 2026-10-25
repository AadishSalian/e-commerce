'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Product, MOCK_PRODUCTS } from '@/lib/mockData';
import { useCompareStore } from '@/store/useCompareStore';
import { CompareItem, CanAddResult, PendingCategoryReplacement } from '@/lib/compare/types';
import { useToast } from '@/contexts/ToastContext';

interface CompareContextType {
  items: CompareItem[];
  /** Hydrated product models for the compare items */
  compareQueue: Product[];
  isLoadingProducts: boolean;
  isMinimized: boolean;
  highlightedId: string | null;
  pendingReplacement: PendingCategoryReplacement | null;
  activeCategory: string | null;

  // Actions
  addToCompare: (product: Product, variantId?: string | null) => boolean;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  hasInCompare: (productId: string) => boolean;
  canAddToCompare: (product: Product) => CanAddResult;
  isFull: boolean;
  toggleMinimized: () => void;
  setMinimized: (minimized: boolean) => void;

  // Category replacement dialog
  confirmCategoryReplacement: () => void;
  cancelCategoryReplacement: () => void;

  // Legacy compatibility helpers
  isCompareDrawerOpen: boolean;
  setIsCompareDrawerOpen: (open: boolean) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const store = useCompareStore();
  const { toast } = useToast();
  const [productsCache, setProductsCache] = useState<Record<string, Product>>({});
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Cross-tab sync: listen for storage events from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'matte_compare_v2') {
        store.syncFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [store]);

  // Hydrate full product objects from mock catalog / batch API
  useEffect(() => {
    const itemIds = store.items.map((i) => i.productId);
    if (itemIds.length === 0) return;

    // Check what is already cached
    const missingIds = itemIds.filter((id) => !productsCache[id]);
    if (missingIds.length === 0) return;

    setIsLoadingProducts(true);

    // Hydrate locally from MOCK_PRODUCTS first for instantaneous render
    const newCached: Record<string, Product> = { ...productsCache };
    for (const id of missingIds) {
      const match = MOCK_PRODUCTS.find((p) => p.id === id);
      if (match) {
        newCached[id] = match;
      }
    }
    setProductsCache(newCached);
    setIsLoadingProducts(false);
  }, [store.items, productsCache]);

  // Compute compareQueue array matching store.items order
  const compareQueue = useMemo(() => {
    return store.items
      .map((item) => productsCache[item.productId] || MOCK_PRODUCTS.find((p) => p.id === item.productId))
      .filter((p): p is Product => Boolean(p));
  }, [store.items, productsCache]);

  const addToCompare = useCallback(
    (product: Product, variantId?: string | null): boolean => {
      const res = store.add(product, variantId);
      if (res.success) {
        toast(`Added "${product.name}" to compare (${store.items.length + 1} of 4)`);
        return true;
      }
      if (res.reason === 'duplicate') {
        toast(`"${product.name}" is already in comparison`);
      }
      return false;
    },
    [store, toast]
  );

  const contextValue: CompareContextType = {
    items: store.items,
    compareQueue,
    isLoadingProducts,
    isMinimized: store.isMinimized,
    highlightedId: store.highlightedId,
    pendingReplacement: store.pendingReplacement,
    activeCategory: store.activeCategory,

    addToCompare,
    removeFromCompare: store.remove,
    clearCompare: store.clear,
    hasInCompare: store.has,
    canAddToCompare: store.canAdd,
    isFull: store.isFull(),
    toggleMinimized: store.toggleMinimized,
    setMinimized: store.setMinimized,

    confirmCategoryReplacement: store.confirmCategoryReplacement,
    cancelCategoryReplacement: store.cancelCategoryReplacement,

    isCompareDrawerOpen: !store.isMinimized && store.items.length > 0,
    setIsCompareDrawerOpen: (open: boolean) => store.setMinimized(!open)
  };

  return <CompareContext.Provider value={contextValue}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareContextType {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
