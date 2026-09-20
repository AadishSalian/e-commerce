import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/lib/mockData';
import { useUIStore } from './useUIStore';

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  selectedVariant?: string;
}

interface CartState {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number, selectedVariant?: string) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartItems: [],
      addToCart: (product, quantity, selectedVariant) => {
        set((state) => {
          const existingItem = state.cartItems.find(
            (item) => item.id === product.id && item.selectedVariant === selectedVariant
          );
          if (existingItem) {
            return {
              cartItems: state.cartItems.map((item) =>
                item.cartId === existingItem.cartId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return {
            cartItems: [
              ...state.cartItems,
              {
                ...product,
                cartId: Math.random().toString(36).substring(7),
                quantity,
                selectedVariant,
              },
            ],
          };
        });
        useUIStore.getState().openCart();
        useUIStore.getState().success(`Added ${product.name} to bag`);
      },
      removeFromCart: (cartId) => {
        set((state) => ({
          cartItems: state.cartItems.filter((item) => item.cartId !== cartId),
        }));
        useUIStore.getState().addToast('Item removed from bag');
      },
      updateQuantity: (cartId, delta) => {
        set((state) => ({
          cartItems: state.cartItems.map((item) => {
            if (item.cartId === cartId) {
              const newQty = Math.max(1, item.quantity + delta);
              return { ...item, quantity: newQty };
            }
            return item;
          }),
        }));
      },
      clearCart: () => set({ cartItems: [] }),
    }),
    {
      name: 'cart-storage',
    }
  )
);
