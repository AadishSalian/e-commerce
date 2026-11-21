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
  count?: number;
  durationMs?: number;
}

interface UIState {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, action?: ToastAction, durationMs?: number) => void;
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
  addToast: (message, type = 'info', action, durationMs = 5500) => {
    set((state) => {
      // Group repeated failure toasts into one message (Section 6)
      const existingIndex = state.toasts.findIndex(
        (t) => t.type === type && t.message.replace(/\s*\(\d+\)$/, '') === message.replace(/\s*\(\d+\)$/, '')
      );

      if (existingIndex >= 0) {
        const existing = state.toasts[existingIndex];
        const newCount = (existing.count || 1) + 1;
        const baseMsg = message.replace(/\s*\(\d+\)$/, '');
        const updated = [...state.toasts];
        updated[existingIndex] = {
          ...existing,
          message: `${baseMsg} (${newCount})`,
          count: newCount,
          action: action || existing.action,
          durationMs,
        };
        return { toasts: updated };
      }

      const id = Math.random().toString(36).substring(2, 9);
      return {
        toasts: [...state.toasts, { id, message, type, action, count: 1, durationMs }],
      };
    });
  },
  success: (message, action) => useUIStore.getState().addToast(message, 'success', action, 5500),
  error: (message, action) => useUIStore.getState().addToast(message, 'error', action, 5500),
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
