'use client';

import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { calculateTeaser, formatEmiCurrency } from '@/lib/emi/calculator';
import { Product } from '@/lib/mockData';
import { EMI_LENDERS } from '@/config/emi';

interface EMITeaserProps {
  product: Product;
  selectedVariantPrice?: number;
  quantity?: number;
  onOpenCalculator: () => void;
  className?: string;
  minAmountOverride?: number;
}

export const EMITeaser: React.FC<EMITeaserProps> = ({
  product,
  selectedVariantPrice,
  quantity = 1,
  onOpenCalculator,
  className = '',
  minAmountOverride,
}) => {
  const isOutOfStock = product.stockCount === 0;
  const basePrice = selectedVariantPrice ?? product.price;
  const livePrice = basePrice * Math.max(1, quantity);

  // Compute teaser figures dynamically using pure calculation function before any return
  const teaser = useMemo(() => {
    if (isOutOfStock) return null;
    return calculateTeaser(
      livePrice,
      product.category,
      EMI_LENDERS,
      minAmountOverride
    );
  }, [isOutOfStock, livePrice, product.category, minAmountOverride]);

  // If product is out of stock, price is below minimum, or no plan is eligible: render nothing
  if (isOutOfStock || !teaser) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center flex-wrap gap-2 text-[13px] md:text-[14px] text-text-muted select-none ${className}`}
      data-testid="emi-teaser"
    >
      <span>From</span>
      <span className="font-semibold text-foreground tracking-tight tabular-nums">
        {formatEmiCurrency(teaser.minMonthlyAmount)}/mo
      </span>

      {teaser.isNoCost && (
        <span
          className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border border-border bg-surface text-accent"
          title="No interest charged on eligible plans"
        >
          No-cost EMI
        </span>
      )}

      <button
        type="button"
        onClick={onOpenCalculator}
        className="inline-flex items-center gap-0.5 text-accent hover:text-accent-hover font-medium transition-colors focus:outline-none focus:underline"
        aria-haspopup="dialog"
        aria-label={`View EMI options from ${formatEmiCurrency(teaser.minMonthlyAmount)} per month`}
      >
        <span>EMI options</span>
        <ChevronRight className="w-3.5 h-3.5 mt-0.5 opacity-80" />
      </button>
    </div>
  );
};

export default EMITeaser;
