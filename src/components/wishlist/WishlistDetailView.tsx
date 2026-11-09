'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Reorder, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  Share2,
  Trash2,
  Edit2,
  Check,
  X,
  TrendingDown,
  ShoppingBag,
  MoreVertical,
  MoveRight,
  Copy,
  ChevronDown,
  ChevronUp,
  Star,
  Lock,
  Link2,
  Bell,
  Gift,
  ArrowUpDown,
  Filter,
  AlertCircle,
  HelpCircle,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  EnrichedWishlist,
  EnrichedWishlistItem,
  WishlistSortMode,
  WISHLIST_LIMITS,
} from '@/lib/wishlist/types';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useCartStore } from '@/store/useCartStore';
import { useUIStore } from '@/store/useUIStore';
import { formatPriceMinor, toMajorUnits } from '@/lib/price-history/currency';
import { checkContentModeration } from '@/lib/personalization/validation';
import { MOCK_PRODUCTS } from '@/lib/mockData';

interface WishlistDetailViewProps {
  board: EnrichedWishlist;
  onBack: () => void;
}

export function WishlistDetailView({ board, onBack }: WishlistDetailViewProps) {
  const updateBoard = useWishlistStore((state) => state.updateBoard);
  const deleteBoard = useWishlistStore((state) => state.deleteBoard);
  const removeItemById = useWishlistStore((state) => state.removeItemById);
  const updateItemNoteOrPriority = useWishlistStore((state) => state.updateItemNoteOrPriority);
  const reorderItems = useWishlistStore((state) => state.reorderItems);
  const moveOrCopyItems = useWishlistStore((state) => state.moveOrCopyItems);
  const openShareDialog = useWishlistStore((state) => state.openShareDialog);
  const openNotificationsModal = useWishlistStore((state) => state.openNotificationsModal);
  const wishlists = useWishlistStore((state) => state.wishlists);

  const addToCart = useCartStore((state) => state.addToCart);
  const openCart = useUIStore((state) => state.openCart);

  const shouldReduceMotion = useReducedMotion();

  // Inline header editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(board.name);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState(board.description || '');

  // Toolbar state
  const [sortMode, setSortMode] = useState<WishlistSortMode>(board.sortMode || 'manual');
  const [filterInStockOnly, setFilterInStockOnly] = useState(false);
  const [filterPriceDropOnly, setFilterPriceDropOnly] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Bulk move/copy modal
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'move' | 'copy'>('move');
  const [targetBoardId, setTargetBoardId] = useState<string>('');

  // Per-item note editing modal or inline
  const [editingNoteItemId, setEditingNoteItemId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // Variant selector modal before adding to bag
  const [variantSelectorItem, setVariantSelectorItem] = useState<EnrichedWishlistItem | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');

  // Live accessibility announcement
  const [accessibilityAnnouncement, setAccessibilityAnnouncement] = useState('');

  // Sort & filter items
  const displayItems = useMemo(() => {
    let items = [...board.items];

    if (filterInStockOnly) {
      items = items.filter((it) => it.isInStock && !it.isDiscontinued);
    }
    if (filterPriceDropOnly) {
      items = items.filter((it) => it.priceDroppedMinor && it.priceDroppedMinor > 0);
    }

    switch (sortMode) {
      case 'recently_added':
        items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        break;
      case 'price_low_high':
        items.sort((a, b) => a.currentPriceMinor - b.currentPriceMinor);
        break;
      case 'price_drop_first':
        items.sort((a, b) => (b.priceDroppedMinor || 0) - (a.priceDroppedMinor || 0));
        break;
      case 'priority':
        items.sort((a, b) => (b.priority === 'top_pick' ? 1 : 0) - (a.priority === 'top_pick' ? 1 : 0));
        break;
      case 'manual':
      default:
        items.sort((a, b) => a.position - b.position);
        break;
    }

    return items;
  }, [board.items, filterInStockOnly, filterPriceDropOnly, sortMode]);

  // Handle Header Updates
  const handleSaveTitle = async () => {
    const trimmed = titleInput.trim();
    if (!trimmed) {
      setTitleInput(board.name);
      setIsEditingTitle(false);
      return;
    }
    const moderation = checkContentModeration(trimmed);
    if (!moderation.isSafe) {
      useUIStore.getState().error('Prohibited language detected in name');
      return;
    }
    try {
      await updateBoard(board.id, { name: trimmed });
      setIsEditingTitle(false);
      useUIStore.getState().success('Board renamed');
    } catch (err: any) {
      useUIStore.getState().error(err.message || 'Failed to rename board');
    }
  };

  const handleSaveDesc = async () => {
    const trimmed = descInput.trim();
    const moderation = checkContentModeration(trimmed);
    if (!moderation.isSafe) {
      useUIStore.getState().error('Prohibited language detected in description');
      return;
    }
    try {
      await updateBoard(board.id, { description: trimmed || undefined });
      setIsEditingDesc(false);
    } catch (err: any) {
      useUIStore.getState().error(err.message || 'Failed to update description');
    }
  };

  // Keyboard Reorder Path
  const handleKeyboardMove = async (item: EnrichedWishlistItem, direction: 'up' | 'down') => {
    const currentOrder = board.items.map((it) => it.id);
    const currentIndex = currentOrder.indexOf(item.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;

    const reordered = [...currentOrder];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    setAccessibilityAnnouncement(`Moved ${item.productName} to position ${targetIndex + 1} of ${currentOrder.length}`);
    await reorderItems(board.id, reordered);
  };

  // Framer Motion Reorder Drag Handler
  const handleDragReorder = async (newOrderItems: EnrichedWishlistItem[]) => {
    const ids = newOrderItems.map((it) => it.id);
    await reorderItems(board.id, ids);
  };

  // Bulk selection toggles
  const handleToggleSelect = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItemIds.length === displayItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(displayItems.map((it) => it.id));
    }
  };

  // Bulk actions
  const handleBulkRemove = async () => {
    const count = selectedItemIds.length;
    for (const id of selectedItemIds) {
      await removeItemById(id);
    }
    setSelectedItemIds([]);
    setIsSelectMode(false);
    useUIStore.getState().addToast(`Removed ${count} items from board`, 'info');
  };

  const handleBulkAddAllToBag = () => {
    const selected = board.items.filter((it) => selectedItemIds.includes(it.id));
    let addedCount = 0;
    let skippedOutCount = 0;

    for (const it of selected) {
      const product = MOCK_PRODUCTS.find((p) => p.id === it.productId);
      if (!product || !it.isInStock || it.isDiscontinued) {
        skippedOutCount++;
        continue;
      }
      addToCart(product, 1, it.variantValue || undefined);
      addedCount++;
    }

    setSelectedItemIds([]);
    setIsSelectMode(false);

    if (addedCount > 0) {
      const skippedMsg = skippedOutCount > 0 ? ` (${skippedOutCount} out-of-stock items skipped)` : '';
      useUIStore.getState().success(`Added ${addedCount} items to bag${skippedMsg}`);
      openCart();
    } else if (skippedOutCount > 0) {
      useUIStore.getState().error(`All selected items are currently out of stock`);
    }
  };

  const handleExecuteBulkMoveCopy = async () => {
    if (!targetBoardId) return;
    try {
      await moveOrCopyItems(board.id, targetBoardId, selectedItemIds, bulkActionType);
      const targetName = wishlists.find((w) => w.id === targetBoardId)?.name || 'target board';
      useUIStore
        .getState()
        .success(`${bulkActionType === 'move' ? 'Moved' : 'Copied'} ${selectedItemIds.length} items to ${targetName}`);
      setIsBulkActionModalOpen(false);
      setSelectedItemIds([]);
      setIsSelectMode(false);
    } catch (err: any) {
      useUIStore.getState().error(err.message || 'Bulk action failed');
    }
  };

  // Add single item to bag (handles variant options)
  const handleAddItemToBag = (item: EnrichedWishlistItem) => {
    const product = MOCK_PRODUCTS.find((p) => p.id === item.productId);
    if (!product) return;

    if (product.variants && product.variants.length > 0 && !item.variantId) {
      // Prompt variant picker modal first!
      setVariantSelectorItem(item);
      setSelectedVariantId(product.variants[0].id);
      return;
    }

    addToCart(product, 1, item.variantValue || undefined);
    useUIStore.getState().success(`Added ${item.productName} to bag`);
    openCart();
  };

  const handleConfirmVariantAndAdd = () => {
    if (!variantSelectorItem) return;
    const product = MOCK_PRODUCTS.find((p) => p.id === variantSelectorItem.productId);
    if (!product) return;

    const chosen = product.variants?.find((v) => v.id === selectedVariantId);
    addToCart(product, 1, chosen?.value || undefined);
    useUIStore.getState().success(`Added ${variantSelectorItem.productName} (${chosen?.value}) to bag`);
    setVariantSelectorItem(null);
    openCart();
  };

  return (
    <div className="space-y-8">
      {/* Screen reader live region */}
      <div className="sr-only" aria-live="polite">
        {accessibilityAnnouncement}
      </div>

      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-foreground py-2 pr-3 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Boards</span>
        </button>
      </div>

      {/* Board Header */}
      <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1 space-y-2">
            {/* Inline Title Editor */}
            {isEditingTitle ? (
              <div className="flex items-center gap-2 max-w-lg">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  maxLength={WISHLIST_LIMITS.MAX_NAME_LENGTH}
                  className="w-full bg-background border border-accent rounded-xl px-3.5 py-2 text-2xl font-bold text-foreground outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="p-2.5 bg-accent text-background rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                  aria-label="Save title"
                >
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTitleInput(board.name);
                    setIsEditingTitle(false);
                  }}
                  className="p-2.5 bg-surface-hover text-text-muted hover:text-foreground rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                  aria-label="Cancel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 group">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  {board.name}
                </h1>
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 text-text-muted hover:text-foreground transition-opacity rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
                  aria-label="Rename board"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Description */}
            {isEditingDesc ? (
              <div className="flex items-center gap-2 max-w-xl pt-1">
                <input
                  type="text"
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  maxLength={WISHLIST_LIMITS.MAX_DESCRIPTION_LENGTH}
                  placeholder="Add a description for this board…"
                  className="w-full bg-background border border-accent rounded-lg px-3 py-1.5 text-sm text-foreground outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveDesc}
                  className="p-2 bg-accent text-background rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
                  aria-label="Save description"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingDesc(false)}
                  className="p-2 bg-surface-hover text-text-muted rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
                  aria-label="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p
                onClick={() => setIsEditingDesc(true)}
                className="text-sm text-text-muted cursor-pointer hover:text-foreground transition-colors max-w-2xl"
                title="Click to edit description"
              >
                {board.description || 'Add a note or description for this mood board…'}
              </p>
            )}

            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <span className="text-text-muted font-medium">
                {board.itemCount} {board.itemCount === 1 ? 'item' : 'items'}
              </span>

              <span className="text-border">•</span>

              <span className="inline-flex items-center gap-1.5 text-text-muted">
                {board.visibility === 'link' ? (
                  <>
                    <Link2 className="w-3.5 h-3.5 text-accent" />
                    <span className="text-accent font-medium">Shared via link</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-text-muted" />
                    <span>Private</span>
                  </>
                )}
              </span>

              {board.isGiftList && (
                <>
                  <span className="text-border">•</span>
                  <span className="inline-flex items-center gap-1 text-text-muted">
                    <Gift className="w-3.5 h-3.5 text-accent" />
                    <span>Gift list</span>
                    {board.occasionDate && (
                      <span className="text-text-muted/80">({board.occasionDate})</span>
                    )}
                  </span>
                </>
              )}

              {board.priceDropCount > 0 && (
                <>
                  <span className="text-border">•</span>
                  <span className="inline-flex items-center gap-1 text-accent font-semibold tabular-nums">
                    <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{board.priceDropCount} price drops</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openShareDialog(board)}
              className="bg-accent hover:bg-accent-hover text-background font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors min-h-[44px]"
            >
              <Share2 className="w-4 h-4" />
              <span>Share board</span>
            </button>

            <button
              type="button"
              onClick={() => openNotificationsModal(board)}
              className={`p-2.5 rounded-xl border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                board.notifyPriceDrops
                  ? 'bg-accent/10 border-accent/40 text-accent'
                  : 'bg-surface hover:bg-surface-hover border-border text-text-muted hover:text-foreground'
              }`}
              title="Price drop alerts"
              aria-label="Price drop alerts"
            >
              <Bell className="w-4 h-4" />
            </button>

            {!board.isDefault && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Delete wishlist board "${board.name}"? You will have 10 seconds to undo.`)) {
                    await deleteBoard(board.id);
                    onBack();
                  }
                }}
                className="p-2.5 rounded-xl bg-surface hover:bg-red-500/10 border border-border hover:border-red-500/30 text-text-muted hover:text-red-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Delete board"
                aria-label="Delete board"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar: Sort, Filters, and Bulk Select */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-border/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* Sort Menu */}
          <div className="flex items-center gap-1.5 bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-foreground">
            <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-text-muted">Sort:</span>
            <select
              value={sortMode}
              onChange={(e) => {
                const mode = e.target.value as WishlistSortMode;
                setSortMode(mode);
                updateBoard(board.id, { sortMode: mode });
              }}
              className="bg-transparent text-foreground font-medium outline-none cursor-pointer"
              aria-label="Sort wishlisted items"
            >
              <option value="manual" className="bg-surface">Manual order</option>
              <option value="recently_added" className="bg-surface">Recently added</option>
              <option value="price_low_high" className="bg-surface">Price: Low to High</option>
              <option value="price_drop_first" className="bg-surface">Price drop first</option>
              <option value="priority" className="bg-surface">Top picks first</option>
            </select>
          </div>

          {/* Filter Chips */}
          <button
            type="button"
            onClick={() => setFilterInStockOnly(!filterInStockOnly)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors min-h-[36px] flex items-center gap-1.5 ${
              filterInStockOnly
                ? 'bg-foreground text-background border-foreground'
                : 'bg-surface hover:bg-surface-hover border-border text-text-muted hover:text-foreground'
            }`}
          >
            <span>In stock</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterPriceDropOnly(!filterPriceDropOnly)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors min-h-[36px] flex items-center gap-1.5 ${
              filterPriceDropOnly
                ? 'bg-accent text-background border-accent'
                : 'bg-surface hover:bg-surface-hover border-border text-text-muted hover:text-foreground'
            }`}
          >
            <TrendingDown className="w-3 h-3" />
            <span>Price dropped</span>
          </button>
        </div>

        {/* Bulk Select Mode Toggle */}
        <div className="flex items-center gap-2">
          {isSelectMode ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-semibold text-text-muted hover:text-foreground px-2 py-1"
              >
                {selectedItemIds.length === displayItems.length ? 'Deselect all' : 'Select all'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSelectMode(false);
                  setSelectedItemIds([]);
                }}
                className="text-xs text-text-muted hover:text-foreground px-2 py-1"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSelectMode(true)}
              className="text-xs font-semibold text-text-muted hover:text-foreground py-2 px-1 min-h-[44px]"
            >
              Select items
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Sticky Bar */}
      <AnimatePresence>
        {isSelectMode && selectedItemIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="sticky bottom-6 z-30 bg-surface/95 backdrop-blur-md border border-border rounded-2xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-4"
          >
            <span className="text-xs font-bold text-foreground">
              {selectedItemIds.length} {selectedItemIds.length === 1 ? 'item selected' : 'items selected'}
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setBulkActionType('move');
                  setTargetBoardId(wishlists.find((w) => w.id !== board.id)?.id || '');
                  setIsBulkActionModalOpen(true);
                }}
                className="bg-surface hover:bg-surface-hover border border-border text-foreground px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[44px]"
              >
                <MoveRight className="w-3.5 h-3.5" />
                <span>Move to board</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBulkActionType('copy');
                  setTargetBoardId(wishlists.find((w) => w.id !== board.id)?.id || '');
                  setIsBulkActionModalOpen(true);
                }}
                className="bg-surface hover:bg-surface-hover border border-border text-foreground px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[44px]"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy to board</span>
              </button>

              <button
                type="button"
                onClick={handleBulkAddAllToBag}
                className="bg-accent hover:bg-accent-hover text-background px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[44px]"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add all to bag</span>
              </button>

              <button
                type="button"
                onClick={handleBulkRemove}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[44px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items Empty State */}
      {displayItems.length === 0 ? (
        <div className="text-center py-20 px-4 bg-surface/50 border border-border rounded-2xl space-y-4">
          <p className="text-base text-foreground font-medium">Nothing saved yet.</p>
          <p className="text-sm text-text-muted max-w-sm mx-auto">
            Browse our catalog to curate your setup and collect objects you love.
          </p>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 font-semibold px-6 py-3 rounded-xl text-sm transition-colors min-h-[44px]"
            >
              Browse collection
            </Link>
          </div>
        </div>
      ) : sortMode === 'manual' && !filterInStockOnly && !filterPriceDropOnly && !isSelectMode ? (
        /* Framer Motion Reorder Group (Manual Reordering) */
        <Reorder.Group
          axis="y"
          values={displayItems}
          onReorder={handleDragReorder}
          className="space-y-4"
        >
          {displayItems.map((item, idx) => (
            <Reorder.Item
              key={item.id}
              value={item}
              whileDrag={{ scale: 1.02 }}
              className="bg-surface border border-border rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-grab active:cursor-grabbing transition-colors"
            >
              <ItemCardContent
                item={item}
                idx={idx}
                totalCount={displayItems.length}
                isSelectMode={false}
                isSelected={false}
                onToggleSelect={() => {}}
                onRemove={() => removeItemById(item.id)}
                onAddToBag={() => handleAddItemToBag(item)}
                onKeyboardMove={(dir) => handleKeyboardMove(item, dir)}
                onTogglePriority={async () => {
                  const nextP = item.priority === 'top_pick' ? null : 'top_pick';
                  await updateItemNoteOrPriority(item.id, undefined, nextP);
                }}
                onEditNote={() => {
                  setEditingNoteItemId(item.id);
                  setNoteInput(item.note || '');
                }}
                isNoteExpanded={expandedNotes.has(item.id)}
                onToggleExpandNote={() => {
                  setExpandedNotes((prev) => {
                    const next = new Set(prev);
                    if (next.has(item.id)) next.delete(item.id);
                    else next.add(item.id);
                    return next;
                  });
                }}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        /* Regular Sorted / Filtered / Selectable Grid */
        <div className="space-y-4">
          <AnimatePresence>
            {displayItems.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="bg-surface border border-border rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors"
              >
                <ItemCardContent
                  item={item}
                  idx={idx}
                  totalCount={displayItems.length}
                  isSelectMode={isSelectMode}
                  isSelected={selectedItemIds.includes(item.id)}
                  onToggleSelect={() => handleToggleSelect(item.id)}
                  onRemove={() => removeItemById(item.id)}
                  onAddToBag={() => handleAddItemToBag(item)}
                  onKeyboardMove={(dir) => handleKeyboardMove(item, dir)}
                  onTogglePriority={async () => {
                    const nextP = item.priority === 'top_pick' ? null : 'top_pick';
                    await updateItemNoteOrPriority(item.id, undefined, nextP);
                  }}
                  onEditNote={() => {
                    setEditingNoteItemId(item.id);
                    setNoteInput(item.note || '');
                  }}
                  isNoteExpanded={expandedNotes.has(item.id)}
                  onToggleExpandNote={() => {
                    setExpandedNotes((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    });
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Note Editor Modal */}
      <AnimatePresence>
        {editingNoteItemId && (
          <div
            className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditingNoteItemId(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="note-modal-title"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 25 }}
              className="w-full sm:max-w-md bg-surface border border-border rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <h3 id="note-modal-title" className="text-base font-bold text-foreground">
                Item Note
              </h3>
              <textarea
                rows={3}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                maxLength={WISHLIST_LIMITS.MAX_NOTE_LENGTH}
                placeholder="e.g. Dimensions check, gift for mom, wait for black friday"
                className="w-full bg-background border border-border focus:border-accent rounded-xl p-3 text-xs text-foreground outline-none resize-none"
              />
              <div className="flex justify-between text-[11px] text-text-muted">
                <span>Personal reminder (max {WISHLIST_LIMITS.MAX_NOTE_LENGTH} chars)</span>
                <span>{noteInput.length}/{WISHLIST_LIMITS.MAX_NOTE_LENGTH}</span>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingNoteItemId(null)}
                  className="px-4 py-2 text-xs text-text-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await updateItemNoteOrPriority(editingNoteItemId, noteInput.trim() || undefined);
                    setEditingNoteItemId(null);
                    useUIStore.getState().success('Note saved');
                  }}
                  className="bg-accent text-background px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Save Note
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Variant Selector Modal before Add To Bag */}
      <AnimatePresence>
        {variantSelectorItem && (
          <div
            className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setVariantSelectorItem(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="variant-modal-title"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 25 }}
              className="w-full sm:max-w-md bg-surface border border-border rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 id="variant-modal-title" className="text-base font-bold text-foreground">
                  Select Option for {variantSelectorItem.productName}
                </h3>
                <button
                  onClick={() => setVariantSelectorItem(null)}
                  className="p-1 text-text-muted hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-text-muted block">Available Options:</label>
                {MOCK_PRODUCTS.find((p) => p.id === variantSelectorItem.productId)?.variants?.map(
                  (v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-colors ${
                        selectedVariantId === v.id
                          ? 'bg-accent/10 border-accent text-foreground'
                          : 'bg-background hover:bg-surface-hover border-border text-text-muted'
                      }`}
                    >
                      <span className="font-medium text-foreground">{v.value}</span>
                      {selectedVariantId === v.id && <Check className="w-4 h-4 text-accent" />}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={handleConfirmVariantAndAdd}
                className="w-full bg-accent hover:bg-accent-hover text-background font-semibold py-3 rounded-xl text-sm transition-colors min-h-[44px]"
              >
                Add to Bag
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Move/Copy Modal */}
      <AnimatePresence>
        {isBulkActionModalOpen && (
          <div
            className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsBulkActionModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-action-title"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 25 }}
              className="w-full sm:max-w-md bg-surface border border-border rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <h3 id="bulk-action-title" className="text-base font-bold text-foreground">
                {bulkActionType === 'move' ? 'Move' : 'Copy'} {selectedItemIds.length} items to board
              </h3>

              <div className="space-y-2">
                <label className="text-xs text-text-muted block">Choose destination board:</label>
                {wishlists
                  .filter((w) => w.id !== board.id)
                  .map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setTargetBoardId(w.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-colors ${
                        targetBoardId === w.id
                          ? 'bg-accent/10 border-accent text-foreground'
                          : 'bg-background hover:bg-surface-hover border-border text-text-muted'
                      }`}
                    >
                      <span className="font-medium text-foreground">{w.name}</span>
                      {targetBoardId === w.id && <Check className="w-4 h-4 text-accent" />}
                    </button>
                  ))}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkActionModalOpen(false)}
                  className="px-4 py-2 text-xs text-text-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!targetBoardId}
                  onClick={handleExecuteBulkMoveCopy}
                  className="bg-accent text-background px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  Confirm {bulkActionType === 'move' ? 'Move' : 'Copy'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ItemCardContent({
  item,
  idx,
  totalCount,
  isSelectMode,
  isSelected,
  onToggleSelect,
  onRemove,
  onAddToBag,
  onKeyboardMove,
  onTogglePriority,
  onEditNote,
  isNoteExpanded,
  onToggleExpandNote,
}: {
  item: EnrichedWishlistItem;
  idx: number;
  totalCount: number;
  isSelectMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
  onAddToBag: () => void;
  onKeyboardMove: (dir: 'up' | 'down') => void;
  onTogglePriority: () => void;
  onEditNote: () => void;
  isNoteExpanded: boolean;
  onToggleExpandNote: () => void;
}) {
  const currentMajor = toMajorUnits(item.currentPriceMinor);
  const isTopPick = item.priority === 'top_pick';

  return (
    <>
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {/* Selection Checkbox */}
        {isSelectMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-5 h-5 rounded border-border accent-accent mt-3 shrink-0 cursor-pointer"
            aria-label={`Select ${item.productName}`}
          />
        )}

        {/* Thumbnail */}
        <Link
          href={`/products/${item.productId}`}
          className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-background border border-border/80 shrink-0 block group/img"
        >
          <Image
            src={item.productImage}
            alt={item.productName}
            fill
            sizes="96px"
            className="object-cover transition-transform duration-300 group-hover/img:scale-105"
          />
        </Link>

        {/* Info */}
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/products/${item.productId}`}
              className="text-sm md:text-base font-bold text-foreground hover:text-accent transition-colors truncate"
            >
              {item.productName}
            </Link>

            {isTopPick && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 border border-accent/40 text-[10px] font-bold uppercase tracking-wider text-accent">
                <Star className="w-3 h-3 fill-accent" />
                <span>Top pick</span>
              </span>
            )}

            {/* Price-Drop Badges (Real Recorded Data Only) */}
            {item.priceDroppedMinor && item.priceDroppedMinor > 0 && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent text-background text-[11px] font-bold tabular-nums"
                title={`Price dropped by ${formatPriceMinor(item.priceDroppedMinor, item.currency)} since you saved this on ${new Date(item.addedAt).toLocaleDateString()}`}
              >
                <TrendingDown className="w-3 h-3 stroke-[2.5]" />
                <span>Price dropped {formatPriceMinor(item.priceDroppedMinor, item.currency)}</span>
              </span>
            )}

            {item.isLowestIn30Days && !item.priceDroppedMinor && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/20 border border-accent/40 text-[10px] font-semibold text-accent">
                Lowest in 30 days
              </span>
            )}

            {!item.isInStock && !item.isDiscontinued && (
              <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-[10px] font-medium text-text-muted">
                Out of stock
              </span>
            )}

            {item.isDiscontinued && (
              <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-[10px] font-medium text-text-muted">
                No longer available
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="text-foreground font-semibold tabular-nums">
              ${currentMajor.toFixed(2)}
            </span>
            {item.variantValue && <span>• {item.variantValue}</span>}
            <span>• Saved {new Date(item.addedAt).toLocaleDateString()}</span>
          </div>

          {/* Note Field (clamped 2 lines with expand) */}
          {item.note ? (
            <div className="pt-1">
              <p
                onClick={onToggleExpandNote}
                className={`text-xs text-text-muted cursor-pointer hover:text-foreground transition-colors ${
                  isNoteExpanded ? '' : 'line-clamp-2'
                }`}
                title="Click to expand note"
              >
                <span className="font-semibold text-foreground">Note:</span> {item.note}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={onEditNote}
              className="text-[11px] text-text-muted/70 hover:text-foreground transition-colors pt-0.5 block"
            >
              + Add a personal note
            </button>
          )}
        </div>
      </div>

      {/* Item Action Controls */}
      <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
        {/* Keyboard reordering arrows */}
        <div className="hidden sm:flex items-center gap-1 border-r border-border/80 pr-2 mr-1">
          <button
            type="button"
            disabled={idx === 0}
            onClick={() => onKeyboardMove('up')}
            className="p-1.5 rounded-lg text-text-muted hover:text-foreground disabled:opacity-20 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
            title="Move item up"
            aria-label={`Move ${item.productName} up`}
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={idx === totalCount - 1}
            onClick={() => onKeyboardMove('down')}
            className="p-1.5 rounded-lg text-text-muted hover:text-foreground disabled:opacity-20 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
            title="Move item down"
            aria-label={`Move ${item.productName} down`}
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Priority toggle */}
        <button
          type="button"
          onClick={onTogglePriority}
          className={`p-2 rounded-xl border transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center ${
            isTopPick
              ? 'bg-accent/15 border-accent/40 text-accent'
              : 'bg-surface hover:bg-surface-hover border-border text-text-muted hover:text-foreground'
          }`}
          title={isTopPick ? 'Remove top pick' : 'Mark as top pick'}
          aria-label={isTopPick ? 'Remove top pick' : 'Mark as top pick'}
        >
          <Star className={`w-4 h-4 ${isTopPick ? 'fill-accent' : ''}`} />
        </button>

        {/* Note editor button */}
        <button
          type="button"
          onClick={onEditNote}
          className="p-2 rounded-xl bg-surface hover:bg-surface-hover border border-border text-text-muted hover:text-foreground transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          title="Edit note"
          aria-label="Edit note"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        {/* Add to Bag */}
        <button
          type="button"
          disabled={!item.isInStock || item.isDiscontinued}
          onClick={onAddToBag}
          className="bg-accent hover:bg-accent-hover text-background font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-30 disabled:pointer-events-none min-h-[40px]"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Add to bag</span>
        </button>

        {/* Remove */}
        <button
          type="button"
          onClick={onRemove}
          className="p-2 rounded-xl bg-surface hover:bg-red-500/10 border border-border hover:border-red-500/30 text-text-muted hover:text-red-400 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          title="Remove from board"
          aria-label={`Remove ${item.productName}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
