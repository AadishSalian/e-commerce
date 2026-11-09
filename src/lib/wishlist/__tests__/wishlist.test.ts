import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import {
  createWishlist,
  getWishlistsForUser,
  getWishlistById,
  updateWishlist,
  softDeleteWishlist,
  undoDeleteWishlist,
  addItemToWishlist,
  removeItemFromWishlist,
  updateWishlistItem,
  reorderWishlistItems,
  moveOrCopyItems,
  createShareLink,
  revokeShareLink,
  rotateShareToken,
  getWishlistByShareToken,
  claimGiftItem,
  unclaimGiftItem,
  enrichWishlistItems,
  syncLocalWishlistsWithUser,
} from '../service';
import {
  generateShareToken,
  hashShareToken,
  computeExpirationDate,
  isTokenExpired,
} from '../tokens';
import { WISHLIST_LIMITS } from '../types';

describe('Wishlist Boards: Data Model & Limits', () => {
  const testUserId = `test-user-${Date.now()}`;

  it('auto-initializes default "My wishlist" when user has no lists', () => {
    const lists = getWishlistsForUser(testUserId);
    assert.strictEqual(lists.length, 1);
    assert.strictEqual(lists[0].isDefault, true);
    assert.strictEqual(lists[0].name, 'My wishlist');
    assert.strictEqual(lists[0].visibility, 'private');
    assert.strictEqual(lists[0].shareToken, null);
  });

  it('creates named boards under length limits (<= 40 chars)', () => {
    const board = createWishlist(testUserId, {
      name: 'Living Room Setup',
      description: 'Objects for the studio nook.',
    });
    assert.strictEqual(board.name, 'Living Room Setup');
    assert.strictEqual(board.isDefault, false);
    assert.strictEqual(board.visibility, 'private');
  });

  it('rejects board names exceeding 40 characters', () => {
    assert.throws(
      () => {
        createWishlist(testUserId, {
          name: 'This is an exceedingly long wishlist board name that goes way beyond forty chars',
        });
      },
      { message: /cannot exceed 40 characters/i }
    );
  });

  it('rejects board descriptions exceeding 140 characters', () => {
    const longDesc = 'a'.repeat(141);
    assert.throws(
      () => {
        createWishlist(testUserId, {
          name: 'Valid Name',
          description: longDesc,
        });
      },
      { message: /cannot exceed 140 characters/i }
    );
  });

  it('enforces content moderation on wishlist names and descriptions', () => {
    assert.throws(
      () => {
        createWishlist(testUserId, {
          name: 'fuck this room',
        });
      },
      { message: /prohibited word/i }
    );
  });

  it('prevents deleting the default wishlist', () => {
    const lists = getWishlistsForUser(testUserId);
    const defaultList = lists.find((l) => l.isDefault)!;
    assert.throws(
      () => {
        softDeleteWishlist(defaultList.id, testUserId);
      },
      { message: /default wishlist cannot be deleted/i }
    );
  });
});

describe('Wishlist Boards: Item Operations & Deduplication', () => {
  const testUserId = `test-items-${Date.now()}`;
  let listId: string;

  before(() => {
    const board = createWishlist(testUserId, { name: 'Gift Ideas' });
    listId = board.id;
  });

  it('adds an item to a wishlist and stores price in integer minor units', () => {
    const result = addItemToWishlist(testUserId, {
      wishlistId: listId,
      productId: 't-1',
      variantId: 'v-1',
      note: 'Graphite shade preferred',
    });

    assert.strictEqual(result.isDuplicate, false);
    assert.strictEqual(result.item.productId, 't-1');
    assert.strictEqual(result.item.variantId, 'v-1');
    assert.strictEqual(typeof result.item.addedPrice, 'number');
    assert.strictEqual(result.item.addedPrice > 0, true);
    assert.strictEqual(result.item.note, 'Graphite shade preferred');
  });

  it('detects duplicates for identical product and variant and highlights existing', () => {
    const result = addItemToWishlist(testUserId, {
      wishlistId: listId,
      productId: 't-1',
      variantId: 'v-1',
    });

    assert.strictEqual(result.isDuplicate, true);
    assert.strictEqual(result.item.productId, 't-1');
  });

  it('allows same product with a different variant on the same list', () => {
    const result = addItemToWishlist(testUserId, {
      wishlistId: listId,
      productId: 't-1',
      variantId: 'v-2', // Different variant
    });

    assert.strictEqual(result.isDuplicate, false);
  });

  it('allows updating an item note and priority marker', () => {
    const details = getWishlistById(listId, testUserId)!;
    const item = details.items[0];

    const updated = updateWishlistItem(item.id, testUserId, {
      note: 'Updated personal note',
      priority: 'top_pick',
    });

    assert.strictEqual(updated.note, 'Updated personal note');
    assert.strictEqual(updated.priority, 'top_pick');
  });

  it('enforces manual reordering of item positions', () => {
    const details = getWishlistById(listId, testUserId)!;
    const itemIds = details.items.map((i) => i.id);
    assert.ok(itemIds.length >= 2);

    const reversed = [...itemIds].reverse();
    const success = reorderWishlistItems(listId, testUserId, reversed);
    assert.strictEqual(success, true);

    const updated = getWishlistById(listId, testUserId)!;
    assert.strictEqual(updated.items[0].id, reversed[0]);
    assert.strictEqual(updated.items[1].id, reversed[1]);
  });

  it('removes an item cleanly', () => {
    const details = getWishlistById(listId, testUserId)!;
    const initialCount = details.items.length;
    const itemToRemove = details.items[0];

    const success = removeItemFromWishlist(itemToRemove.id, testUserId);
    assert.strictEqual(success, true);

    const updated = getWishlistById(listId, testUserId)!;
    assert.strictEqual(updated.items.length, initialCount - 1);
  });
});

describe('Wishlist Boards: Soft Delete & 10s Undo Window', () => {
  const testUserId = `test-delete-${Date.now()}`;
  let listId: string;

  before(() => {
    const board = createWishlist(testUserId, { name: 'Temporary Board' });
    listId = board.id;
    addItemToWishlist(testUserId, { wishlistId: listId, productId: 't-2' });
  });

  it('soft-deletes a board and provides an undo window', () => {
    const res = softDeleteWishlist(listId, testUserId);
    assert.strictEqual(res.success, true);
    assert.ok(res.undoExpiresAt > Date.now());

    // Should no longer appear in active lists
    const active = getWishlistsForUser(testUserId);
    assert.strictEqual(active.some((w) => w.id === listId), false);
  });

  it('restores soft-deleted board within the undo window', () => {
    const restored = undoDeleteWishlist(listId, testUserId);
    assert.strictEqual(restored.id, listId);
    assert.strictEqual(restored.name, 'Temporary Board');

    const active = getWishlistsForUser(testUserId);
    assert.strictEqual(active.some((w) => w.id === listId), true);
  });
});

describe('Wishlist Boards: Token Security & Link Sharing', () => {
  const testUserId = `test-share-${Date.now()}`;
  let listId: string;

  before(() => {
    const board = createWishlist(testUserId, { name: 'Shareable Studio' });
    listId = board.id;
    addItemToWishlist(testUserId, { wishlistId: listId, productId: 't-1' });
  });

  it('generates 128-bit unguessable random tokens without personal data', () => {
    const token = generateShareToken();
    assert.ok(token.length >= 20);
    // Never contains user email or ID
    assert.strictEqual(token.includes('@'), false);
    assert.strictEqual(token.includes(testUserId), false);
  });

  it('hashes token using SHA-256 for safe storage', () => {
    const token = 'sample-token-12345';
    const hash1 = hashShareToken(token);
    const hash2 = hashShareToken(token);
    assert.strictEqual(hash1, hash2);
    assert.strictEqual(hash1.length, 64);
  });

  it('creates an active share link and enables public lookup', () => {
    const res = createShareLink(listId, testUserId, {
      showOwnerName: true,
      ownerDisplayName: 'Aadi',
      expirationDays: 'never',
    });

    assert.ok(res.shareToken);
    assert.strictEqual(res.shareUrl, `/w/${res.shareToken}`);

    // Lookup via token
    const lookup = getWishlistByShareToken(res.shareToken);
    assert.ok(lookup);
    assert.strictEqual(lookup.wishlist.name, 'Shareable Studio');
    assert.strictEqual(lookup.wishlist.shareOptions.showOwnerName, true);
    assert.strictEqual(lookup.wishlist.shareOptions.ownerDisplayName, 'Aadi');
  });

  it('revoking a share link immediately makes public lookup return null (404)', () => {
    const shareRes = createShareLink(listId, testUserId, {
      showOwnerName: false,
      expirationDays: 'never',
    });
    const token = shareRes.shareToken;

    const beforeRevoke = getWishlistByShareToken(token);
    assert.ok(beforeRevoke);

    const revoked = revokeShareLink(listId, testUserId);
    assert.strictEqual(revoked, true);

    const afterRevoke = getWishlistByShareToken(token);
    assert.strictEqual(afterRevoke, null);
  });

  it('rotating a share token invalidates old link and activates new link', () => {
    const initial = createShareLink(listId, testUserId, {
      showOwnerName: false,
      expirationDays: 'never',
    });
    const oldToken = initial.shareToken;

    const rotated = rotateShareToken(listId, testUserId);
    const newToken = rotated.shareToken;

    assert.notStrictEqual(oldToken, newToken);
    assert.strictEqual(getWishlistByShareToken(oldToken), null);
    assert.ok(getWishlistByShareToken(newToken));
  });

  it('returns null identically for expired tokens and non-existent tokens', () => {
    const nonExistent = getWishlistByShareToken('completely-invalid-token-xyz');
    assert.strictEqual(nonExistent, null);

    assert.strictEqual(isTokenExpired('2020-01-01T00:00:00.000Z'), true);
    assert.strictEqual(isTokenExpired('2030-01-01T00:00:00.000Z'), false);
  });
});

describe('Wishlist Boards: Gift Mode & Surprise Protection', () => {
  const testUserId = `test-gift-${Date.now()}`;
  let listId: string;
  let shareToken: string;
  let itemId: string;

  before(() => {
    const board = createWishlist(testUserId, {
      name: 'Baby Registry',
      isGiftList: true,
      occasionDate: '2026-12-25',
    });
    listId = board.id;
    const itemRes = addItemToWishlist(testUserId, { wishlistId: listId, productId: 't-3' });
    itemId = itemRes.item.id;
    const shareRes = createShareLink(listId, testUserId, {
      showOwnerName: false,
      expirationDays: 'never',
    });
    shareToken = shareRes.shareToken;
  });

  it('allows a visitor to claim an item with their name ("I will get this")', () => {
    const res = claimGiftItem(shareToken, itemId, {
      name: 'Sarah',
      email: 'sarah@example.com',
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.claimId);
  });

  it('prevents another visitor from claiming an already claimed item', () => {
    assert.throws(
      () => {
        claimGiftItem(shareToken, itemId, { name: 'Bob' });
      },
      { message: /already been claimed/i }
    );
  });

  it('surprise protection: owner view NEVER exposes claims while active', () => {
    const ownerDetails = getWishlistById(listId, testUserId)!;
    // Items retrieved for owner do not have claim details leaked
    const item = ownerDetails.items.find((i) => i.id === itemId)!;
    assert.strictEqual((item as any).claimedByName, undefined);
  });

  it('allows claimant to release their claim', () => {
    const released = unclaimGiftItem(shareToken, itemId, 'Sarah');
    assert.strictEqual(released, true);

    // Can now be claimed again
    const reclaimed = claimGiftItem(shareToken, itemId, { name: 'Marcus' });
    assert.strictEqual(reclaimed.success, true);
  });
});

describe('Wishlist Boards: Price-Drop Badges & Honesty Rules', () => {
  it('computes real price drops against saved addedPrice on private views', async () => {
    const mockItem = {
      id: 'item_test_1',
      wishlistId: 'wl_test',
      productId: 't-1',
      variantId: 'v-1',
      addedAt: '2026-10-01T00:00:00.000Z',
      addedPrice: 28900, // Was saved at $289.00
      position: 0,
    };

    const enriched = await enrichWishlistItems([mockItem], { isSharedView: false });
    assert.strictEqual(enriched.length, 1);
    // Live price for t-1 is $249.00 = 24900
    // Price dropped = 28900 - 24900 = 4000 minor units ($40.00)
    assert.strictEqual(enriched[0].priceDroppedMinor, 4000);
  });

  it('shared view NEVER shows owner personal "since you saved it" drop badge', async () => {
    const mockItem = {
      id: 'item_test_2',
      wishlistId: 'wl_test',
      productId: 't-1',
      variantId: 'v-1',
      addedAt: '2026-10-01T00:00:00.000Z',
      addedPrice: 28900,
      position: 0,
    };

    const enrichedShared = await enrichWishlistItems([mockItem], { isSharedView: true });
    assert.strictEqual(enrichedShared[0].priceDroppedMinor, undefined);
  });
});

describe('Wishlist Boards: Guest Sync & Login Merge', () => {
  it('merges guest local items into account, keeping older addedAt and older addedPrice', () => {
    const userId = `sync-user-${Date.now()}`;
    const olderDate = '2026-09-01T00:00:00.000Z';
    const newerDate = '2026-10-15T00:00:00.000Z';

    const localLists = [
      {
        id: 'wl_local_1',
        ownerId: 'guest',
        name: 'Guest Living Room',
        visibility: 'private' as const,
        shareToken: null,
        shareOptions: { showOwnerName: false, expirationDays: 'never' as const, expiresAt: null },
        isDefault: false,
        isGiftList: false,
        occasionDate: null,
        notifyPriceDrops: false,
        notifyChannels: { email: true, push: false, sms: false },
        sortMode: 'manual' as const,
        createdAt: olderDate,
        updatedAt: olderDate,
      },
    ];

    const localItems = [
      {
        id: 'wli_local_1',
        wishlistId: 'wl_local_1',
        productId: 't-2',
        variantId: null,
        addedAt: olderDate,
        addedPrice: 19900,
        position: 0,
      },
    ];

    const result = syncLocalWishlistsWithUser(userId, localLists, localItems);
    assert.strictEqual(result.addedCount >= 1, true);

    const userLists = getWishlistsForUser(userId);
    const defaultList = userLists.find((l) => l.isDefault)!;
    const userBoard = getWishlistById(defaultList.id, userId)!;
    const syncedItem = userBoard.items.find((i) => i.productId === 't-2');
    assert.ok(syncedItem);
    assert.strictEqual(syncedItem.addedAt, olderDate);
  });
});
