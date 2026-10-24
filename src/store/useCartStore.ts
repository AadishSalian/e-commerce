import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/lib/mockData';
import { useUIStore } from './useUIStore';
import { SelectedEmiPlan } from '@/lib/emi/types';
import { calculateEmi, formatEmiCurrency } from '@/lib/emi/calculator';
import { PersonalizationCartProperty } from '@/lib/personalization/types';

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  selectedVariant?: string;
  selectedEmiPlan?: SelectedEmiPlan;
  personalization?: PersonalizationCartProperty;
  addedAt?: string;
  addedPrice?: number;
}

export function getItemUnitPrice(item: CartItem): number {
  const base = item.price;
  const addon = item.personalization?.isPersonalized
    ? item.personalization.price_addon / 100
    : 0;
  return base + addon;
}

interface CartState {
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
}

function arePersonalizationsIdentical(
  a?: PersonalizationCartProperty,
  b?: PersonalizationCartProperty
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.isPersonalized !== b.isPersonalized) return false;
  if (!a.isPersonalized && !b.isPersonalized) return true;

  return (
    a.zone_id === b.zone_id &&
    a.font_id === b.font_id &&
    a.alignment === b.alignment &&
    a.icon_id === b.icon_id &&
    a.monogram_mode === b.monogram_mode &&
    a.foil_color === b.foil_color &&
    a.lines.join('|') === b.lines.join('|')
  );
}

function recalculateCartEmi(
  items: CartItem[],
  currentPlan: SelectedEmiPlan | null
): { updatedPlan: SelectedEmiPlan | null; notification: string | null } {
  if (!currentPlan) return { updatedPlan: null, notification: null };

  const newSubtotal = items.reduce(
    (acc, item) => acc + getItemUnitPrice(item) * item.quantity,
    0
  );

  if (newSubtotal <= 0) {
    return { updatedPlan: null, notification: null };
  }

  // Recalculate using pure calculation utility
  const adjustedDownPayment = Math.min(
    currentPlan.downPayment,
    Math.round(newSubtotal * 0.5)
  );

  const calc = calculateEmi({
    price: newSubtotal,
    downPayment: adjustedDownPayment,
    tenureMonths: currentPlan.tenureMonths,
    annualInterestRate: currentPlan.annualInterestRate,
    processingFee: currentPlan.processingFee,
    isNoCost: currentPlan.isNoCost,
  });

  const oldMonthly = currentPlan.monthlyInstallment;
  const newMonthly = calc.monthlyInstallmentRupees;

  const updatedPlan: SelectedEmiPlan = {
    ...currentPlan,
    originalPrice: newSubtotal,
    downPayment: adjustedDownPayment,
    monthlyInstallment: newMonthly,
    lastInstallment: calc.lastInstallmentRupees,
    totalInterest: calc.totalInterestRupees,
    totalPayable: calc.totalPayableRupees,
    timestamp: Date.now(),
  };

  let notification: string | null = null;
  if (oldMonthly !== newMonthly) {
    notification = `Your EMI was updated to ${formatEmiCurrency(newMonthly)}/month`;
  }

  return { updatedPlan, notification };
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cartItems: [],
      cartEmiPlan: null,
      emiNotification: null,

      setEmiNotification: (msg) => set({ emiNotification: msg }),

      setCartEmiPlan: (plan) => set({ cartEmiPlan: plan }),

      setCartItemEmiPlan: (cartId, plan) => {
        set((state) => ({
          cartItems: state.cartItems.map((item) =>
            item.cartId === cartId
              ? { ...item, selectedEmiPlan: plan || undefined }
              : item
          ),
          cartEmiPlan: plan || state.cartEmiPlan,
        }));
      },

      addToCart: (product, quantity, selectedVariant, selectedEmiPlan, personalization) => {
        set((state) => {
          // Merge rule: Products with different engravings must be separate cart lines
          const existingItem = state.cartItems.find(
            (item) =>
              item.id === product.id &&
              item.selectedVariant === selectedVariant &&
              arePersonalizationsIdentical(item.personalization, personalization)
          );

          let updatedItems: CartItem[];
          if (existingItem) {
            updatedItems = state.cartItems.map((item) =>
              item.cartId === existingItem.cartId
                ? {
                    ...item,
                    quantity: item.quantity + quantity,
                    selectedEmiPlan: selectedEmiPlan || item.selectedEmiPlan,
                  }
                : item
            );
          } else {
            updatedItems = [
              ...state.cartItems,
              {
                ...product,
                cartId: Math.random().toString(36).substring(7),
                quantity,
                selectedVariant,
                selectedEmiPlan,
                personalization: personalization?.isPersonalized ? personalization : undefined,
                addedAt: new Date().toISOString(),
                addedPrice: product.price,
              },
            ];
          }

          const activePlan = selectedEmiPlan || state.cartEmiPlan;
          const { updatedPlan, notification } = recalculateCartEmi(
            updatedItems,
            activePlan
          );

          if (notification) {
            useUIStore.getState().addToast(notification);
          }

          return {
            cartItems: updatedItems,
            cartEmiPlan: updatedPlan,
            emiNotification: notification,
          };
        });

        useUIStore.getState().openCart();
        const customNote = personalization?.isPersonalized
          ? ` (Personalized: "${personalization.lines.filter(Boolean).join(' ')}")`
          : '';
        useUIStore.getState().success(`Added ${product.name}${customNote} to bag`);
      },

      updatePersonalization: (cartId, personalization) => {
        set((state) => {
          const updatedItems = state.cartItems.map((item) =>
            item.cartId === cartId
              ? {
                  ...item,
                  personalization: personalization.isPersonalized ? personalization : undefined,
                }
              : item
          );

          const { updatedPlan, notification } = recalculateCartEmi(
            updatedItems,
            state.cartEmiPlan
          );

          return {
            cartItems: updatedItems,
            cartEmiPlan: updatedPlan,
            emiNotification: notification,
          };
        });
        useUIStore.getState().success('Personalization updated');
      },

      removeFromCart: (cartId) => {
        set((state) => {
          const updatedItems = state.cartItems.filter((item) => item.cartId !== cartId);
          const { updatedPlan, notification } = recalculateCartEmi(
            updatedItems,
            state.cartEmiPlan
          );

          if (notification) {
            useUIStore.getState().addToast(notification);
          }

          return {
            cartItems: updatedItems,
            cartEmiPlan: updatedPlan,
            emiNotification: notification,
          };
        });
        useUIStore.getState().addToast('Item removed from bag');
      },

      updateQuantity: (cartId, delta) => {
        set((state) => {
          const updatedItems = state.cartItems.map((item) => {
            if (item.cartId === cartId) {
              const newQty = Math.max(1, item.quantity + delta);
              return { ...item, quantity: newQty };
            }
            return item;
          });

          const { updatedPlan, notification } = recalculateCartEmi(
            updatedItems,
            state.cartEmiPlan
          );

          if (notification) {
            useUIStore.getState().addToast(notification);
          }

          return {
            cartItems: updatedItems,
            cartEmiPlan: updatedPlan,
            emiNotification: notification,
          };
        });
      },

      clearCart: () => set({ cartItems: [], cartEmiPlan: null, emiNotification: null }),
    }),
    {
      name: 'cart-storage',
    }
  )
);
