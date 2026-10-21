'use client';

import React, { useState, useEffect } from 'react';
import { TrendingDown, ArrowDownRight } from 'lucide-react';
import { PriceHistoryResponse } from '@/lib/price-history/types';
import { formatPriceMinor, toMinorUnits } from '@/lib/price-history/currency';

interface PriceHistoryTagBadgeProps {
  productId: string;
  variantId?: string | null;
  currentPrice?: number;
  addedPrice?: number;
  savedPrice?: number;
  mode: 'card' | 'cart' | 'wishlist';
  className?: string;
}

export const PriceHistoryTagBadge: React.FC<PriceHistoryTagBadgeProps> = ({
  productId,
  variantId,
  currentPrice,
  addedPrice,
  savedPrice,
  mode,
  className = '',
}) => {
  const [data, setData] = useState<PriceHistoryResponse | null>(null);

  // If in cart mode and user-specific addedPrice is lower than current, we know directly
  const hasCartDrop =
    mode === 'cart' &&
    typeof addedPrice === 'number' &&
    typeof currentPrice === 'number' &&
    currentPrice < addedPrice;

  // If in wishlist mode and user-specific savedPrice is higher than current
  const hasWishlistDrop =
    mode === 'wishlist' &&
    typeof savedPrice === 'number' &&
    typeof currentPrice === 'number' &&
    currentPrice < savedPrice;

  useEffect(() => {
    let isCancelled = false;
    const url = `/api/products/${productId}/price-history?days=30${
      variantId ? `&variantId=${encodeURIComponent(variantId)}` : ''
    }`;

    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!isCancelled && json) {
          setData(json);
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [productId, variantId]);

  const currency = data?.currency || 'INR';

  // 1. Cart mode
  if (mode === 'cart') {
    if (hasCartDrop && addedPrice && currentPrice) {
      const dropMinor = toMinorUnits(addedPrice - currentPrice);
      return (
        <div
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-accent/10 border border-accent/30 text-[11px] font-medium text-accent tabular-nums ${className}`}
        >
          <TrendingDown className="w-3 h-3 text-accent shrink-0" />
          <span>Price dropped {formatPriceMinor(dropMinor, currency)} since you added this</span>
        </div>
      );
    }

    if (data?.tag && data.tag.type === 'price_dropped' && data.tag.diffAmount) {
      return (
        <div
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-accent/10 border border-accent/30 text-[11px] font-medium text-accent tabular-nums ${className}`}
        >
          <TrendingDown className="w-3 h-3 text-accent shrink-0" />
          <span>{data.tag.text}</span>
        </div>
      );
    }

    return null;
  }

  // 2. Wishlist mode
  if (mode === 'wishlist') {
    if (hasWishlistDrop && savedPrice && currentPrice) {
      const dropMinor = toMinorUnits(savedPrice - currentPrice);
      return (
        <div
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-[#121212] text-[11px] font-semibold tabular-nums shadow-md ${className}`}
        >
          <ArrowDownRight className="w-3 h-3" />
          <span>Price dropped {formatPriceMinor(dropMinor, currency)}</span>
        </div>
      );
    }

    if (data?.tag && (data.tag.type === 'price_dropped' || data.tag.type === 'lowest_in_days')) {
      return (
        <div
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-[#121212] text-[11px] font-semibold tabular-nums shadow-md ${className}`}
        >
          <ArrowDownRight className="w-3 h-3" />
          <span>{data.tag.highlightPhrase}</span>
        </div>
      );
    }

    return null;
  }

  // 3. Product Card (listing pages) mode
  if (mode === 'card') {
    if (!data?.tag || !data.qualifiesForChart) return null;

    // Only qualifying tags such as "Lowest in 30 days" or "Price dropped ₹X"
    if (data.tag.type === 'lowest_in_days' || data.tag.type === 'price_dropped') {
      return (
        <div
          className={`inline-flex items-center gap-1 text-[11px] font-medium text-accent tabular-nums ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span>{data.tag.highlightPhrase}</span>
        </div>
      );
    }

    return null;
  }

  return null;
};

export default PriceHistoryTagBadge;
