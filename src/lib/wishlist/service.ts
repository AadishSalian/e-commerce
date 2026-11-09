import fs from 'fs';
import path from 'path';
import {
  Wishlist,
  WishlistItem,
  WishlistItemClaim,
  EnrichedWishlist,
  EnrichedWishlistItem,
  WishlistShareOptions,
  WISHLIST_LIMITS,
} from './types';
import {
  generateShareToken,
  hashShareToken,
  computeExpirationDate,
  isTokenExpired,
} from './tokens';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { getProductPriceHistory } from '@/lib/price-history/service';
import { toMinorUnits } from '@/lib/price-history/currency';
import { checkContentModeration } from '@/lib/personalization/validation';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'wishlists.json');

interface StoredWishlist extends Omit<Wishlist, 'shareToken'> {
  shareTokenHash: string | null;
  // Raw token kept in-memory for active sessions only if needed
  rawShareToken?: string | null;
}

interface WishlistDataStore {
  wishlists: StoredWishlist[];
  items: WishlistItem[];
  claims: WishlistItemClaim[];
  reports: { id: string; tokenHash: string; reason: string; reportedAt: string }[];
}

let cachedData: WishlistDataStore | null = null;

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initialData: WishlistDataStore = generateInitialSeedData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    cachedData = initialData;
  }
}

function loadData(): WishlistDataStore {
  if (cachedData) return cachedData;
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    cachedData = JSON.parse(raw);
    return cachedData!;
  } catch (err) {
    console.error('Failed to read wishlists data file:', err);
    return { wishlists: [], items: [], claims: [], reports: [] };
  }
}

function saveData(data: WishlistDataStore): void {
  cachedData = data;
  try {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist wishlists data:', err);
  }
}

function generateInitialSeedData(): WishlistDataStore {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const defaultList: StoredWishlist = {
    id: 'wl_default_demo',
    ownerId: 'demo-user',
    name: 'My wishlist',
    description: 'Personal wishlist and daily favorites.',
    coverImage: null,
    visibility: 'private',
    shareTokenHash: null,
    rawShareToken: null,
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
    createdAt: twoWeeksAgo,
    updatedAt: now.toISOString(),
  };

  const livingRoomList: StoredWishlist = {
    id: 'wl_living_room_demo',
    ownerId: 'demo-user',
    name: 'Living room',
    description: 'Minimalist aesthetic setup for the reading nook and studio lounge.',
    coverImage: null,
    visibility: 'link',
    shareTokenHash: hashShareToken('demo-living-room-share-token-12345'),
    rawShareToken: 'demo-living-room-share-token-12345',
    shareOptions: {
      showOwnerName: true,
      ownerDisplayName: 'Aadi',
      expirationDays: 'never',
      expiresAt: null,
    },
    isDefault: false,
    isGiftList: true,
    occasionDate: '2026-12-15',
    notifyPriceDrops: true,
    notifyChannels: { email: true, push: true, sms: false },
    sortMode: 'recently_added',
    createdAt: twoWeeksAgo,
    updatedAt: now.toISOString(),
  };

  const seedItems: WishlistItem[] = [
    {
      id: 'wli_1',
      wishlistId: 'wl_default_demo',
      productId: 't-1',
      variantId: 'v-1',
      addedAt: twoWeeksAgo,
      note: 'Matte black finish to match the desk setup.',
      priority: 'top_pick',
      addedPrice: 28900, // Was $289.00 when saved, current price is $249.00 -> Price drop!
      position: 0,
    },
    {
      id: 'wli_2',
      wishlistId: 'wl_default_demo',
      productId: 't-3',
      variantId: null,
      addedAt: weekAgo,
      note: 'Need active noise cancellation for the open office.',
      priority: null,
      addedPrice: 34900,
      position: 1,
    },
    {
      id: 'wli_3',
      wishlistId: 'wl_living_room_demo',
      productId: 't-1',
      variantId: 'v-2',
      addedAt: twoWeeksAgo,
      note: 'Graphite shade works well with concrete accent wall.',
      priority: 'top_pick',
      addedPrice: 24900,
      position: 0,
    },
    {
      id: 'wli_4',
      wishlistId: 'wl_living_room_demo',
      productId: 't-2',
      variantId: 'v-3',
      addedAt: weekAgo,
      note: 'Gift idea for brother or studio guest.',
      priority: null,
      addedPrice: 22900, // Was $229 when saved, currently $199 -> Price drop!
      position: 1,
    },
  ];

  return {
    wishlists: [defaultList, livingRoomList],
    items: seedItems,
    claims: [
      {
        id: 'clm_1',
        itemId: 'wli_4',
        claimedByName: 'Elena',
        claimedByEmail: 'elena@example.com',
        claimedAt: weekAgo,
        expiresAt: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    reports: [],
  };
}

/**
 * Clean up soft-deleted wishlists past the undo window (10 seconds)
 */
function purgeExpiredDeletions(data: WishlistDataStore): boolean {
  const now = Date.now();
  const initialCount = data.wishlists.length;
  const expiredIds = new Set<string>();

  data.wishlists = data.wishlists.filter((wl) => {
    if (wl.deletedAt) {
      const deletedTime = new Date(wl.deletedAt).getTime();
      if (now - deletedTime > WISHLIST_LIMITS.UNDO_WINDOW_MS) {
        expiredIds.add(wl.id);
        return false;
      }
    }
    return true;
  });

  if (expiredIds.size > 0) {
    data.items = data.items.filter((item) => !expiredIds.has(item.wishlistId));
    return true;
  }
  return initialCount !== data.wishlists.length;
}

/**
 * Retrieve wishlists for a user (or guest).
 * Auto-creates default "My wishlist" if user has no lists.
 */
export function getWishlistsForUser(userId: string): Wishlist[] {
  const data = loadData();
  const modified = purgeExpiredDeletions(data);
  if (modified) saveData(data);

  let userLists = data.wishlists.filter(
    (wl) => wl.ownerId === userId && !wl.deletedAt
  );

  // If user has no lists at all, create default list
  if (userLists.length === 0) {
    const defaultList = createWishlist(userId, {
      name: 'My wishlist',
      isDefault: true,
      description: 'Your default collection of saved items.',
    });
    return [defaultList];
  }

  return userLists.map(stripInternalFields);
}

/**
 * Retrieve a single wishlist by ID.
 */
export function getWishlistById(
  id: string,
  userId?: string
): { wishlist: Wishlist; items: WishlistItem[] } | null {
  const data = loadData();
  purgeExpiredDeletions(data);

  const stored = data.wishlists.find((wl) => wl.id === id && !wl.deletedAt);
  if (!stored) return null;

  // Authorization check if userId is provided
  if (userId && stored.ownerId !== userId) {
    return null;
  }

  const items = data.items
    .filter((item) => item.wishlistId === id)
    .sort((a, b) => a.position - b.position);

  return {
    wishlist: stripInternalFields(stored),
    items,
  };
}

/**
 * Look up a wishlist by public unguessable share token.
 * Token must match, not be expired, and visibility must be 'link'.
 */
export function getWishlistByShareToken(token: string): {
  wishlist: Wishlist;
  items: WishlistItem[];
  claims: WishlistItemClaim[];
} | null {
  if (!token || typeof token !== 'string') return null;

  const data = loadData();
  purgeExpiredDeletions(data);

  const tokenHash = hashShareToken(token);
  const stored = data.wishlists.find(
    (wl) =>
      !wl.deletedAt &&
      wl.visibility === 'link' &&
      (wl.shareTokenHash === tokenHash || wl.rawShareToken === token)
  );

  if (!stored) {
    return null; // Identical 404 for invalid, deleted or revoked tokens
  }

  // Check expiration
  if (stored.shareOptions?.expiresAt && isTokenExpired(stored.shareOptions.expiresAt)) {
    return null; // Expired tokens respond identically to invalid tokens
  }

  const items = data.items
    .filter((item) => item.wishlistId === stored.id)
    .sort((a, b) => a.position - b.position);

  // Expired claims cleanup
  const now = new Date().getTime();
  const validClaims = data.claims.filter(
    (c) =>
      items.some((it) => it.id === c.itemId) &&
      new Date(c.expiresAt).getTime() > now
  );

  const publicWishlist = stripInternalFields(stored);
  publicWishlist.shareToken = token; // Safe to echo back the token user provided

  return {
    wishlist: publicWishlist,
    items,
    claims: validClaims,
  };
}

/**
 * Create a new wishlist board.
 */
export function createWishlist(
  userId: string,
  params: {
    name: string;
    description?: string;
    isDefault?: boolean;
    isGiftList?: boolean;
    occasionDate?: string | null;
  }
): Wishlist {
  const data = loadData();

  // Validate limits
  const isGuest = userId === 'guest';
  const maxLists = isGuest
    ? WISHLIST_LIMITS.MAX_LISTS_FOR_GUEST
    : WISHLIST_LIMITS.MAX_LISTS_PER_ACCOUNT;

  const activeUserLists = data.wishlists.filter(
    (wl) => wl.ownerId === userId && !wl.deletedAt
  );

  if (activeUserLists.length >= maxLists) {
    throw new Error(`Maximum limit of ${maxLists} wishlist boards reached.`);
  }

  // Validate name
  const trimmedName = (params.name || '').trim();
  if (!trimmedName) {
    throw new Error('Wishlist name cannot be empty.');
  }
  if (trimmedName.length > WISHLIST_LIMITS.MAX_NAME_LENGTH) {
    throw new Error(
      `Name cannot exceed ${WISHLIST_LIMITS.MAX_NAME_LENGTH} characters.`
    );
  }

  // Content moderation check
  const nameModeration = checkContentModeration(trimmedName);
  if (!nameModeration.isSafe) {
    throw new Error(
      `Wishlist name contains prohibited word: "${nameModeration.flaggedWord}".`
    );
  }

  const trimmedDesc = (params.description || '').trim();
  if (trimmedDesc.length > WISHLIST_LIMITS.MAX_DESCRIPTION_LENGTH) {
    throw new Error(
      `Description cannot exceed ${WISHLIST_LIMITS.MAX_DESCRIPTION_LENGTH} characters.`
    );
  }
  if (trimmedDesc) {
    const descModeration = checkContentModeration(trimmedDesc);
    if (!descModeration.isSafe) {
      throw new Error(
        `Wishlist description contains prohibited word: "${descModeration.flaggedWord}".`
      );
    }
  }

  const isDefault = !!params.isDefault && activeUserLists.length === 0;
  const now = new Date().toISOString();

  const newWishlist: StoredWishlist = {
    id: `wl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ownerId: userId,
    name: trimmedName,
    description: trimmedDesc || undefined,
    coverImage: null,
    visibility: 'private',
    shareTokenHash: null,
    rawShareToken: null,
    shareOptions: {
      showOwnerName: false,
      expirationDays: 'never',
      expiresAt: null,
    },
    isDefault,
    isGiftList: !!params.isGiftList,
    occasionDate: params.occasionDate || null,
    notifyPriceDrops: false,
    notifyChannels: { email: true, push: false, sms: false },
    sortMode: 'manual',
    createdAt: now,
    updatedAt: now,
  };

  data.wishlists.push(newWishlist);
  saveData(data);

  return stripInternalFields(newWishlist);
}

/**
 * Update a wishlist board (name, description, sort, gift mode, notifications).
 */
export function updateWishlist(
  id: string,
  userId: string,
  updates: Partial<Wishlist>
): Wishlist {
  const data = loadData();
  const index = data.wishlists.findIndex(
    (wl) => wl.id === id && wl.ownerId === userId && !wl.deletedAt
  );

  if (index === -1) {
    throw new Error('Wishlist not found.');
  }

  const existing = data.wishlists[index];

  // Content moderation on updates
  if (updates.name !== undefined) {
    const trimmedName = updates.name.trim();
    if (!trimmedName) throw new Error('Name cannot be empty.');
    if (trimmedName.length > WISHLIST_LIMITS.MAX_NAME_LENGTH) {
      throw new Error(`Name cannot exceed ${WISHLIST_LIMITS.MAX_NAME_LENGTH} characters.`);
    }
    const nameModeration = checkContentModeration(trimmedName);
    if (!nameModeration.isSafe) {
      throw new Error(`Wishlist name contains prohibited word: "${nameModeration.flaggedWord}".`);
    }
    existing.name = trimmedName;
  }

  if (updates.description !== undefined) {
    const trimmedDesc = updates.description.trim();
    if (trimmedDesc.length > WISHLIST_LIMITS.MAX_DESCRIPTION_LENGTH) {
      throw new Error(`Description cannot exceed ${WISHLIST_LIMITS.MAX_DESCRIPTION_LENGTH} characters.`);
    }
    if (trimmedDesc) {
      const descModeration = checkContentModeration(trimmedDesc);
      if (!descModeration.isSafe) {
        throw new Error(`Wishlist description contains prohibited word: "${descModeration.flaggedWord}".`);
      }
    }
    existing.description = trimmedDesc || undefined;
  }

  if (updates.coverImage !== undefined) existing.coverImage = updates.coverImage;
  if (updates.sortMode !== undefined) existing.sortMode = updates.sortMode;
  if (updates.isGiftList !== undefined) existing.isGiftList = updates.isGiftList;
  if (updates.occasionDate !== undefined) existing.occasionDate = updates.occasionDate;
  if (updates.notifyPriceDrops !== undefined) existing.notifyPriceDrops = updates.notifyPriceDrops;
  if (updates.notifyChannels !== undefined) existing.notifyChannels = updates.notifyChannels;
  if (updates.shareOptions !== undefined) {
    existing.shareOptions = { ...existing.shareOptions, ...updates.shareOptions };
  }

  existing.updatedAt = new Date().toISOString();
  saveData(data);

  return stripInternalFields(existing);
}

/**
 * Soft delete a wishlist board with a ~10-second undo window.
 * Default list cannot be deleted.
 */
export function softDeleteWishlist(
  id: string,
  userId: string
): { success: boolean; undoExpiresAt: number } {
  const data = loadData();
  const wl = data.wishlists.find(
    (w) => w.id === id && w.ownerId === userId && !w.deletedAt
  );

  if (!wl) {
    throw new Error('Wishlist not found.');
  }

  if (wl.isDefault) {
    throw new Error('The default wishlist cannot be deleted.');
  }

  wl.deletedAt = new Date().toISOString();
  wl.updatedAt = new Date().toISOString();
  saveData(data);

  return {
    success: true,
    undoExpiresAt: Date.now() + WISHLIST_LIMITS.UNDO_WINDOW_MS,
  };
}

/**
 * Undo a soft-deleted wishlist within the undo window.
 */
export function undoDeleteWishlist(id: string, userId: string): Wishlist {
  const data = loadData();
  const wl = data.wishlists.find(
    (w) => w.id === id && w.ownerId === userId && w.deletedAt
  );

  if (!wl) {
    throw new Error('Wishlist not found or undo window expired.');
  }

  const deletedTime = new Date(wl.deletedAt!).getTime();
  if (Date.now() - deletedTime > WISHLIST_LIMITS.UNDO_WINDOW_MS) {
    throw new Error('Undo window has expired.');
  }

  wl.deletedAt = null;
  wl.updatedAt = new Date().toISOString();
  saveData(data);

  return stripInternalFields(wl);
}

/**
 * Add an item to a wishlist.
 * Enforces:
 * - 100 items per list limit
 * - Deduplication by product and variant (highlights duplicate instead of recreating)
 * - Auto-records current live price as addedPrice (integer minor units)
 */
export function addItemToWishlist(
  userId: string,
  params: {
    wishlistId: string;
    productId: string;
    variantId?: string | null;
    note?: string;
    priority?: 'top_pick' | null;
  }
): { item: WishlistItem; isDuplicate: boolean } {
  const data = loadData();

  const wl = data.wishlists.find(
    (w) => w.id === params.wishlistId && w.ownerId === userId && !w.deletedAt
  );
  if (!wl) {
    throw new Error('Wishlist not found.');
  }

  // Check duplicate
  const existingItem = data.items.find(
    (it) =>
      it.wishlistId === params.wishlistId &&
      it.productId === params.productId &&
      (it.variantId || null) === (params.variantId || null)
  );

  if (existingItem) {
    return { item: existingItem, isDuplicate: true };
  }

  // Check 100 item limit
  const currentItemCount = data.items.filter(
    (it) => it.wishlistId === params.wishlistId
  ).length;
  if (currentItemCount >= WISHLIST_LIMITS.MAX_ITEMS_PER_LIST) {
    throw new Error(
      `This wishlist has reached the limit of ${WISHLIST_LIMITS.MAX_ITEMS_PER_LIST} items.`
    );
  }

  // Resolve current price as addedPrice (minor units)
  const product = MOCK_PRODUCTS.find((p) => p.id === params.productId);
  const livePriceMajor = product ? product.price : 0;
  const addedPrice = toMinorUnits(livePriceMajor);

  // Validate note
  const trimmedNote = (params.note || '').trim();
  if (trimmedNote.length > WISHLIST_LIMITS.MAX_NOTE_LENGTH) {
    throw new Error(
      `Note cannot exceed ${WISHLIST_LIMITS.MAX_NOTE_LENGTH} characters.`
    );
  }

  const now = new Date().toISOString();
  const newItem: WishlistItem = {
    id: `wli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    wishlistId: params.wishlistId,
    productId: params.productId,
    variantId: params.variantId || null,
    addedAt: now,
    note: trimmedNote || undefined,
    priority: params.priority || null,
    addedPrice,
    position: currentItemCount,
  };

  data.items.push(newItem);
  wl.updatedAt = now;
  saveData(data);

  return { item: newItem, isDuplicate: false };
}

/**
 * Remove an item from a wishlist.
 */
export function removeItemFromWishlist(itemId: string, userId: string): boolean {
  const data = loadData();
  const itemIndex = data.items.findIndex((it) => it.id === itemId);
  if (itemIndex === -1) return false;

  const item = data.items[itemIndex];
  const wl = data.wishlists.find((w) => w.id === item.wishlistId);
  if (!wl || wl.ownerId !== userId) return false;

  data.items.splice(itemIndex, 1);
  // Also remove associated claims
  data.claims = data.claims.filter((c) => c.itemId !== itemId);
  wl.updatedAt = new Date().toISOString();
  saveData(data);

  return true;
}

/**
 * Update an item's note or priority.
 */
export function updateWishlistItem(
  itemId: string,
  userId: string,
  updates: { note?: string; priority?: 'top_pick' | null }
): WishlistItem {
  const data = loadData();
  const item = data.items.find((it) => it.id === itemId);
  if (!item) throw new Error('Item not found.');

  const wl = data.wishlists.find((w) => w.id === item.wishlistId);
  if (!wl || wl.ownerId !== userId) throw new Error('Unauthorized.');

  if (updates.note !== undefined) {
    const trimmed = updates.note.trim();
    if (trimmed.length > WISHLIST_LIMITS.MAX_NOTE_LENGTH) {
      throw new Error(`Note cannot exceed ${WISHLIST_LIMITS.MAX_NOTE_LENGTH} characters.`);
    }
    item.note = trimmed || undefined;
  }

  if (updates.priority !== undefined) {
    item.priority = updates.priority;
  }

  wl.updatedAt = new Date().toISOString();
  saveData(data);

  return item;
}

/**
 * Reorder items in a wishlist.
 */
export function reorderWishlistItems(
  wishlistId: string,
  userId: string,
  itemIdsInOrder: string[]
): boolean {
  const data = loadData();
  const wl = data.wishlists.find(
    (w) => w.id === wishlistId && w.ownerId === userId && !w.deletedAt
  );
  if (!wl) return false;

  const orderMap = new Map<string, number>();
  itemIdsInOrder.forEach((id, index) => orderMap.set(id, index));

  for (const item of data.items) {
    if (item.wishlistId === wishlistId && orderMap.has(item.id)) {
      item.position = orderMap.get(item.id)!;
    }
  }

  wl.updatedAt = new Date().toISOString();
  saveData(data);
  return true;
}

/**
 * Bulk move or copy items between wishlists.
 */
export function moveOrCopyItems(
  sourceWishlistId: string,
  targetWishlistId: string,
  itemIds: string[],
  action: 'move' | 'copy',
  userId: string
): { processedCount: number; duplicateCount: number } {
  const data = loadData();

  const sourceWl = data.wishlists.find(
    (w) => w.id === sourceWishlistId && w.ownerId === userId
  );
  const targetWl = data.wishlists.find(
    (w) => w.id === targetWishlistId && w.ownerId === userId
  );

  if (!sourceWl || !targetWl) {
    throw new Error('Source or target wishlist not found.');
  }

  const itemsToProcess = data.items.filter(
    (it) => it.wishlistId === sourceWishlistId && itemIds.includes(it.id)
  );

  let processedCount = 0;
  let duplicateCount = 0;

  const targetItems = data.items.filter((it) => it.wishlistId === targetWishlistId);
  let nextPos = targetItems.length;

  for (const item of itemsToProcess) {
    // Check if target already has this item
    const exists = targetItems.some(
      (ti) =>
        ti.productId === item.productId &&
        (ti.variantId || null) === (item.variantId || null)
    );

    if (exists) {
      duplicateCount++;
      if (action === 'move') {
        // In move, delete source copy even if target has it
        removeItemFromWishlist(item.id, userId);
      }
      continue;
    }

    if (targetItems.length >= WISHLIST_LIMITS.MAX_ITEMS_PER_LIST) {
      break;
    }

    if (action === 'copy') {
      const copiedItem: WishlistItem = {
        ...item,
        id: `wli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        wishlistId: targetWishlistId,
        position: nextPos++,
        addedAt: new Date().toISOString(),
      };
      data.items.push(copiedItem);
      targetItems.push(copiedItem);
      processedCount++;
    } else if (action === 'move') {
      item.wishlistId = targetWishlistId;
      item.position = nextPos++;
      processedCount++;
    }
  }

  sourceWl.updatedAt = new Date().toISOString();
  targetWl.updatedAt = new Date().toISOString();
  saveData(data);

  return { processedCount, duplicateCount };
}

/**
 * Create or update a share link for a wishlist.
 * Generates an unguessable 128-bit random token, stores hashed.
 */
export function createShareLink(
  wishlistId: string,
  userId: string,
  options: WishlistShareOptions
): { shareToken: string; shareUrl: string } {
  const data = loadData();
  const wl = data.wishlists.find(
    (w) => w.id === wishlistId && w.ownerId === userId && !w.deletedAt
  );

  if (!wl) throw new Error('Wishlist not found.');

  // Check active share link limits
  const activeLinks = data.wishlists.filter(
    (w) => w.ownerId === userId && w.visibility === 'link' && w.id !== wishlistId
  ).length;

  if (activeLinks >= WISHLIST_LIMITS.MAX_ACTIVE_SHARE_LINKS) {
    throw new Error(
      `Limit of ${WISHLIST_LIMITS.MAX_ACTIVE_SHARE_LINKS} active share links reached.`
    );
  }

  const rawToken = generateShareToken();
  const tokenHash = hashShareToken(rawToken);
  const expiresAt = computeExpirationDate(options.expirationDays);

  wl.visibility = 'link';
  wl.shareTokenHash = tokenHash;
  wl.rawShareToken = rawToken;
  wl.shareTokenCreatedAt = new Date().toISOString();
  wl.shareOptions = {
    ...options,
    expiresAt,
  };
  wl.updatedAt = new Date().toISOString();

  saveData(data);

  return {
    shareToken: rawToken,
    shareUrl: `/w/${rawToken}`,
  };
}

/**
 * Revoke a share link instantly.
 */
export function revokeShareLink(wishlistId: string, userId: string): boolean {
  const data = loadData();
  const wl = data.wishlists.find(
    (w) => w.id === wishlistId && w.ownerId === userId
  );
  if (!wl) return false;

  wl.visibility = 'private';
  wl.shareTokenHash = null;
  wl.rawShareToken = null;
  wl.updatedAt = new Date().toISOString();
  saveData(data);

  return true;
}

/**
 * Rotate share token: invalidates previous token, generates a new one.
 */
export function rotateShareToken(
  wishlistId: string,
  userId: string,
  options?: WishlistShareOptions
): { shareToken: string; shareUrl: string } {
  const data = loadData();
  const wl = data.wishlists.find(
    (w) => w.id === wishlistId && w.ownerId === userId
  );
  if (!wl) throw new Error('Wishlist not found.');

  const effectiveOptions = options || wl.shareOptions;
  return createShareLink(wishlistId, userId, effectiveOptions);
}

/**
 * Claim an item on a gift list (visitor action).
 * Surprise protection: owner NEVER sees claims while list is active!
 */
export function claimGiftItem(
  token: string,
  itemId: string,
  claimant: { name: string; email?: string }
): { success: boolean; claimId: string } {
  const lookup = getWishlistByShareToken(token);
  if (!lookup) throw new Error('List not found.');
  if (!lookup.wishlist.isGiftList) throw new Error('This list is not a gift list.');

  const data = loadData();
  const item = data.items.find(
    (it) => it.id === itemId && it.wishlistId === lookup.wishlist.id
  );
  if (!item) throw new Error('Item not found on this wishlist.');

  // Clean expired claims
  const now = Date.now();
  data.claims = data.claims.filter(
    (c) => new Date(c.expiresAt).getTime() > now
  );

  // Check if already claimed
  const existingClaim = data.claims.find((c) => c.itemId === itemId);
  if (existingClaim) {
    throw new Error('This item has already been claimed by another visitor.');
  }

  const trimmedName = claimant.name.trim();
  if (!trimmedName) throw new Error('Your name is required to claim an item.');

  const expiresAt = new Date(
    now + WISHLIST_LIMITS.CLAIM_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const newClaim: WishlistItemClaim = {
    id: `clm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    itemId,
    claimedByName: trimmedName,
    claimedByEmail: claimant.email?.trim() || undefined,
    claimedAt: new Date().toISOString(),
    expiresAt,
  };

  data.claims.push(newClaim);
  saveData(data);

  return { success: true, claimId: newClaim.id };
}

/**
 * Release a visitor claim on a gift item.
 */
export function unclaimGiftItem(
  token: string,
  itemId: string,
  claimantIdentifier: string
): boolean {
  const lookup = getWishlistByShareToken(token);
  if (!lookup) return false;

  const data = loadData();
  const claimIndex = data.claims.findIndex(
    (c) =>
      c.itemId === itemId &&
      (c.claimedByName.toLowerCase() === claimantIdentifier.toLowerCase() ||
        c.claimedByEmail?.toLowerCase() === claimantIdentifier.toLowerCase())
  );

  if (claimIndex === -1) return false;

  data.claims.splice(claimIndex, 1);
  saveData(data);
  return true;
}

/**
 * Report a shared wishlist for abuse or policy violations.
 */
export function reportWishlist(token: string, reason: string): boolean {
  const data = loadData();
  const tokenHash = hashShareToken(token);

  data.reports.push({
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    tokenHash,
    reason: (reason || 'Inappropriate content').slice(0, 500),
    reportedAt: new Date().toISOString(),
  });

  saveData(data);
  return true;
}

/**
 * Merge guest local storage items and lists into authenticated account.
 * Deduplicates by product + variant, preserving the older addedAt and older addedPrice!
 */
export function syncLocalWishlistsWithUser(
  userId: string,
  localWishlists: Wishlist[],
  localItems: WishlistItem[]
): {
  mergedLists: Wishlist[];
  addedCount: number;
} {
  const data = loadData();
  const userLists = getWishlistsForUser(userId);
  const defaultList = userLists.find((wl) => wl.isDefault) || userLists[0];

  let addedCount = 0;

  for (const localItem of localItems) {
    // Check if item already exists in any of user's lists
    const existing = data.items.find(
      (it) =>
        it.wishlistId === defaultList.id &&
        it.productId === localItem.productId &&
        (it.variantId || null) === (localItem.variantId || null)
    );

    if (!existing) {
      data.items.push({
        id: `wli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        wishlistId: defaultList.id,
        productId: localItem.productId,
        variantId: localItem.variantId || null,
        addedAt: localItem.addedAt || new Date().toISOString(),
        note: localItem.note,
        priority: localItem.priority,
        addedPrice: localItem.addedPrice,
        position: data.items.filter((it) => it.wishlistId === defaultList.id).length,
      });
      addedCount++;
    } else {
      // Reconcile: keep older addedAt and older addedPrice
      const localAddedTime = new Date(localItem.addedAt).getTime();
      const existingAddedTime = new Date(existing.addedAt).getTime();
      if (localAddedTime < existingAddedTime) {
        existing.addedAt = localItem.addedAt;
        existing.addedPrice = Math.min(existing.addedPrice, localItem.addedPrice);
      }
    }
  }

  saveData(data);

  return {
    mergedLists: getWishlistsForUser(userId),
    addedCount,
  };
}

/**
 * Enrich wishlist items with live product data, live stock, and truthful price drops.
 */
export async function enrichWishlistItems(
  items: WishlistItem[],
  options: {
    isSharedView?: boolean;
    visitorIdentifier?: string;
    claims?: WishlistItemClaim[];
  } = {}
): Promise<EnrichedWishlistItem[]> {
  const { isSharedView = false, visitorIdentifier, claims = [] } = options;

  const productMap = new Map(MOCK_PRODUCTS.map((p) => [p.id, p]));

  const enriched: EnrichedWishlistItem[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product) {
      // Product deleted/discontinued
      enriched.push({
        ...item,
        productName: 'Discontinued Product',
        productImage: '/placeholder-product.svg',
        productCategory: 'Archived',
        currentPriceMinor: item.addedPrice || 0,
        currency: 'INR',
        stockCount: 0,
        isInStock: false,
        isDiscontinued: true,
        isVariantDiscontinued: false,
      });
      continue;
    }

    // Check variant
    let variantObj = null;
    let isVariantDiscontinued = false;
    if (item.variantId) {
      variantObj = product.variants?.find((v) => v.id === item.variantId);
      if (!variantObj) {
        isVariantDiscontinued = true;
      }
    }

    const currentPriceMinor = toMinorUnits(product.price);
    const stockCount = (variantObj as any)?.stock ?? product.stockCount ?? 15;
    const isInStock = stockCount > 0;
    const isLowStock = isInStock && stockCount <= 3;

    // Evaluate truthful price history
    let priceDroppedMinor: number | undefined;
    let isLowestIn30Days = false;
    let priceIncreasedMinor: number | undefined;

    try {
      const history = getProductPriceHistory(item.productId, item.variantId || undefined, 30);
      if (history?.tag) {
        if (history.tag.type === 'lowest_in_days') {
          isLowestIn30Days = true;
        }
      }
    } catch {
      // Graceful fallback
    }

    // Check drop against saved price
    if (typeof item.addedPrice === 'number' && item.addedPrice > 0) {
      if (currentPriceMinor < item.addedPrice) {
        priceDroppedMinor = item.addedPrice - currentPriceMinor;
      } else if (currentPriceMinor > item.addedPrice) {
        priceIncreasedMinor = currentPriceMinor - item.addedPrice;
      }
    }

    // Claim details for gift mode
    const claim = claims.find((c) => c.itemId === item.id);
    const isClaimed = !!claim;
    let isClaimedByCurrentVisitor = false;
    if (claim && visitorIdentifier) {
      const normVisitor = visitorIdentifier.trim().toLowerCase();
      isClaimedByCurrentVisitor =
        claim.claimedByName.toLowerCase() === normVisitor ||
        claim.claimedByEmail?.toLowerCase() === normVisitor;
    }

    enriched.push({
      ...item,
      productName: product.name,
      productImage: product.image,
      productCategory: product.category,
      currentPriceMinor,
      currency: 'INR',
      stockCount,
      isInStock,
      isDiscontinued: false,
      isVariantDiscontinued,
      variantName: variantObj?.name,
      variantValue: variantObj?.value,
      // For shared views, do NOT show owner's personal "since you saved it" drop badge!
      // Only universal product tags: isLowestIn30Days, isLowStock, isBackInStock
      priceDroppedMinor: isSharedView ? undefined : priceDroppedMinor,
      priceIncreasedMinor: isSharedView ? undefined : priceIncreasedMinor,
      isLowestIn30Days,
      isLowStock,
      isClaimed,
      claimedByName: isClaimed ? claim?.claimedByName : undefined,
      isClaimedByCurrentVisitor,
    });
  }

  return enriched;
}

/**
 * Enriches a full wishlist board including 2x2 collage images and item count.
 */
export async function enrichWishlist(
  wishlist: Wishlist,
  items: WishlistItem[],
  options: {
    isSharedView?: boolean;
    visitorIdentifier?: string;
    claims?: WishlistItemClaim[];
  } = {}
): Promise<EnrichedWishlist> {
  const enrichedItems = await enrichWishlistItems(items, options);

  const priceDropCount = enrichedItems.filter(
    (it) => it.priceDroppedMinor && it.priceDroppedMinor > 0
  ).length;

  const firstFourImages = enrichedItems
    .filter((it) => !it.isDiscontinued)
    .slice(0, 4)
    .map((it) => it.productImage);

  return {
    ...wishlist,
    items: enrichedItems,
    itemCount: enrichedItems.length,
    priceDropCount,
    firstFourImages,
  };
}

function stripInternalFields(stored: StoredWishlist): Wishlist {
  const { shareTokenHash, rawShareToken, ...rest } = stored;
  return {
    ...rest,
    shareToken: rawShareToken || null,
  };
}
