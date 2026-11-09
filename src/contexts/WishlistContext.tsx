'use client';

import React, { useEffect, useMemo } from 'react';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Product, MOCK_PRODUCTS } from '@/lib/mockData';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const initialize = useWishlistStore((state) => state.initialize);
  const syncGuestOnLogin = useWishlistStore((state) => state.syncGuestOnLogin);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Merge guest items on login
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      syncGuestOnLogin(user.id);
    }
  }, [isLoggedIn, user?.id, syncGuestOnLogin]);

  return <>{children}</>;
}

export const useWishlist = () => {
  const store = useWishlistStore();

  // Backward compatibility: expose wishlistItems as items from active or all boards
  const activeEnriched = useMemo(() => {
    const active = store.enrichedWishlists.find((w) => w.id === store.activeWishlistId);
    return active || store.enrichedWishlists[0];
  }, [store.enrichedWishlists, store.activeWishlistId]);

  const legacyWishlistItems = useMemo(() => {
    const rawItems = activeEnriched?.items || [];
    return rawItems.map((it) => {
      const p = MOCK_PRODUCTS.find((prod) => prod.id === it.productId);
      return {
        ...(p || {}),
        id: it.productId,
        name: it.productName || p?.name || '',
        price: it.currentPriceMinor ? it.currentPriceMinor / 100 : p?.price || 0,
        image: it.productImage || p?.image || '',
        category: it.productCategory || p?.category || '',
        description: p?.description || '',
        isNew: p?.isNew ?? false,
        savedPrice: it.addedPrice ? it.addedPrice / 100 : undefined,
        savedAt: it.addedAt,
      } as any;
    });
  }, [activeEnriched?.items]);

  const allItems = useMemo(() => {
    return store.items;
  }, [store.items]);

  const itemCount = store.items.length;

  return {
    ...store,
    activeWishlist: activeEnriched,
    wishlistItems: legacyWishlistItems,
    enrichedItems: activeEnriched?.items || [],
    allItems,
    itemCount,
    addToWishlist: (product: Product) => store.toggleQuickSave(product),
    removeFromWishlist: (productId: string) => {
      const containing = store.getWishlistsContainingProduct(productId);
      containing.forEach((listId) => store.removeItemFromBoard(listId, productId));
    },
    toggleWishlist: (product: Product) => store.toggleQuickSave(product),
  };
};
