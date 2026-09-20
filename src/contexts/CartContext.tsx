'use client';

import { useCartStore } from '@/store/useCartStore';
import { useUIStore } from '@/store/useUIStore';

// We keep this export to avoid breaking imports in other files
export function CartProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export const useCart = () => {
  const cartState = useCartStore();
  const uiState = useUIStore();
  
  const itemCount = cartState.cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return {
    ...cartState,
    isCartOpen: uiState.isCartOpen,
    openCart: uiState.openCart,
    closeCart: uiState.closeCart,
    itemCount
  };
};
