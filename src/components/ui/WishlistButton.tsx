'use client';

import React, { useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useWishlistStore } from '@/store/useWishlistStore';
import { Product } from '@/lib/mockData';

export interface WishlistButtonProps {
  product: Product;
  variantId?: string | null;
  variantLabel?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function WishlistButton({
  product,
  variantId,
  variantLabel,
  className = '',
  size = 'md',
}: WishlistButtonProps) {
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);
  const toggleQuickSave = useWishlistStore((state) => state.toggleQuickSave);
  const openPicker = useWishlistStore((state) => state.openPicker);
  const wishlists = useWishlistStore((state) => state.wishlists);
  const defaultList = wishlists.find((w) => w.isDefault) || wishlists[0];

  const active = isInWishlist(product.id, variantId);
  const shouldReduceMotion = useReducedMotion();

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2.5',
    lg: 'w-12 h-12 p-3',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handlePointerDown = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(40);
      }
      openPicker(product, variantId, variantLabel);
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }

    toggleQuickSave(product, variantId, variantLabel);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openPicker(product, variantId, variantLabel);
  };

  const listName = defaultList?.name || 'wishlist';
  const accessibleLabel = active
    ? `Saved to ${listName}. Change lists for ${product.name}`
    : `Save ${product.name} to wishlist`;

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={handleContextMenu}
      className={`relative inline-flex items-center justify-center rounded-full bg-surface/90 hover:bg-surface border border-border/80 text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background select-none min-w-[44px] min-h-[44px] ${sizeClasses[size]} ${className}`}
      aria-pressed={active}
      aria-label={accessibleLabel}
      title={active ? `Saved to ${listName} (long-press to organize)` : 'Save to wishlist'}
    >
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                scale: active ? [1, 1.18, 1] : 1,
              }
        }
        transition={{
          duration: 0.25,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="flex items-center justify-center pointer-events-none"
      >
        <Heart
          className={`${iconSizes[size]} transition-colors duration-200 ${
            active ? 'text-accent fill-accent' : 'text-foreground hover:text-accent'
          }`}
        />
      </motion.div>
    </button>
  );
}
