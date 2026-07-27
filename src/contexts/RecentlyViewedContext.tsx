'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, MOCK_PRODUCTS } from '@/lib/mockData';

interface RecentlyViewedContextType {
  recentProducts: Product[];
  addViewedProduct: (productId: string) => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

const STORAGE_KEY = 'shop_recently_viewed';
const MAX_RECENT = 10;

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const storedIds = localStorage.getItem(STORAGE_KEY);
      if (storedIds) {
        const ids: string[] = JSON.parse(storedIds);
        // Map IDs back to full products
        const products = ids
          .map(id => MOCK_PRODUCTS.find(p => p.id === id))
          .filter((p): p is Product => p !== undefined);
        setRecentProducts(products);
      }
    } catch (e) {
      console.error('Failed to load recently viewed products', e);
    }
  }, []);

  const addViewedProduct = useCallback((productId: string) => {
    setRecentProducts(prev => {
      // Remove if it already exists to prevent duplicates
      const filtered = prev.filter(p => p.id !== productId);
      
      const newProduct = MOCK_PRODUCTS.find(p => p.id === productId);
      if (!newProduct) return prev;

      const newRecent = [newProduct, ...filtered].slice(0, MAX_RECENT);
      
      // Save just the IDs to local storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecent.map(p => p.id)));
      
      return newRecent;
    });
  }, []);

  return (
    <RecentlyViewedContext.Provider value={{ recentProducts, addViewedProduct }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);
  if (context === undefined) {
    throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider');
  }
  return context;
}
