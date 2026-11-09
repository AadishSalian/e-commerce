'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, ListFilter, Plus } from 'lucide-react';
import { useWishlistStore } from '@/store/useWishlistStore';
import { WishlistBoardsView } from '@/components/wishlist/WishlistBoardsView';
import { WishlistDetailView } from '@/components/wishlist/WishlistDetailView';
import { WishlistAllItemsView } from '@/components/wishlist/WishlistAllItemsView';
import { ShareDialog } from '@/components/wishlist/ShareDialog';
import { NotificationsModal } from '@/components/wishlist/NotificationsModal';

export default function WishlistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const boardParam = searchParams.get('board');

  const enrichedWishlists = useWishlistStore((state) => state.enrichedWishlists);
  const isInitialized = useWishlistStore((state) => state.isInitialized);
  const activeWishlistId = useWishlistStore((state) => state.activeWishlistId);
  const setActiveWishlistId = useWishlistStore((state) => state.setActiveWishlistId);

  const [viewMode, setViewMode] = useState<'boards' | 'all'>('boards');
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(boardParam || null);

  useEffect(() => {
    if (boardParam) {
      setSelectedBoardId(boardParam);
    }
  }, [boardParam]);

  const activeBoard = React.useMemo(() => {
    if (!selectedBoardId) return null;
    return enrichedWishlists.find((w) => w.id === selectedBoardId) || null;
  }, [enrichedWishlists, selectedBoardId]);

  const handleSelectBoard = (id: string) => {
    setSelectedBoardId(id);
    setActiveWishlistId(id);
    router.replace(`/wishlist?board=${encodeURIComponent(id)}`, { scroll: false });
  };

  const handleBackToBoards = () => {
    setSelectedBoardId(null);
    router.replace('/wishlist', { scroll: false });
  };

  return (
    <div className="min-h-screen pt-4 md:pt-8 pb-32 px-4 md:px-8 max-w-7xl mx-auto w-full">
      {/* Top Header if in top-level view */}
      {!activeBoard && (
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 border-b border-border/80 pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
              Wishlists
            </h1>
            <p className="text-text-muted text-base md:text-lg max-w-xl">
              Turn saving into planning. Collect options for a room, an occasion, or a gift, and watch for truthful price drops.
            </p>
          </div>

          {/* View Mode Toggle: Boards | All items */}
          <div className="flex items-center p-1 bg-surface border border-border rounded-xl shrink-0 self-start md:self-end">
            <button
              type="button"
              onClick={() => setViewMode('boards')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[36px] ${
                viewMode === 'boards'
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-text-muted hover:text-foreground'
              }`}
              aria-pressed={viewMode === 'boards'}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Boards</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[36px] ${
                viewMode === 'all'
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-text-muted hover:text-foreground'
              }`}
              aria-pressed={viewMode === 'all'}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>All items</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {activeBoard ? (
        <WishlistDetailView board={activeBoard} onBack={handleBackToBoards} />
      ) : viewMode === 'boards' ? (
        <WishlistBoardsView onSelectBoard={handleSelectBoard} />
      ) : (
        <WishlistAllItemsView onSelectBoard={handleSelectBoard} />
      )}

      {/* Global Modals for Wishlist Page */}
      <ShareDialog />
      <NotificationsModal />
    </div>
  );
}
