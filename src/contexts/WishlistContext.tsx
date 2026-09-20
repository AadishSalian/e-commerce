'use client';

import React from 'react';
import { useWishlistStore } from '@/store/useWishlistStore';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export const useWishlist = () => {
  const store = useWishlistStore();
  const itemCount = store.wishlistItems.length;
  return { ...store, itemCount };
};
