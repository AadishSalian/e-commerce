'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';

export type AlertType = 'PRICE_DROP' | 'BACK_IN_STOCK';

export interface ProductAlert {
  id: string; // usually productId
  productId: string;
  type: AlertType;
  createdAt: number;
}

interface AlertsContextType {
  alerts: ProductAlert[];
  addAlert: (productId: string, type: AlertType) => void;
  removeAlert: (productId: string, type: AlertType) => void;
  hasAlert: (productId: string, type: AlertType) => boolean;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

const STORAGE_KEY = 'shop_product_alerts';

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<ProductAlert[]>([]);
  const { success } = useToast();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setAlerts(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load product alerts', e);
    }
  }, []);

  const addAlert = (productId: string, type: AlertType) => {
    // Prevent duplicates
    if (alerts.some(a => a.productId === productId && a.type === type)) {
      return;
    }
    
    const newAlert: ProductAlert = {
      id: `${productId}-${type}`,
      productId,
      type,
      createdAt: Date.now()
    };
    
    const updated = [...alerts, newAlert];
    setAlerts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    success(`You will be notified when this product is ${type === 'PRICE_DROP' ? 'discounted' : 'back in stock'}.`);
  };

  const removeAlert = (productId: string, type: AlertType) => {
    setAlerts((prev) => {
      const updated = prev.filter(a => !(a.productId === productId && a.type === type));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const hasAlert = (productId: string, type: AlertType) => {
    return alerts.some(a => a.productId === productId && a.type === type);
  };

  return (
    <AlertsContext.Provider value={{ alerts, addAlert, removeAlert, hasAlert }}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertsContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
}
