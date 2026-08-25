'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/lib/mockData';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  selectedVariant?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number, selectedVariant?: string) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  clearCart: () => void;
  itemCount: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { success, toast } = useToast();
  
  // Try to use auth if available. If CartProvider is above AuthProvider, this will fail.
  // Actually, we must be careful. If CartProvider is outside AuthProvider, useAuth() will throw.
  // Let's assume AuthProvider is above CartProvider. If it throws, we have to catch it, or better yet, make sure the layout wraps properly.
  let auth: any;
  try {
    auth = useAuth();
  } catch (e) {
    auth = { isLoggedIn: false, user: null };
  }
  const { isLoggedIn, user } = auth;
  
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // 1. Initial Load (Local Storage)
  useEffect(() => {
    const saved = localStorage.getItem('cartItems');
    if (saved) {
      try {
        setCartItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cart items', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // 2. Sync from DB when logged in
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      const fetchCart = async () => {
        try {
          const res = await fetch(`/api/cart?userId=${user.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.items && data.items.length > 0) {
              // Merge logic: in a real app you'd merge local cart with DB cart.
              // For simplicity here, we'll just use the DB cart if it has items, 
              // otherwise we will sync our local items up to the DB.
              setCartItems(prev => {
                if (data.items.length > 0) {
                  return data.items;
                }
                return prev;
              });
            }
          }
        } catch (error) {
          console.error("Failed to fetch cart from DB", error);
        }
      };
      fetchCart();
    }
  }, [isLoggedIn, user?.id]);

  // 3. Sync to DB & Local Storage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      
      if (isLoggedIn && user?.id) {
        // Sync to DB
        fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            items: cartItems
          })
        }).catch(err => console.error("Failed to sync cart to DB", err));
      }
    }
  }, [cartItems, isLoaded, isLoggedIn, user?.id]);

  const addToCart = (product: Product, quantity: number, selectedVariant?: string) => {
    setCartItems(prev => {
      // Check if item with same ID and variant exists
      const existingItem = prev.find(item => item.id === product.id && item.selectedVariant === selectedVariant);
      if (existingItem) {
        return prev.map(item => 
          item.cartId === existingItem.cartId 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      // If not, add new
      return [...prev, { ...product, cartId: Math.random().toString(36).substring(7), quantity, selectedVariant }];
    });
    openCart();
    success(`Added ${product.name} to bag`);
  };

  const removeFromCart = (cartId: string) => {
    setCartItems(prev => prev.filter(item => item.cartId !== cartId));
    toast("Item removed from bag");
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => setCartItems([]);

  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, itemCount, isCartOpen, openCart, closeCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
