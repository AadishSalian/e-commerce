'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Link2,
  TrendingDown,
  Plus,
  FolderHeart,
  ChevronRight,
  Gift,
  AlertCircle,
  Share2,
} from 'lucide-react';
import Image from 'next/image';
import { EnrichedWishlist, WISHLIST_LIMITS } from '@/lib/wishlist/types';
import { useWishlistStore } from '@/store/useWishlistStore';
import { checkContentModeration } from '@/lib/personalization/validation';
import { useUIStore } from '@/store/useUIStore';

interface WishlistBoardsViewProps {
  onSelectBoard: (boardId: string) => void;
}

export function WishlistBoardsView({ onSelectBoard }: WishlistBoardsViewProps) {
  const enrichedWishlists = useWishlistStore((state) => state.enrichedWishlists);
  const createBoard = useWishlistStore((state) => state.createBoard);
  const openShareDialog = useWishlistStore((state) => state.openShareDialog);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [isGiftList, setIsGiftList] = useState(false);
  const [occasionDate, setOccasionDate] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const trimmedName = boardName.trim();
    if (!trimmedName) {
      setCreateError('Please give your board a name.');
      return;
    }
    if (trimmedName.length > WISHLIST_LIMITS.MAX_NAME_LENGTH) {
      setCreateError(`Name must be under ${WISHLIST_LIMITS.MAX_NAME_LENGTH} characters.`);
      return;
    }

    const moderation = checkContentModeration(trimmedName);
    if (!moderation.isSafe) {
      setCreateError('Please choose a different name (prohibited language detected).');
      return;
    }

    try {
      const created = await createBoard(
        trimmedName,
        boardDescription.trim() || undefined,
        isGiftList,
        occasionDate || null
      );
      useUIStore.getState().success(`Board "${created.name}" created`);
      setIsCreateOpen(false);
      setBoardName('');
      setBoardDescription('');
      setIsGiftList(false);
      setOccasionDate('');
      onSelectBoard(created.id);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create board');
    }
  };

  return (
    <div className="space-y-8">
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-text-muted">
          {enrichedWishlists.length} {enrichedWishlists.length === 1 ? 'board' : 'boards'}
        </p>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="bg-accent hover:bg-accent-hover text-background font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New board</span>
        </button>
      </div>

      {/* Boards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrichedWishlists.map((board, idx) => {
          const images = board.firstFourImages || [];
          const placeholdersNeeded = Math.max(0, 4 - images.length);

          return (
            <motion.div
              key={board.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="group bg-surface hover:bg-surface-hover border border-border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer text-left"
              onClick={() => onSelectBoard(board.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectBoard(board.id);
                }
              }}
              aria-label={`Open ${board.name} board, ${board.itemCount} items`}
            >
              {/* 2x2 Image Collage */}
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-background border border-border/70 grid grid-cols-2 grid-rows-2 gap-1 p-1 mb-4 relative">
                {images.slice(0, 4).map((imgUrl, imgIdx) => (
                  <div
                    key={imgIdx}
                    className="relative w-full h-full bg-surface-active rounded-lg overflow-hidden"
                  >
                    <Image
                      src={imgUrl}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ))}

                {Array.from({ length: placeholdersNeeded }).map((_, pIdx) => (
                  <div
                    key={`ph_${pIdx}`}
                    className="w-full h-full rounded-lg bg-surface/60 border border-dashed border-border/50 flex items-center justify-center text-text-muted/30"
                  >
                    <FolderHeart className="w-5 h-5 stroke-[1.2]" />
                  </div>
                ))}

                {/* Price-Drop Count Badge */}
                {board.priceDropCount > 0 && (
                  <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent text-background text-[11px] font-bold shadow-md tabular-nums">
                    <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>
                      {board.priceDropCount} {board.priceDropCount === 1 ? 'price drop' : 'price drops'}
                    </span>
                  </div>
                )}

                {/* Gift List Tag */}
                {board.isGiftList && (
                  <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface/90 backdrop-blur-md border border-border text-[11px] font-medium text-foreground">
                    <Gift className="w-3 h-3 text-accent" />
                    <span>Gift board</span>
                  </div>
                )}
              </div>

              {/* Board Meta */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground truncate group-hover:text-accent transition-colors">
                      {board.name}
                    </h3>
                    {board.visibility === 'link' ? (
                      <span title="Shared via link" className="inline-flex">
                        <Link2 className="w-3.5 h-3.5 text-accent shrink-0" />
                      </span>
                    ) : (
                      <span title="Private board" className="inline-flex">
                        <Lock className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      </span>
                    )}
                  </div>
                  {board.description && (
                    <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
                      {board.description}
                    </p>
                  )}
                  <p className="text-xs text-text-muted/80 mt-1 font-medium">
                    {board.itemCount} {board.itemCount === 1 ? 'saved item' : 'saved items'}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openShareDialog(board);
                    }}
                    className="p-2 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-active transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                    title="Share this board"
                    aria-label={`Share ${board.name}`}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:translate-x-0.5 group-hover:text-foreground transition-all" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Create Board Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div
            className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCreateOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-board-modal-title"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-full sm:max-w-md bg-surface border border-border rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-border">
                <h3 id="create-board-modal-title" className="text-lg font-bold text-foreground">
                  Create a New Board
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="p-2 text-text-muted hover:text-foreground rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Close"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="py-4 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="board-name-input" className="text-xs font-semibold text-foreground block">
                    Board Name <span className="text-accent">*</span>
                  </label>
                  <input
                    id="board-name-input"
                    type="text"
                    required
                    value={boardName}
                    onChange={(e) => {
                      setBoardName(e.target.value);
                      if (createError) setCreateError(null);
                    }}
                    placeholder="e.g. Living room, Tech setup, Gifts"
                    maxLength={WISHLIST_LIMITS.MAX_NAME_LENGTH}
                    className="w-full bg-background border border-border focus:border-accent rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-text-muted outline-none transition-colors"
                  />
                  <div className="flex justify-between text-[11px] text-text-muted">
                    <span>Keep it short and descriptive.</span>
                    <span>{boardName.length}/{WISHLIST_LIMITS.MAX_NAME_LENGTH}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="board-desc-input" className="text-xs font-semibold text-foreground block">
                    Description (optional)
                  </label>
                  <textarea
                    id="board-desc-input"
                    rows={2}
                    value={boardDescription}
                    onChange={(e) => setBoardDescription(e.target.value)}
                    placeholder="What is this board for?"
                    maxLength={WISHLIST_LIMITS.MAX_DESCRIPTION_LENGTH}
                    className="w-full bg-background border border-border focus:border-accent rounded-xl px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted outline-none transition-colors resize-none"
                  />
                  <div className="flex justify-end text-[11px] text-text-muted">
                    <span>{boardDescription.length}/{WISHLIST_LIMITS.MAX_DESCRIPTION_LENGTH}</span>
                  </div>
                </div>

                {/* Gift Mode Toggle */}
                <div className="pt-2 border-t border-border/60">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGiftList}
                      onChange={(e) => setIsGiftList(e.target.checked)}
                      className="w-4 h-4 rounded border-border accent-accent mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-semibold text-foreground block">
                        This is a gift list
                      </span>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Allows visitors to quietly claim items so friends don’t buy duplicates. Claims are hidden from you!
                      </p>
                    </div>
                  </label>

                  {isGiftList && (
                    <div className="mt-3 pl-7 space-y-1">
                      <label className="text-xs text-text-muted block">
                        Occasion Date (optional):
                      </label>
                      <input
                        type="date"
                        value={occasionDate}
                        onChange={(e) => setOccasionDate(e.target.value)}
                        className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:border-accent outline-none"
                      />
                    </div>
                  )}
                </div>

                {createError && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5 pt-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{createError}</span>
                  </p>
                )}

                <div className="pt-3 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-accent hover:bg-accent-hover text-background font-semibold py-3 rounded-xl text-sm transition-colors min-h-[44px]"
                  >
                    Create Board
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-3 rounded-xl bg-surface-hover hover:bg-surface-active text-foreground text-sm font-medium transition-colors min-h-[44px]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
