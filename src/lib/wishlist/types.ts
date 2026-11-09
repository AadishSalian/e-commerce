export type WishlistVisibility = 'private' | 'link';

export type WishlistSortMode =
  | 'manual'
  | 'recently_added'
  | 'price_low_high'
  | 'price_drop_first'
  | 'priority';

export type LinkExpirationDays = 'never' | 30 | 90;

export interface WishlistShareOptions {
  showOwnerName: boolean;
  ownerDisplayName?: string;
  expirationDays: LinkExpirationDays;
  expiresAt?: string | null;
}

export interface WishlistItemClaim {
  id: string;
  itemId: string;
  claimedByName: string;
  claimedByEmail?: string;
  claimedAt: string;
  expiresAt: string;
}

export interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  variantId?: string | null;
  addedAt: string;
  note?: string; // Max 120 chars
  priority?: 'top_pick' | null;
  addedPrice: number; // Integer minor units (e.g. paise / cents)
  position: number;
  claims?: WishlistItemClaim[];
}

export interface WishlistNotificationChannels {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface Wishlist {
  id: string;
  ownerId: string; // User ID or 'guest'
  name: string; // Max 40 chars
  description?: string; // Max 140 chars
  coverImage?: string | null; // Auto from first item or chosen
  visibility: WishlistVisibility;
  shareToken: string | null; // Null when private
  shareTokenCreatedAt?: string | null;
  shareOptions: WishlistShareOptions;
  isDefault: boolean; // Default list "My wishlist" cannot be deleted
  isGiftList: boolean;
  occasionDate?: string | null;
  notifyPriceDrops: boolean;
  notifyChannels: WishlistNotificationChannels;
  sortMode: WishlistSortMode;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null; // Soft-delete undo window (~10s)
}

export interface EnrichedWishlistItem extends WishlistItem {
  productName: string;
  productImage: string;
  productCategory: string;
  currentPriceMinor: number;
  currency: string;
  stockCount: number;
  isInStock: boolean;
  isDiscontinued: boolean;
  isVariantDiscontinued: boolean;
  variantName?: string;
  variantValue?: string;
  // Computed price drop attributes
  priceDroppedMinor?: number; // Real drop vs addedPrice
  isLowestIn30Days?: boolean;
  priceIncreasedMinor?: number;
  isLowStock?: boolean;
  // Gift mode visitor claim state
  isClaimed?: boolean;
  claimedByName?: string;
  isClaimedByCurrentVisitor?: boolean;
}

export interface EnrichedWishlist extends Wishlist {
  items: EnrichedWishlistItem[];
  itemCount: number;
  priceDropCount: number;
  firstFourImages: string[];
}

export const WISHLIST_LIMITS = {
  MAX_LISTS_PER_ACCOUNT: 20,
  MAX_LISTS_FOR_GUEST: 5,
  MAX_ITEMS_PER_LIST: 100,
  MAX_ACTIVE_SHARE_LINKS: 10,
  UNDO_WINDOW_MS: 10000, // 10 seconds
  CLAIM_EXPIRY_DAYS: 30,
  MAX_NAME_LENGTH: 40,
  MAX_DESCRIPTION_LENGTH: 140,
  MAX_NOTE_LENGTH: 120,
  PRICE_DROP_NOTIFICATION_THRESHOLD_PERCENT: 5,
  NOTIFICATION_COOLDOWN_DAYS: 7,
} as const;
