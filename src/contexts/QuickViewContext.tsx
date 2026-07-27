'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Product } from '@/lib/mockData';

interface QuickViewContextType {
  activeProduct: Product | null;
  isOpen: boolean;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
}

const QuickViewContext = createContext<QuickViewContextType | undefined>(undefined);

export function QuickViewProvider({ children }: { children: React.ReactNode }) {
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openQuickView = useCallback((product: Product) => {
    setActiveProduct(product);
    setIsOpen(true);
    // Lock body scroll
    document.documentElement.style.setProperty('overflow', 'hidden');
    document.body.setAttribute('data-lenis-prevent', 'true');
  }, []);

  const closeQuickView = useCallback(() => {
    setIsOpen(false);
    // Unlock body scroll
    document.documentElement.style.removeProperty('overflow');
    document.body.removeAttribute('data-lenis-prevent');
  }, []);

  return (
    <QuickViewContext.Provider 
      value={{ 
        activeProduct, 
        isOpen, 
        openQuickView, 
        closeQuickView 
      }}
    >
      {children}
    </QuickViewContext.Provider>
  );
}

export function useQuickView() {
  const context = useContext(QuickViewContext);
  if (context === undefined) {
    throw new Error('useQuickView must be used within a QuickViewProvider');
  }
  return context;
}
