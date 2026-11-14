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
  subtotal: number;
  shipping: number;
  isFreeShipping: boolean;
  total: number;
}

function buildCartState(): CartState {
  const store = useOptimisticCartStore.getState();
  return {
    cartItems: store.cartItems,
    cartEmiPlan: store.cartEmiPlan,
    emiNotification: store.emiNotification,
    setEmiNotification: store.setEmiNotification,
    setCartEmiPlan: store.setCartEmiPlan,
    setCartItemEmiPlan: (cartId: string, plan: SelectedEmiPlan | null) => {
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
}

export function useCartStore(): CartState;
export function useCartStore<T>(selector: (state: CartState) => T): T;
export function useCartStore<T>(selector?: (state: CartState) => T): T | CartState {
  // Subscribe to changes in optimistic cart store
  const store = useOptimisticCartStore();

  const state: CartState = {
    cartItems: store.cartItems,
    cartEmiPlan: store.cartEmiPlan,
    emiNotification: store.emiNotification,
    setEmiNotification: store.setEmiNotification,
    setCartEmiPlan: store.setCartEmiPlan,
    setCartItemEmiPlan: (cartId: string, plan: SelectedEmiPlan | null) => {
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

  return selector ? selector(state) : state;
}

// Static getState helper for non-React contexts
(useCartStore as any).getState = () => buildCartState();
(useCartStore as any).setState = (state: any) => useOptimisticCartStore.setState(state);
(useCartStore as any).subscribe = (fn: any) => useOptimisticCartStore.subscribe(fn);
