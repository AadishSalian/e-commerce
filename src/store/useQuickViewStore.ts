import { create } from 'zustand';
import { Product } from '@/lib/mockData';

interface QuickViewState {
  activeProduct: Product | null;
  isOpen: boolean;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
}

export const useQuickViewStore = create<QuickViewState>((set) => ({
  activeProduct: null,
  isOpen: false,
  openQuickView: (product) => {
    set({ activeProduct: product, isOpen: true });
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('overflow', 'hidden');
      document.body.setAttribute('data-lenis-prevent', 'true');
    }
  },
  closeQuickView: () => {
    set({ isOpen: false });
    if (typeof document !== 'undefined') {
      document.documentElement.style.removeProperty('overflow');
      document.body.removeAttribute('data-lenis-prevent');
    }
  },
}));
