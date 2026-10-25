import { create } from 'zustand';

interface BottomElement {
  id: string;
  height: number;
  isMobileOnly?: boolean;
}

interface BottomStackState {
  elements: Map<string, BottomElement>;
  isStickyAddToCartVisible: boolean;
  registerElement: (id: string, height: number, isMobileOnly?: boolean) => void;
  unregisterElement: (id: string) => void;
  setStickyAddToCartVisible: (visible: boolean) => void;
  getBottomOffset: (isMobile: boolean, excludeId?: string) => number;
}

export const useBottomStackStore = create<BottomStackState>()((set, get) => ({
  elements: new Map<string, BottomElement>([
    // Base bottom mobile navigation tab bar height (~64px)
    ['bottom-nav', { id: 'bottom-nav', height: 64, isMobileOnly: true }]
  ]),
  isStickyAddToCartVisible: false,

  registerElement: (id, height, isMobileOnly = false) => {
    set((state) => {
      const updated = new Map(state.elements);
      updated.set(id, { id, height, isMobileOnly });
      return { elements: updated };
    });
  },

  unregisterElement: (id) => {
    set((state) => {
      const updated = new Map(state.elements);
      updated.delete(id);
      return { elements: updated };
    });
  },

  setStickyAddToCartVisible: (visible) => {
    set({ isStickyAddToCartVisible: visible });
  },

  getBottomOffset: (isMobile: boolean, excludeId?: string) => {
    const { elements } = get();
    let total = 0;

    for (const [id, el] of elements.entries()) {
      if (excludeId && id === excludeId) continue;
      if (el.isMobileOnly && !isMobile) continue;
      total += el.height;
    }

    return total;
  }
}));

/**
 * Hook to calculate dynamic bottom padding and tray positioning
 */
export function useBottomStackOffset(isMobile: boolean, excludeId?: string): number {
  return useBottomStackStore((state) => state.getBottomOffset(isMobile, excludeId));
}
