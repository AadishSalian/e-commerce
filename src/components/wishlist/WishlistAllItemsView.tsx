'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingDown, ShoppingBag, FolderHeart, Trash2, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useCartStore } from '@/store/useCartStore';
import { useUIStore } from '@/store/useUIStore';
import { formatPriceMinor, toMajorUnits } from '@/lib/price-history/currency';
import { MOCK_PRODUCTS } from '@/lib/mockData';

export function WishlistAllItemsView({ onSelectBoard }: { onSelectBoard: (boardId: string) => void }) {
  const enrichedWishlists = useWishlistStore((state) => state.enrichedWishlists);
  const removeItemById = useWishlistStore((state) => state.removeItemById);
  const openPicker = useWishlistStore((state) => state.openPicker);

  const addToCart = useCartStore((state) => state.addToCart);
  const openCart = useUIStore((state) => state.openCart);

  // Group all items across boards deduplicated by productId + variantId
  const aggregatedItems = React.useMemo(() => {
    const map = new Map<string, { item: any; boardNames: { id: string; name: string }[] }>();

    for (const board of enrichedWishlists) {
      for (const it of board.items) {
        const key = `${it.productId}::${it.variantId || ''}`;
        if (!map.has(key)) {
          map.set(key, { item: it, boardNames: [] });
        }
        map.get(key)!.boardNames.push({ id: board.id, name: board.name });
      }
    }

    return Array.from(map.values());
  }, [enrichedWishlists]);

  if (aggregatedItems.length === 0) {
    return (
      <div className="text-center py-20 px-4 bg-surface/50 border border-border rounded-2xl space-y-4">
        <p className="text-base text-foreground font-medium">No saved items found.</p>
        <p className="text-sm text-text-muted max-w-sm mx-auto">
          Start exploring to collect precision-engineered products.
        </p>
        <div className="pt-2">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-foreground text-background font-semibold px-6 py-3 rounded-xl text-sm transition-colors min-h-[44px]"
          >
            Browse collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-muted">
        {aggregatedItems.length} unique {aggregatedItems.length === 1 ? 'object' : 'objects'} across your boards
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aggregatedItems.map(({ item, boardNames }, idx) => {
          const currentMajor = toMajorUnits(item.currentPriceMinor);

          return (
            <motion.div
              key={`${item.productId}_${item.variantId || 'novar'}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              className="bg-surface border border-border rounded-2xl p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Image */}
                <Link
                  href={`/products/${item.productId}`}
                  className="relative w-full aspect-square rounded-xl overflow-hidden bg-background border border-border/80 block mb-4 group/img"
                >
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover/img:scale-105"
                  />
                  {item.priceDroppedMinor && item.priceDroppedMinor > 0 && (
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent text-background text-[11px] font-bold shadow-md tabular-nums">
                      <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Dropped {formatPriceMinor(item.priceDroppedMinor, item.currency)}</span>
                    </div>
                  )}
                </Link>

                {/* Details */}
                <h3 className="font-bold text-foreground text-base truncate">
                  <Link href={`/products/${item.productId}`} className="hover:text-accent transition-colors">
                    {item.productName}
                  </Link>
                </h3>

                <p className="text-sm font-semibold text-foreground tabular-nums mt-1">
                  ${currentMajor.toFixed(2)}
                  {item.variantValue && (
                    <span className="text-xs text-text-muted font-normal ml-1">
                      • {item.variantValue}
                    </span>
                  )}
                </p>

                {/* Board Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-3">
                  <span className="text-[11px] text-text-muted mr-1">On boards:</span>
                  {boardNames.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => onSelectBoard(b.id)}
                      className="px-2 py-0.5 rounded-md bg-surface-hover hover:bg-surface-active text-text-muted hover:text-foreground text-[10px] font-medium border border-border/70 transition-colors"
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border/80 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const prod = MOCK_PRODUCTS.find((p) => p.id === item.productId);
                    if (prod) openPicker(prod, item.variantId, item.variantValue);
                  }}
                  className="text-xs text-text-muted hover:text-foreground font-medium py-2 px-1 transition-colors min-h-[44px]"
                >
                  Manage boards…
                </button>

                <button
                  type="button"
                  disabled={!item.isInStock || item.isDiscontinued}
                  onClick={() => {
                    const prod = MOCK_PRODUCTS.find((p) => p.id === item.productId);
                    if (prod) {
                      addToCart(prod, 1, item.variantValue || undefined);
                      useUIStore.getState().success(`Added ${item.productName} to bag`);
                      openCart();
                    }
                  }}
                  className="bg-accent hover:bg-accent-hover text-background font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-30 min-h-[44px]"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to bag</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
