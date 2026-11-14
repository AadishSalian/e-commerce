import { create } from 'zustand';
import {
  Wishlist,
  WishlistItem,
  EnrichedWishlist,
  EnrichedWishlistItem,
  WishlistShareOptions,
  WISHLIST_LIMITS,
} from '@/lib/wishlist/types';
import { Product, MOCK_PRODUCTS } from '@/lib/mockData';
import { toMinorUnits } from '@/lib/price-history/currency';
import { announcer } from '@/lib/optimistic/announcer';
import { useAuthStore } from './useAuthStore';
import { useUIStore } from './useUIStore';

const STORAGE_KEY = 'matte_wishlist_boards_v1';

export interface WishlistPickerPayload {
  product: Product;
  variantId?: string | null;
  variantLabel?: string | null;
}

interface WishlistState {
  // State
  wishlists: Wishlist[];
  items: WishlistItem[];
  enrichedWishlists: EnrichedWishlist[];
  activeWishlistId: string;
  isLoading: boolean;
  isInitialized: boolean;
  savedItemKeys: string[]; // "${productId}::${variantId || ''}" or "${productId}"

  // Modal / Sheet controllers
  pickerPayload: WishlistPickerPayload | null;
  isPickerOpen: boolean;
  shareTargetWishlist: Wishlist | null;
  isShareOpen: boolean;
  notificationsTargetWishlist: Wishlist | null;
  isNotificationsOpen: boolean;

  // Undo soft-deletion buffer
  pendingUndo: {
    wishlist: Wishlist;
    items: WishlistItem[];
    expiresAt: number;
    timer: any;
  } | null;

  // Actions
  initialize: () => Promise<void>;
  setActiveWishlistId: (id: string) => void;
  openPicker: (product: Product, variantId?: string | null, variantLabel?: string | null) => void;
  closePicker: () => void;
  openShareDialog: (wishlist: Wishlist) => void;
  closeShareDialog: () => void;
  openNotificationsModal: (wishlist: Wishlist) => void;
  closeNotificationsModal: () => void;

  // Primary heart interactions
  toggleQuickSave: (product: Product, variantId?: string | null, variantLabel?: string | null) => Promise<void>;
  isInWishlist: (productId: string, variantId?: string | null) => boolean;
  getWishlistsContainingProduct: (productId: string, variantId?: string | null) => string[];

  // Board CRUD
  createBoard: (name: string, description?: string, isGiftList?: boolean, occasionDate?: string | null) => Promise<Wishlist>;
  updateBoard: (id: string, updates: Partial<Wishlist>) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  undoDeleteBoard: () => Promise<void>;

  // Item CRUD
  addItemToBoard: (wishlistId: string, product: Product, variantId?: string | null, note?: string) => Promise<void>;
  removeItemFromBoard: (wishlistId: string, productId: string, variantId?: string | null) => Promise<void>;
  removeItemById: (itemId: string) => Promise<void>;
  updateItemNoteOrPriority: (itemId: string, note?: string, priority?: 'top_pick' | null) => Promise<void>;
  reorderItems: (wishlistId: string, itemIdsInOrder: string[]) => Promise<void>;
  moveOrCopyItems: (sourceWishlistId: string, targetWishlistId: string, itemIds: string[], action: 'move' | 'copy') => Promise<void>;

  // Sharing
  shareBoard: (wishlistId: string, options: WishlistShareOptions) => Promise<{ shareToken: string; shareUrl: string }>;
  revokeShare: (wishlistId: string) => Promise<void>;
  rotateShare: (wishlistId: string, options?: WishlistShareOptions) => Promise<{ shareToken: string; shareUrl: string }>;

  // Guest sync
  syncGuestOnLogin: (userId: string) => Promise<void>;
  refreshEnriched: () => Promise<void>;
}

function makeKey(productId: string, variantId?: string | null): string {
  return `${productId}::${variantId || ''}`;
}

function getStoredLocalData(): { wishlists: Wishlist[]; items: WishlistItem[] } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.wishlists) && Array.isArray(parsed?.items)) {
      return parsed;
    }
  } catch (e) {
    console.warn('Could not read wishlist from local storage', e);
  }
  return null;
}

function setStoredLocalData(wishlists: Wishlist[], items: WishlistItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        wishlists,
        items,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.warn('Could not persist wishlist to local storage', e);
  }
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlists: [],
  items: [],
  enrichedWishlists: [],
  activeWishlistId: '',
  isLoading: false,
  isInitialized: false,
  savedItemKeys: [],

  pickerPayload: null,
  isPickerOpen: false,
  shareTargetWishlist: null,
  isShareOpen: false,
  notificationsTargetWishlist: null,
  isNotificationsOpen: false,

  pendingUndo: null,

  initialize: async () => {
    if (get().isInitialized) return;
    set({ isLoading: true });

    const auth = useAuthStore.getState();
    const isAuthed = auth.isLoggedIn && auth.user?.id;

    if (isAuthed) {
      try {
        const res = await fetch(`/api/wishlists?userId=${auth.user!.id}&include=items&enriched=true`);
        if (res.ok) {
          const json = await res.json();
          const wishlists: Wishlist[] = (json.wishlists || []).map((w: any) => ({
            id: w.id,
            ownerId: w.ownerId,
            name: w.name,
            description: w.description,
            coverImage: w.coverImage,
            visibility: w.visibility,
            shareToken: w.shareToken,
            shareOptions: w.shareOptions,
            isDefault: w.isDefault,
            isGiftList: w.isGiftList,
            occasionDate: w.occasionDate,
            notifyPriceDrops: w.notifyPriceDrops,
            notifyChannels: w.notifyChannels,
            sortMode: w.sortMode,
            createdAt: w.createdAt,
            updatedAt: w.updatedAt,
          }));

          const allItems: WishlistItem[] = (json.wishlists || []).flatMap((w: any) => w.items || []);
          const defaultList = wishlists.find((w) => w.isDefault) || wishlists[0];

          const keys = allItems.map((it) => makeKey(it.productId, it.variantId));

          set({
            wishlists,
            items: allItems,
            enrichedWishlists: json.wishlists || [],
            activeWishlistId: defaultList?.id || '',
            savedItemKeys: keys,
            isInitialized: true,
            isLoading: false,
          });
          return;
        }
      } catch (err) {
        console.error('Failed to load server wishlists, falling back to local:', err);
      }
    }

    // Guest Mode or offline fallback
    let local = getStoredLocalData();
    if (!local || local.wishlists.length === 0) {
      const now = new Date().toISOString();
      const defaultList: Wishlist = {
        id: 'wl_local_default',
        ownerId: 'guest',
        name: 'My wishlist',
        description: 'Your personal collection of saved items.',
        coverImage: null,
        visibility: 'private',
        shareToken: null,
        shareOptions: {
          showOwnerName: false,
          expirationDays: 'never',
          expiresAt: null,
        },
        isDefault: true,
        isGiftList: false,
        occasionDate: null,
        notifyPriceDrops: false,
        notifyChannels: { email: true, push: false, sms: false },
        sortMode: 'manual',
        createdAt: now,
        updatedAt: now,
      };
      local = {
        wishlists: [defaultList],
        items: [],
      };
      setStoredLocalData(local.wishlists, local.items);
    }

    const defaultList = local.wishlists.find((w) => w.isDefault) || local.wishlists[0];
    const keys = local.items.map((it) => makeKey(it.productId, it.variantId));

    set({
      wishlists: local.wishlists,
      items: local.items,
      activeWishlistId: defaultList?.id || '',
      savedItemKeys: keys,
      isInitialized: true,
      isLoading: false,
    });

    // Populate enriched representation
    get().refreshEnriched();

    // Multi-tab synchronization
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const synced = JSON.parse(e.newValue);
            if (Array.isArray(synced?.wishlists) && Array.isArray(synced?.items)) {
              const newKeys = synced.items.map((it: any) => makeKey(it.productId, it.variantId));
              set({
                wishlists: synced.wishlists,
                items: synced.items,
                savedItemKeys: newKeys,
              });
              get().refreshEnriched();
            }
          } catch {}
        }
      });
    }
  },

  setActiveWishlistId: (id) => set({ activeWishlistId: id }),

  openPicker: (product, variantId, variantLabel) => {
    set({
      pickerPayload: { product, variantId, variantLabel },
      isPickerOpen: true,
    });
  },

  closePicker: () => {
    set({ pickerPayload: null, isPickerOpen: false });
  },

  openShareDialog: (wishlist) => {
    set({ shareTargetWishlist: wishlist, isShareOpen: true });
  },

  closeShareDialog: () => {
    set({ shareTargetWishlist: null, isShareOpen: false });
  },

  openNotificationsModal: (wishlist) => {
    set({ notificationsTargetWishlist: wishlist, isNotificationsOpen: true });
  },

  closeNotificationsModal: () => {
    set({ notificationsTargetWishlist: null, isNotificationsOpen: false });
  },

  isInWishlist: (productId, variantId) => {
    const { items } = get();
    return items.some((it) => {
      if (it.productId !== productId) return false;
      if (variantId !== undefined && variantId !== null) {
        return (it.variantId || null) === (variantId || null);
      }
      return true; // Any variant on any list
    });
  },

  getWishlistsContainingProduct: (productId, variantId) => {
    const { items } = get();
    return items
      .filter((it) => {
        if (it.productId !== productId) return false;
        if (variantId !== undefined && variantId !== null) {
          return (it.variantId || null) === (variantId || null);
        }
        return true;
      })
      .map((it) => it.wishlistId);
  },

  /**
   * Primary entry point: tapping the heart saves to the default list immediately (optimistic).
   * Shows a small toast: "Saved to My wishlist" with [Change] button opening list picker.
   * If already saved in exactly one list, tapping heart removes it.
   * If saved in multiple lists, opens picker so user can pick which list to remove from.
   */
  toggleQuickSave: async (product, variantId, variantLabel) => {
    const state = get();
    const auth = useAuthStore.getState();
    const defaultList = state.wishlists.find((w) => w.isDefault) || state.wishlists[0];

    if (!defaultList) return;

    const containingLists = state.getWishlistsContainingProduct(product.id, variantId);

    // If item is already on several lists -> open picker to choose
    if (containingLists.length > 1) {
      state.openPicker(product, variantId, variantLabel);
      return;
    }

    // If item is on exactly 1 list -> remove it
    if (containingLists.length === 1) {
      const listId = containingLists[0];
      await state.removeItemFromBoard(listId, product.id, variantId);
      const listName = state.wishlists.find((w) => w.id === listId)?.name || 'wishlist';
      useUIStore.getState().addToast(`Removed from ${listName}`, 'info');
      return;
    }

    // Otherwise: Save to default list immediately (optimistic)
    await state.addItemToBoard(defaultList.id, product, variantId);

    const variantPart = variantLabel ? ` (${variantLabel})` : '';
    const msg = `Saved${variantPart} to ${defaultList.name}`;

    // Small toast with Change action
    useUIStore.getState().addToast(
      `${msg}`,
      'success',
      {
        label: 'Change',
        onClick: () => {
          state.openPicker(product, variantId, variantLabel);
        },
      }
    );
  },

  createBoard: async (name, description, isGiftList, occasionDate) => {
    const state = get();
    const auth = useAuthStore.getState();
    const isAuthed = auth.isLoggedIn && auth.user?.id;

    // Check limit
    const maxLists = isAuthed
      ? WISHLIST_LIMITS.MAX_LISTS_PER_ACCOUNT
      : WISHLIST_LIMITS.MAX_LISTS_FOR_GUEST;
    if (state.wishlists.length >= maxLists) {
      throw new Error(`Maximum limit of ${maxLists} boards reached.`);
    }

    if (isAuthed) {
      const res = await fetch('/api/wishlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: auth.user!.id,
          name,
          description,
          isGiftList,
          occasionDate,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create board');
      }
      const data = await res.json();
      const created: Wishlist = data.wishlist;
      set({
        wishlists: [...get().wishlists, created],
        activeWishlistId: created.id,
      });
      await get().refreshEnriched();
      return created;
    }

    // Local storage board
    const now = new Date().toISOString();
    const newBoard: Wishlist = {
      id: `wl_local_${Date.now()}`,
      ownerId: 'guest',
      name: name.trim(),
      description: description?.trim() || undefined,
      coverImage: null,
      visibility: 'private',
      shareToken: null,
      shareOptions: {
        showOwnerName: false,
        expirationDays: 'never',
        expiresAt: null,
      },
      isDefault: false,
      isGiftList: !!isGiftList,
      occasionDate: occasionDate || null,
      notifyPriceDrops: false,
      notifyChannels: { email: true, push: false, sms: false },
      sortMode: 'manual',
      createdAt: now,
      updatedAt: now,
    };

    const updated = [...state.wishlists, newBoard];
    set({
      wishlists: updated,
      activeWishlistId: newBoard.id,
    });
    setStoredLocalData(updated, state.items);
    await get().refreshEnriched();
    return newBoard;
  },

  updateBoard: async (id, updates) => {
    const state = get();
    const auth = useAuthStore.getState();
    const isAuthed = auth.isLoggedIn && auth.user?.id;

    const updatedWishlists = state.wishlists.map((w) =>
      w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
    );
    set({ wishlists: updatedWishlists });

    if (isAuthed) {
      try {
        await fetch(`/api/wishlists/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: auth.user!.id, ...updates }),
        });
      } catch (e) {
        console.error('Failed to sync board update:', e);
      }
    } else {
      setStoredLocalData(updatedWishlists, state.items);
    }
    await get().refreshEnriched();
  },

  /**
   * Soft-deletes board with a 10-second undo window.
   */
  deleteBoard: async (id) => {
    const state = get();
    const target = state.wishlists.find((w) => w.id === id);
    if (!target) return;
    if (target.isDefault) {
      throw new Error('The default wishlist cannot be deleted.');
    }

    // Clear previous pending undo if any
    if (state.pendingUndo?.timer) {
      clearTimeout(state.pendingUndo.timer);
    }

    const itemsForBoard = state.items.filter((it) => it.wishlistId === id);

    // Optimistically remove from state
    const remainingLists = state.wishlists.filter((w) => w.id !== id);
    const remainingItems = state.items.filter((it) => it.wishlistId !== id);
    const defaultList = remainingLists.find((w) => w.isDefault) || remainingLists[0];

    const timer = setTimeout(async () => {
      // Actually finalize deletion on server
      const auth = useAuthStore.getState();
      if (auth.isLoggedIn && auth.user?.id) {
        try {
          await fetch(`/api/wishlists/${id}?userId=${auth.user.id}`, { method: 'DELETE' });
        } catch {}
      }
      set({ pendingUndo: null });
    }, WISHLIST_LIMITS.UNDO_WINDOW_MS);

    set({
      wishlists: remainingLists,
      items: remainingItems,
      activeWishlistId: defaultList?.id || '',
      pendingUndo: {
        wishlist: target,
        items: itemsForBoard,
        expiresAt: Date.now() + WISHLIST_LIMITS.UNDO_WINDOW_MS,
        timer,
      },
    });

    setStoredLocalData(remainingLists, remainingItems);
    await get().refreshEnriched();

    useUIStore.getState().addToast(
      `"${target.name}" deleted`,
      'info',
      {
        label: 'Undo',
        onClick: () => {
          get().undoDeleteBoard();
        },
      }
    );
  },

  undoDeleteBoard: async () => {
    const { pendingUndo } = get();
    if (!pendingUndo) return;

    clearTimeout(pendingUndo.timer);

    const restoredLists = [...get().wishlists, pendingUndo.wishlist];
    const restoredItems = [...get().items, ...pendingUndo.items];

    set({
      wishlists: restoredLists,
      items: restoredItems,
      activeWishlistId: pendingUndo.wishlist.id,
      pendingUndo: null,
    });

    const auth = useAuthStore.getState();
    if (auth.isLoggedIn && auth.user?.id) {
      try {
        await fetch(`/api/wishlists/${pendingUndo.wishlist.id}/undo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: auth.user.id }),
        });
      } catch {}
    } else {
      setStoredLocalData(restoredLists, restoredItems);
    }

    await get().refreshEnriched();
    useUIStore.getState().success(`Restored "${pendingUndo.wishlist.name}"`);
  },

  addItemToBoard: async (wishlistId, product, variantId, note) => {
    const state = get();
    const auth = useAuthStore.getState();
    const isAuthed = auth.isLoggedIn && auth.user?.id;

    // Check duplicate
    const exists = state.items.some(
      (it) =>
        it.wishlistId === wishlistId &&
        it.productId === product.id &&
        (it.variantId || null) === (variantId || null)
    );

    if (exists) {
      // Highlight existing item
      return;
    }

    const currentCount = state.items.filter((it) => it.wishlistId === wishlistId).length;
    if (currentCount >= WISHLIST_LIMITS.MAX_ITEMS_PER_LIST) {
      throw new Error(`Limit of ${WISHLIST_LIMITS.MAX_ITEMS_PER_LIST} items per board reached.`);
    }

    const addedPrice = toMinorUnits(product.price);
    const now = new Date().toISOString();

    const newItem: WishlistItem = {
      id: `wli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      wishlistId,
      productId: product.id,
      variantId: variantId || null,
      addedAt: now,
      note: note || undefined,
      priority: null,
      addedPrice,
      position: currentCount,
    };

    const previousItems = [...state.items];
    const previousKeys = [...state.savedItemKeys];
    const newItems = [...state.items, newItem];
    const newKeys = [...state.savedItemKeys, makeKey(product.id, variantId)];

    set({
      items: newItems,
      savedItemKeys: newKeys,
    });
    announcer.announce(`${product.name} saved to wishlist`, 'polite');

    if (isAuthed) {
      try {
        const res = await fetch(`/api/wishlists/${wishlistId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: auth.user!.id,
            productId: product.id,
            variantId,
            note,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          // Update ID if returned
          if (data.item?.id) {
            set((s) => ({
              items: s.items.map((it) => (it.id === newItem.id ? data.item : it)),
            }));
          }
        } else {
          throw new Error('Server rejected save');
        }
      } catch (e) {
        set({ items: previousItems, savedItemKeys: previousKeys });
        useUIStore.getState().error(`Couldn't save ${product.name}. Try again`, {
          label: 'Retry',
          onClick: () => get().addItemToBoard(wishlistId, product, variantId, note),
        });
        announcer.announce(`Couldn't save ${product.name}`, 'assertive');
      }
    } else {
      setStoredLocalData(state.wishlists, newItems);
    }

    await get().refreshEnriched();
  },

  removeItemFromBoard: async (wishlistId, productId, variantId) => {
    const state = get();
    const item = state.items.find(
      (it) =>
        it.wishlistId === wishlistId &&
        it.productId === productId &&
        (it.variantId || null) === (variantId || null)
    );
    if (!item) return;

    await state.removeItemById(item.id);
  },

  removeItemById: async (itemId) => {
    const state = get();
    const item = state.items.find((it) => it.id === itemId);
    if (!item) return;

    const previousItems = [...state.items];
    const previousKeys = [...state.savedItemKeys];
    const remainingItems = state.items.filter((it) => it.id !== itemId);
    const newKeys = remainingItems.map((it) => makeKey(it.productId, it.variantId));

    set({
      items: remainingItems,
      savedItemKeys: newKeys,
    });
    announcer.announce('Item removed from wishlist', 'polite');

    const auth = useAuthStore.getState();
    if (auth.isLoggedIn && auth.user?.id) {
      try {
        const res = await fetch(`/api/wishlists/${item.wishlistId}/items/${itemId}?userId=${auth.user.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Delete failed');
      } catch (e) {
        set({ items: previousItems, savedItemKeys: previousKeys });
        useUIStore.getState().error("Couldn't remove item from wishlist. Try again", {
          label: 'Retry',
          onClick: () => get().removeItemById(itemId),
        });
        announcer.announce("Couldn't remove item from wishlist", 'assertive');
      }
    } else {
      setStoredLocalData(state.wishlists, remainingItems);
    }

    await get().refreshEnriched();
  },

  updateItemNoteOrPriority: async (itemId, note, priority) => {
    const state = get();
    const item = state.items.find((it) => it.id === itemId);
    if (!item) return;

    const updatedItems = state.items.map((it) =>
      it.id === itemId
        ? {
            ...it,
            note: note !== undefined ? note : it.note,
            priority: priority !== undefined ? priority : it.priority,
          }
        : it
    );

    set({ items: updatedItems });

    const auth = useAuthStore.getState();
    if (auth.isLoggedIn && auth.user?.id) {
      try {
        await fetch(`/api/wishlists/${item.wishlistId}/items/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: auth.user.id, note, priority }),
        });
      } catch (e) {
        console.error('Failed to update item:', e);
      }
    } else {
      setStoredLocalData(state.wishlists, updatedItems);
    }

    await get().refreshEnriched();
  },

  reorderItems: async (wishlistId, itemIdsInOrder) => {
    const state = get();
    const orderMap = new Map(itemIdsInOrder.map((id, idx) => [id, idx]));

    const updatedItems = state.items.map((it) => {
      if (it.wishlistId === wishlistId && orderMap.has(it.id)) {
        return { ...it, position: orderMap.get(it.id)! };
      }
      return it;
    });

    set({ items: updatedItems });

    const auth = useAuthStore.getState();
    if (auth.isLoggedIn && auth.user?.id) {
      try {
        await fetch(`/api/wishlists/${wishlistId}/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: auth.user.id, itemIds: itemIdsInOrder }),
        });
      } catch (e) {
        console.error('Failed to save reorder on server:', e);
      }
    } else {
      setStoredLocalData(state.wishlists, updatedItems);
    }

    await get().refreshEnriched();
  },

  moveOrCopyItems: async (sourceWishlistId, targetWishlistId, itemIds, action) => {
    const state = get();
    const auth = useAuthStore.getState();
    const isAuthed = auth.isLoggedIn && auth.user?.id;

    if (isAuthed) {
      const res = await fetch(`/api/wishlists/${sourceWishlistId}/move-copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: auth.user!.id,
          targetWishlistId,
          itemIds,
          action,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to move or copy items');
      }
      await state.initialize();
      return;
    }

    // Local move or copy
    const itemsToProcess = state.items.filter(
      (it) => it.wishlistId === sourceWishlistId && itemIds.includes(it.id)
    );
    const targetItems = state.items.filter((it) => it.wishlistId === targetWishlistId);

    let nextPos = targetItems.length;
    let newItems = [...state.items];

    for (const item of itemsToProcess) {
      const alreadyHas = targetItems.some(
        (ti) =>
          ti.productId === item.productId &&
          (ti.variantId || null) === (item.variantId || null)
      );
      if (alreadyHas) continue;

      if (action === 'copy') {
        const copy: WishlistItem = {
          ...item,
          id: `wli_local_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          wishlistId: targetWishlistId,
          position: nextPos++,
          addedAt: new Date().toISOString(),
        };
        newItems.push(copy);
      } else {
        newItems = newItems.map((it) =>
          it.id === item.id ? { ...it, wishlistId: targetWishlistId, position: nextPos++ } : it
        );
      }
    }

    set({ items: newItems });
    setStoredLocalData(state.wishlists, newItems);
    await get().refreshEnriched();
  },

  shareBoard: async (wishlistId, options) => {
    const auth = useAuthStore.getState();
    if (!auth.isLoggedIn || !auth.user?.id) {
      throw new Error('Sign in required to share wishlists.');
    }

    const res = await fetch(`/api/wishlists/${wishlistId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: auth.user.id, ...options }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to share wishlist');
    }

    const data = await res.json();
    const updated = get().wishlists.map((w) =>
      w.id === wishlistId
        ? {
            ...w,
            visibility: 'link' as const,
            shareToken: data.shareToken,
            shareOptions: { ...w.shareOptions, ...options },
          }
        : w
    );
    set({ wishlists: updated });
    await get().refreshEnriched();

    return data;
  },

  revokeShare: async (wishlistId) => {
    const auth = useAuthStore.getState();
    if (!auth.isLoggedIn || !auth.user?.id) return;

    await fetch(`/api/wishlists/${wishlistId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: auth.user.id, action: 'revoke' }),
    });

    const updated = get().wishlists.map((w) =>
      w.id === wishlistId ? { ...w, visibility: 'private' as const, shareToken: null } : w
    );
    set({ wishlists: updated });
    await get().refreshEnriched();
  },

  rotateShare: async (wishlistId, options) => {
    const auth = useAuthStore.getState();
    if (!auth.isLoggedIn || !auth.user?.id) {
      throw new Error('Sign in required to rotate share link.');
    }

    const res = await fetch(`/api/wishlists/${wishlistId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: auth.user.id, action: 'rotate', options }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to rotate share link');
    }

    const data = await res.json();
    const updated = get().wishlists.map((w) =>
      w.id === wishlistId ? { ...w, shareToken: data.shareToken } : w
    );
    set({ wishlists: updated });
    await get().refreshEnriched();
    return data;
  },

  syncGuestOnLogin: async (userId) => {
    const local = getStoredLocalData();
    if (!local || local.items.length === 0) return;

    try {
      const res = await fetch('/api/wishlists/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          wishlists: local.wishlists,
          items: local.items,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        // Clear local storage after successful server sync
        localStorage.removeItem(STORAGE_KEY);
        if (json.addedCount > 0) {
          useUIStore
            .getState()
            .success(`We added ${json.addedCount} saved items to your wishlist`);
        }
        await get().initialize();
      }
    } catch (e) {
      console.error('Failed to sync guest items on login:', e);
    }
  },

  refreshEnriched: async () => {
    const { wishlists, items } = get();
    const productMap = new Map(MOCK_PRODUCTS.map((p) => [p.id, p]));

    const enrichedList: EnrichedWishlist[] = wishlists.map((wl) => {
      const boardItems = items
        .filter((it) => it.wishlistId === wl.id)
        .sort((a, b) => a.position - b.position);

      const enrichedItems: EnrichedWishlistItem[] = boardItems.map((it) => {
        const product = productMap.get(it.productId);
        if (!product) {
          return {
            ...it,
            productName: 'Discontinued Product',
            productImage: '/placeholder-product.svg',
            productCategory: 'Archived',
            currentPriceMinor: it.addedPrice || 0,
            currency: 'INR',
            stockCount: 0,
            isInStock: false,
            isDiscontinued: true,
            isVariantDiscontinued: false,
          };
        }

        const variantObj = it.variantId
          ? product.variants?.find((v) => v.id === it.variantId)
          : null;

        const currentPriceMinor = toMinorUnits(product.price);
        const stockCount = (variantObj as any)?.stock ?? product.stockCount ?? 15;
        const isInStock = stockCount > 0;

        let priceDroppedMinor: number | undefined;
        let priceIncreasedMinor: number | undefined;

        if (typeof it.addedPrice === 'number' && it.addedPrice > 0) {
          if (currentPriceMinor < it.addedPrice) {
            priceDroppedMinor = it.addedPrice - currentPriceMinor;
          } else if (currentPriceMinor > it.addedPrice) {
            priceIncreasedMinor = currentPriceMinor - it.addedPrice;
          }
        }

        return {
          ...it,
          productName: product.name,
          productImage: product.image,
          productCategory: product.category,
          currentPriceMinor,
          currency: 'INR',
          stockCount,
          isInStock,
          isDiscontinued: false,
          isVariantDiscontinued: !!(it.variantId && !variantObj),
          variantName: variantObj?.name,
          variantValue: variantObj?.value,
          priceDroppedMinor,
          priceIncreasedMinor,
          isLowestIn30Days: false,
          isLowStock: isInStock && stockCount <= 3,
        };
      });

      const priceDropCount = enrichedItems.filter(
        (it) => it.priceDroppedMinor && it.priceDroppedMinor > 0
      ).length;

      const firstFourImages = enrichedItems
        .filter((it) => !it.isDiscontinued)
        .slice(0, 4)
        .map((it) => it.productImage);

      return {
        ...wl,
        items: enrichedItems,
        itemCount: enrichedItems.length,
        priceDropCount,
        firstFourImages,
      };
    });

    set({ enrichedWishlists: enrichedList });
  },
}));
