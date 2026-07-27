'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Product } from '@/lib/mockData';
import { useToast } from '@/contexts/ToastContext';

interface CompareContextType {
  compareQueue: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isCompareDrawerOpen: boolean;
  setIsCompareDrawerOpen: (isOpen: boolean) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareQueue, setCompareQueue] = useState<Product[]>([]);
  const [isCompareDrawerOpen, setIsCompareDrawerOpen] = useState(false);
  const { toast, error } = useToast();

  const addToCompare = useCallback((product: Product) => {
    if (compareQueue.find(p => p.id === product.id)) {
      toast('Product is already in compare list.');
      return;
    }
    if (compareQueue.length >= 3) {
      error('You can only compare up to 3 products at a time.');
      return;
    }

    toast('Added to comparison.');
    if (compareQueue.length >= 1) {
      setIsCompareDrawerOpen(true);
    }
    
    setCompareQueue(prev => [...prev, product]);
  }, [compareQueue, toast, error]);

  const removeFromCompare = useCallback((productId: string) => {
    const isOnlyItem = compareQueue.length === 1 && compareQueue[0].id === productId;
    if (isOnlyItem) {
      setIsCompareDrawerOpen(false);
    }
    setCompareQueue(prev => prev.filter(p => p.id !== productId));
  }, [compareQueue]);

  const clearCompare = useCallback(() => {
    setCompareQueue([]);
    setIsCompareDrawerOpen(false);
  }, []);

  return (
    <CompareContext.Provider 
      value={{ 
        compareQueue, 
        addToCompare, 
        removeFromCompare, 
        clearCompare,
        isCompareDrawerOpen,
        setIsCompareDrawerOpen
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
