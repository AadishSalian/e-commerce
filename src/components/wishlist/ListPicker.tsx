'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, FolderHeart, Lock, Link2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useWishlistStore } from '@/store/useWishlistStore';
import { checkContentModeration } from '@/lib/personalization/validation';
import { WISHLIST_LIMITS } from '@/lib/wishlist/types';

export function ListPicker() {
  const isPickerOpen = useWishlistStore((state) => state.isPickerOpen);
  const closePicker = useWishlistStore((state) => state.closePicker);
  const payload = useWishlistStore((state) => state.pickerPayload);
  const wishlists = useWishlistStore((state) => state.wishlists);
  const items = useWishlistStore((state) => state.items);
  const addItemToBoard = useWishlistStore((state) => state.addItemToBoard);
  const removeItemFromBoard = useWishlistStore((state) => state.removeItemFromBoard);
  const createBoard = useWishlistStore((state) => state.createBoard);

  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isPickerOpen) {
      setIsCreatingInline(false);
      setNewBoardName('');
      setInlineError(null);
    }
  }, [isPickerOpen]);

  useEffect(() => {
    if (isCreatingInline && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreatingInline]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPickerOpen) {
        closePicker();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPickerOpen, closePicker]);

  if (!isPickerOpen || !payload) return null;

  const { product, variantId, variantLabel } = payload;

  const handleToggleBoard = async (wishlistId: string, boardName: string) => {
    const isCurrentlyIn = items.some(
      (it) =>
        it.wishlistId === wishlistId &&
        it.productId === product.id &&
        (it.variantId || null) === (variantId || null)
    );

    if (isCurrentlyIn) {
      await removeItemFromBoard(wishlistId, product.id, variantId);
      setLiveAnnouncement(`Removed ${product.name} from ${boardName}`);
    } else {
      await addItemToBoard(wishlistId, product, variantId);
      setLiveAnnouncement(`Saved ${product.name} to ${boardName}`);
    }
  };

  const handleCreateNewBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);

    const trimmed = newBoardName.trim();
    if (!trimmed) {
      setInlineError('Please enter a list name.');
      return;
    }

    if (trimmed.length > WISHLIST_LIMITS.MAX_NAME_LENGTH) {
      setInlineError(`Name must be under ${WISHLIST_LIMITS.MAX_NAME_LENGTH} characters.`);
      return;
    }

    // Duplicate check
    const isDuplicate = wishlists.some(
      (w) => w.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setInlineError('A list with this name already exists.');
      return;
    }

    // Profanity / moderation check
    const moderation = checkContentModeration(trimmed);
    if (!moderation.isSafe) {
      setInlineError(`Please choose a different name (prohibited term detected).`);
      return;
    }

    try {
      const created = await createBoard(trimmed);
      // Auto-add product to the newly created list
      await addItemToBoard(created.id, product, variantId);
      setLiveAnnouncement(`Created list ${created.name} and saved item.`);
      setNewBoardName('');
      setIsCreatingInline(false);
    } catch (err: any) {
      setInlineError(err.message || 'Could not create list.');
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
        onClick={closePicker}
        role="dialog"
        aria-modal="true"
        aria-labelledby="list-picker-title"
      >
        {/* Polite Live Region for screen readers */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {liveAnnouncement}
        </div>

        <motion.div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="w-full sm:max-w-md bg-surface border border-border rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Mobile swipe handle */}
          <div className="sm:hidden w-12 h-1 bg-border rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h2 id="list-picker-title" className="text-lg font-bold text-foreground">
                Save to Wishlist
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Organize items across your mood boards
              </p>
            </div>
            <button
              onClick={closePicker}
              className="p-2 -mr-2 text-text-muted hover:text-foreground rounded-full hover:bg-surface-hover transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close list picker"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Item Preview */}
          <div className="flex items-center gap-3.5 py-3.5 px-3 my-3 bg-surface-hover/70 rounded-xl border border-border/50">
            <div className="w-12 h-12 rounded-lg bg-surface relative overflow-hidden shrink-0 border border-border/40">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground truncate">
                {product.name}
              </h3>
              <p className="text-xs text-text-muted truncate mt-0.5">
                ${product.price.toFixed(2)}
                {variantLabel ? ` • ${variantLabel}` : ''}
              </p>
            </div>
          </div>

          {/* Boards List */}
          <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-1 hide-scrollbar">
            {wishlists.map((wl) => {
              const isChecked = items.some(
                (it) =>
                  it.wishlistId === wl.id &&
                  it.productId === product.id &&
                  (it.variantId || null) === (variantId || null)
              );
              const itemCount = items.filter((it) => it.wishlistId === wl.id).length;

              return (
                <button
                  key={wl.id}
                  type="button"
                  onClick={() => handleToggleBoard(wl.id, wl.name)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-colors min-h-[52px] ${
                    isChecked
                      ? 'bg-accent/10 border-accent/40 text-foreground'
                      : 'bg-surface hover:bg-surface-hover border-border text-foreground'
                  }`}
                  role="checkbox"
                  aria-checked={isChecked}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isChecked
                          ? 'bg-accent border-accent text-background'
                          : 'border-border bg-surface'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm truncate">{wl.name}</span>
                        {wl.visibility === 'link' ? (
                          <span title="Shared link" className="inline-flex">
                            <Link2 className="w-3 h-3 text-text-muted shrink-0" />
                          </span>
                        ) : (
                          <span title="Private" className="inline-flex">
                            <Lock className="w-3 h-3 text-text-muted shrink-0" />
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-muted">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* New List Inline Form */}
          <div className="pt-3 border-t border-border mt-3">
            {isCreatingInline ? (
              <form onSubmit={handleCreateNewBoard} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newBoardName}
                    onChange={(e) => {
                      setNewBoardName(e.target.value);
                      if (inlineError) setInlineError(null);
                    }}
                    placeholder="e.g. Office setup, Gifts"
                    maxLength={WISHLIST_LIMITS.MAX_NAME_LENGTH}
                    className="flex-1 bg-background border border-border focus:border-accent rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-text-muted outline-none transition-colors"
                    aria-label="New list name"
                  />
                  <button
                    type="submit"
                    className="bg-accent text-background hover:bg-accent-hover font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shrink-0 min-h-[44px]"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingInline(false);
                      setInlineError(null);
                    }}
                    className="p-2 text-text-muted hover:text-foreground rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Cancel new list"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {inlineError && (
                  <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{inlineError}</span>
                  </p>
                )}
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsCreatingInline(true)}
                  className="flex items-center gap-2 text-sm text-foreground hover:text-accent font-medium py-2 px-1 transition-colors min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>New list</span>
                </button>
                <button
                  type="button"
                  onClick={closePicker}
                  className="bg-surface-hover hover:bg-surface-active text-foreground font-medium px-4 py-2 rounded-xl text-sm transition-colors min-h-[44px]"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
