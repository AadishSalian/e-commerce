import { create } from 'zustand';
import { Product } from '@/lib/mockData';
import { SelectedEmiPlan } from '@/lib/emi/types';
import { PersonalizationCartProperty } from '@/lib/personalization/types';
import {
  useOptimisticCartStore,
  OptimisticCartItem,
  getItemUnitPrice as getOptimisticItemUnitPrice,
} from './useOptimisticCartStore';

export type CartItem = OptimisticCartItem;
export const getItemUnitPrice = getOptimisticItemUnitPrice;

export interface CartState {
  cartItems: CartItem[];
  cartEmiPlan: SelectedEmiPlan | null;
  emiNotification: string | null;
  setEmiNotification: (msg: string | null) => void;
  setCartEmiPlan: (plan: SelectedEmiPlan | null) => void;
  setCartItemEmiPlan: (cartId: string, plan: SelectedEmiPlan | null) => void;
  addToCart: (
    product: Product,
    quantity: number,
    selectedVariant?: string,
    selectedEmiPlan?: SelectedEmiPlan,
    personalization?: PersonalizationCartProperty
  ) => void;
  updatePersonalization: (
    cartId: string,
    personalization: PersonalizationCartProperty
  ) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  clearCart: () => void;

  // New optimistic extensions
  isOnline: boolean;
  isSyncing: boolean;
  isCheckoutGated: boolean;
  reconciliationNotices: any[];
  retryFailedMutation: (cartId: string) => void;
  dismissFailedMutation: (cartId: string) => void;
  dismissNotice: (id: string) => void;
  flushPending: () => Promise<void>;
}

export const useCartStore = () => {
  const store = useOptimisticCartStore();

  return {
    cartItems: store.cartItems,
    cartEmiPlan: store.cartEmiPlan,
    emiNotification: store.emiNotification,
    setEmiNotification: store.setEmiNotification,
    setCartEmiPlan: store.setCartEmiPlan,
    setCartItemEmiPlan: (cartId: string, plan: SelectedEmiPlan | null) => {
      // Set item-level EMI plan
      const items = store.cartItems.map((item) =>
        item.cartId === cartId ? { ...item, selectedEmiPlan: plan || undefined } : item
      );
      useOptimisticCartStore.setState({ cartItems: items, cartEmiPlan: plan || store.cartEmiPlan });
    },
    addToCart: store.addToCart,
    updatePersonalization: (cartId: string, personalization: PersonalizationCartProperty) => {
      const items = store.cartItems.map((item) =>
        item.cartId === cartId
          ? {
              ...item,
              personalization: personalization.isPersonalized ? personalization : undefined,
            }
          : item
      );
      useOptimisticCartStore.setState({ cartItems: items });
    },
    removeFromCart: store.removeFromCart,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,

    // Optimistic extensions
    isOnline: store.isOnline,
    isSyncing: store.isSyncing,
    isCheckoutGated: store.isCheckoutGated,
    reconciliationNotices: store.reconciliationNotices,
    retryFailedMutation: store.retryFailedMutation,
    dismissFailedMutation: store.dismissFailedMutation,
    dismissNotice: store.dismissNotice,
    flushPending: store.flushPending,
    subtotal: store.subtotal,
    shipping: store.shipping,
    isFreeShipping: store.isFreeShipping,
    total: store.total,
  };
};

// Static getState helper for non-React contexts
(useCartStore as any).getState = () => useOptimisticCartStore.getState();
(useCartStore as any).setState = (state: any) => useOptimisticCartStore.setState(state);
(useCartStore as any).subscribe = (fn: any) => useOptimisticCartStore.subscribe(fn);
