import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/lib/mockData';
import { useUIStore } from './useUIStore';

export interface WishlistItem extends Product {
  savedPrice?: number;
  savedAt?: string;
}

interface WishlistState {
  wishlistItems: WishlistItem[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlistItems: [],
      addToWishlist: (product) => {
        set((state) => {
          if (!state.wishlistItems.find((item) => item.id === product.id)) {
            const itemWithMeta: WishlistItem = {
              ...product,
              savedPrice: product.price,
              savedAt: new Date().toISOString(),
            };
            return { wishlistItems: [...state.wishlistItems, itemWithMeta] };
          }
          return state;
        });
        useUIStore.getState().success(`Added ${product.name} to wishlist`);
      },
      removeFromWishlist: (productId) => {
        set((state) => ({
          wishlistItems: state.wishlistItems.filter((item) => item.id !== productId),
        }));
        useUIStore.getState().addToast('Item removed from wishlist');
      },
      toggleWishlist: (product) => {
        const state = get();
        if (state.isInWishlist(product.id)) {
          state.removeFromWishlist(product.id);
        } else {
          state.addToWishlist(product);
        }
      },
      isInWishlist: (productId) => {
        return get().wishlistItems.some((item) => item.id === productId);
      },
      clearWishlist: () => set({ wishlistItems: [] }),
    }),
    {
      name: 'wishlist-storage',
    }
  )
);
