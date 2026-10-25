'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, Layers, ArrowRight, Plus } from 'lucide-react';
import { useCompare } from '@/contexts/CompareContext';
import { useBottomStackStore } from '@/lib/compare/bottomStack';
import { MAX_COMPARE_ITEMS } from '@/lib/compare/types';

export function CompareTray() {
  const pathname = usePathname();
  const {
    items,
    compareQueue,
    removeFromCompare,
    clearCompare,
    isMinimized,
    setMinimized,
    toggleMinimized,
    highlightedId
  } = useCompare();

  const isStickyAddToCartVisible = useBottomStackStore((state) => state.isStickyAddToCartVisible);
  const registerElement = useBottomStackStore((state) => state.registerElement);
  const unregisterElement = useBottomStackStore((state) => state.unregisterElement);

  const [isMobile, setIsMobile] = useState(false);

  // Suppress tray completely on cart and checkout pages
  const isSuppressedRoute =
    pathname.startsWith('/cart') ||
    pathname.startsWith('/checkout') ||
    pathname === '/compare'; // On the compare page itself, the tray can be hidden or minimized

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Register height with bottom stack coordinator
  useEffect(() => {
    if (items.length === 0 || isSuppressedRoute) {
      unregisterElement('compare-tray');
      return;
    }

    const height = isMinimized ? 40 : 72;
    registerElement('compare-tray', height, false);

    return () => {
      unregisterElement('compare-tray');
    };
  }, [items.length, isMinimized, isSuppressedRoute, registerElement, unregisterElement]);

  // If sticky Add to Bag appears on mobile PDP, auto-minimize to avoid covering the buy action
  const effectiveMinimized = isMinimized || (isMobile && isStickyAddToCartVisible);

  if (items.length === 0 || isSuppressedRoute) {
    return null;
  }

  const count = items.length;
  const canCompare = count >= 2;
  const emptySlotsCount = Math.max(0, MAX_COMPARE_ITEMS - count);

  return (
    <div
      className={`fixed z-40 transition-all duration-300 pointer-events-none ${
        isMobile
          ? 'left-3 right-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))]'
          : 'left-1/2 -translate-x-1/2 bottom-6 w-full max-w-4xl px-4'
      }`}
    >
      <AnimatePresence mode="wait">
        {effectiveMinimized ? (
          /* MINIMIZED PILL */
          <motion.div
            key="minimized-pill"
            layoutId="compare-tray-container"
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="pointer-events-auto flex justify-end md:justify-center"
          >
            <button
              onClick={() => setMinimized(false)}
              className="group flex items-center gap-2.5 px-4 py-2 bg-surface/95 backdrop-blur-md border border-border/80 shadow-md hover:border-foreground/40 rounded-full text-foreground text-xs font-medium transition-colors"
              aria-label={`Expand compare tray with ${count} item${count === 1 ? '' : 's'}`}
            >
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-accent" />
                <span>Compare</span>
                <span className="px-1.5 py-0.2 rounded-full bg-surface-active border border-border text-[11px] font-mono tabular-nums">
                  {count}
                </span>
              </div>
              <ChevronUp className="w-3.5 h-3.5 text-text-muted group-hover:text-foreground transition-transform group-hover:-translate-y-0.5" />
            </button>
          </motion.div>
        ) : (
          /* FULL TRAY (COLLAPSED 1-ITEM OR ACTIVE 2-4 ITEMS) */
          <motion.div
            key="full-tray"
            layoutId="compare-tray-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="pointer-events-auto w-full bg-surface/95 backdrop-blur-xl border border-border shadow-xl rounded-2xl p-2.5 sm:p-3 overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4">
              {/* Left: Section Header & Slots */}
              <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-0.5 scrollbar-none">
                {/* Badge & minimize header */}
                <div className="flex flex-col shrink-0 pr-1 border-r border-border/60">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground tracking-tight">Compare</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-surface-active border border-border/80 text-[10px] font-mono font-bold text-foreground tabular-nums">
                      {count}/{MAX_COMPARE_ITEMS}
                    </span>
                  </div>
                  {count === 1 ? (
                    <span className="text-[10px] text-text-muted whitespace-nowrap mt-0.5">
                      Add 1 more to compare
                    </span>
                  ) : (
                    <button
                      onClick={clearCompare}
                      className="text-[10px] text-text-muted hover:text-foreground underline decoration-border hover:decoration-foreground transition-colors text-left mt-0.5"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Selected Item Slots */}
                <div className="flex items-center gap-2">
                  {items.map((item, index) => {
                    const product = compareQueue.find((p) => p.id === item.productId);
                    const isHighlighted = highlightedId === item.productId;

                    return (
                      <motion.div
                        key={item.productId}
                        layout
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{
                          opacity: 1,
                          scale: isHighlighted ? [1, 1.08, 0.98, 1.04, 1] : 1,
                          borderColor: isHighlighted
                            ? 'var(--accent, #3b82f6)'
                            : 'var(--border, rgba(255,255,255,0.12))'
                        }}
                        transition={{
                          scale: { duration: 0.5 },
                          borderColor: { duration: 0.3 }
                        }}
                        className={`group relative flex items-center gap-2 p-1.5 pr-2 rounded-xl border bg-surface-active/60 max-w-[150px] sm:max-w-[170px] shrink-0 transition-colors ${
                          isHighlighted ? 'ring-2 ring-accent/40 shadow-sm' : 'border-border/80'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="w-9 h-9 rounded-lg bg-surface overflow-hidden relative shrink-0 border border-border/40">
                          {product?.image ? (
                            <Image
                              src={product.image}
                              alt={product.name || 'Product'}
                              fill
                              className="object-cover"
                              sizes="36px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-text-muted">
                              {index + 1}
                            </div>
                          )}
                        </div>

                        {/* Title and Price */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate leading-tight">
                            {product?.name || `Item ${index + 1}`}
                          </p>
                          <p className="text-[10px] text-text-muted font-mono tabular-nums leading-tight mt-0.5">
                            {product ? `$${product.price.toFixed(2)}` : '—'}
                          </p>
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeFromCompare(item.productId)}
                          className="w-5 h-5 rounded-md flex items-center justify-center text-text-muted hover:text-foreground hover:bg-surface transition-colors shrink-0"
                          aria-label={`Remove ${product?.name || 'item'} from comparison`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    );
                  })}

                  {/* Empty dashed placeholder slots */}
                  {Array.from({ length: emptySlotsCount }).map((_, i) => (
                    <div
                      key={`empty-slot-${i}`}
                      className="hidden sm:flex items-center justify-center w-24 h-12 rounded-xl border border-dashed border-border/60 hover:border-text-muted/40 transition-colors text-text-muted/50 group/slot cursor-default shrink-0"
                      title="Add another item to compare"
                    >
                      <Plus className="w-3.5 h-3.5 text-text-muted/40 group-hover/slot:text-text-muted transition-colors" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Actions & Minimize Chevron */}
              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
                <div className="flex sm:hidden items-center">
                  <button
                    onClick={clearCompare}
                    className="text-[11px] text-text-muted hover:text-foreground underline decoration-border"
                  >
                    Clear all
                  </button>
                </div>

                <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                  {canCompare ? (
                    <Link
                      href={`/compare?ids=${items.map((i) => i.productId).join(',')}`}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-foreground text-background font-medium text-xs rounded-xl hover:bg-foreground/90 shadow-sm transition-colors whitespace-nowrap"
                    >
                      <span>Compare now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-active text-text-muted font-medium text-xs rounded-xl opacity-60 cursor-not-allowed whitespace-nowrap"
                      title="Add at least 2 items to compare"
                    >
                      <span>Add 1 more</span>
                    </button>
                  )}

                  {/* Minimize button */}
                  <button
                    type="button"
                    onClick={() => toggleMinimized()}
                    className="p-1.5 text-text-muted hover:text-foreground hover:bg-surface-active rounded-xl transition-colors shrink-0"
                    aria-label="Minimize compare tray"
                    title="Minimize"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
