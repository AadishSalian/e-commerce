import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

interface UIState {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, action?: ToastAction) => void;
  success: (message: string, action?: ToastAction) => void;
  error: (message: string, action?: ToastAction) => void;
  removeToast: (id: string) => void;
  
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  
  isQuickViewOpen: boolean;
  quickViewProduct: any | null;
  openQuickView: (product: any) => void;
  closeQuickView: () => void;

  isCompareOpen: boolean;
  openCompare: () => void;
  closeCompare: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  addToast: (message, type = 'info', action) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, message, type, action }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, action ? 6000 : 4000);
  },
  success: (message, action) => useUIStore.getState().addToast(message, 'success', action),
  error: (message, action) => useUIStore.getState().addToast(message, 'error', action),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  
  isCartOpen: false,
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  
  isQuickViewOpen: false,
  quickViewProduct: null,
  openQuickView: (product) => set({ isQuickViewOpen: true, quickViewProduct: product }),
  closeQuickView: () => set({ isQuickViewOpen: false, quickViewProduct: null }),

  isCompareOpen: false,
  openCompare: () => set({ isCompareOpen: true }),
  closeCompare: () => set({ isCompareOpen: false }),
}));
