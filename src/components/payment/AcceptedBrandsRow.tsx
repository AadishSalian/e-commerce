'use client';

import React from 'react';
import { CardBrandId } from '@/lib/payment/types';
import { DEFAULT_MERCHANT_CONFIG } from '@/lib/payment/config';
import { CARD_BRAND_DEFINITIONS } from '@/lib/payment/cardBrands';
import { CardBrandIcon } from './CardBrandIcon';

interface AcceptedBrandsRowProps {
  acceptedBrands?: readonly CardBrandId[];
  className?: string;
}

/**
 * Renders the accepted card brands row beneath the payment form.
 * Uses official brand logos, config-driven list, and accessible list semantics.
 */
export function AcceptedBrandsRow({
  acceptedBrands = DEFAULT_MERCHANT_CONFIG.acceptedBrands,
  className = '',
}: AcceptedBrandsRowProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 pt-1 ${className}`}>
      <span className="text-[11px] text-text-muted font-medium mr-1 select-none">
        Accepted cards:
      </span>
      <div
        className="flex items-center gap-1.5 flex-wrap"
        role="list"
        aria-label="Accepted payment cards"
      >
        {acceptedBrands.map((brandId) => {
          const meta = CARD_BRAND_DEFINITIONS[brandId];
          const brandName = meta ? meta.name : brandId;

          return (
            <div
              key={brandId}
              role="listitem"
              className="inline-flex items-center justify-center p-0.5 rounded border border-border-subtle bg-surface-active/60 hover:border-border transition-colors"
              title={`We accept ${brandName}`}
            >
              <CardBrandIcon brand={brandId} size={18} alt={brandName} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
