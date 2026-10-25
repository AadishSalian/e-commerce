'use client';

import React from 'react';
import { Layers, Check } from 'lucide-react';
import { Product } from '@/lib/mockData';
import { useCompare } from '@/contexts/CompareContext';

interface CompareButtonProps {
  product: Product;
  variant?: 'card-corner' | 'icon' | 'detail';
  className?: string;
}

export function CompareButton({
  product,
  variant = 'card-corner',
  className = ''
}: CompareButtonProps) {
  const { addToCompare, removeFromCompare, hasInCompare, canAddToCompare, isFull } = useCompare();

  // Don't show compare on non-comparable product types (e.g. gift cards)
  if (!product || !product.category || product.category === 'Gift Cards') {
    return null;
  }

  const isInCompare = hasInCompare(product.id);
  const check = canAddToCompare(product);
  const isLimitReached = !isInCompare && isFull && check.reason === 'limit_reached';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInCompare) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  if (variant === 'card-corner') {
    return (
      <div className={`relative group/compare-corner ${className}`}>
        <button
          type="button"
          onClick={handleClick}
          disabled={isLimitReached}
          aria-pressed={isInCompare}
          aria-label={
            isInCompare
              ? `Remove ${product.name} from comparison`
              : isLimitReached
              ? 'Compare limit reached (max 4)'
              : `Add ${product.name} to comparison`
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium backdrop-blur-md transition-all shadow-sm ${
            isInCompare
              ? 'bg-foreground text-background shadow-md'
              : isLimitReached
              ? 'bg-background/60 text-text-muted/40 cursor-not-allowed border border-border/40'
              : 'bg-background/85 text-foreground hover:bg-background border border-border/80 hover:border-foreground/40'
          }`}
        >
          {/* Checkbox box */}
          <span
            className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] transition-colors ${
              isInCompare
                ? 'border-background bg-background text-foreground font-bold'
                : 'border-border/80 group-hover/compare-corner:border-foreground'
            }`}
          >
            {isInCompare && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </span>
          <span className="tracking-tight select-none">
            {isInCompare ? 'Comparing' : 'Compare'}
          </span>
        </button>

        {/* Limit reached tooltip */}
        {isLimitReached && (
          <div className="absolute top-full right-0 mt-1.5 px-2.5 py-1 bg-surface border border-border rounded-lg text-[10px] text-text-muted whitespace-nowrap shadow-xl pointer-events-none opacity-0 group-hover/compare-corner:opacity-100 transition-opacity z-30">
            Remove an item to add another
          </div>
        )}
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className={`relative group/compare-detail ${className}`}>
        <button
          type="button"
          onClick={handleClick}
          disabled={isLimitReached}
          aria-pressed={isInCompare}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-medium transition-all ${
            isInCompare
              ? 'bg-foreground text-background border-foreground shadow-sm'
              : isLimitReached
              ? 'opacity-40 cursor-not-allowed border-border text-text-muted'
              : 'border-border text-foreground hover:bg-surface hover:border-foreground/50'
          }`}
        >
          {isInCompare ? (
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : (
            <Layers className="w-3.5 h-3.5" />
          )}
          <span>{isInCompare ? 'In Comparison' : 'Compare'}</span>
        </button>

        {isLimitReached && (
          <div className="absolute top-full left-0 mt-2 px-2.5 py-1 bg-surface border border-border rounded-lg text-[10px] text-text-muted whitespace-nowrap shadow-xl pointer-events-none opacity-0 group-hover/compare-detail:opacity-100 transition-opacity z-30">
            Remove an item to add another (max 4)
          </div>
        )}
      </div>
    );
  }

  // variant === 'icon' (for action overlay)
  return (
    <div className={`relative group/compare-icon ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLimitReached}
        aria-pressed={isInCompare}
        className={`p-2.5 rounded-full transition-all shadow-lg ${
          isInCompare
            ? 'bg-foreground text-background scale-105'
            : isLimitReached
            ? 'bg-background/50 text-text-muted/40 cursor-not-allowed'
            : 'bg-background/90 backdrop-blur-md text-foreground hover:bg-background hover:scale-105'
        }`}
        title={
          isInCompare
            ? 'Remove from comparison'
            : isLimitReached
            ? 'Compare limit reached (max 4)'
            : 'Compare'
        }
        aria-label={
          isInCompare
            ? `Remove ${product.name} from comparison`
            : `Compare ${product.name}`
        }
      >
        <Layers className={`w-5 h-5 ${isInCompare ? 'fill-current' : ''}`} />
      </button>

      {isLimitReached && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-surface border border-border rounded-lg text-[10px] text-text-muted whitespace-nowrap shadow-xl pointer-events-none opacity-0 group-hover/compare-icon:opacity-100 transition-opacity z-30">
          Remove an item to add another
        </div>
      )}
    </div>
  );
}
