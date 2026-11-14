'use client';

import React, { useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { Minus, Plus, X, Trash2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { OptimisticCartItem, getItemUnitPrice } from '@/store/useOptimisticCartStore';
import { OptimisticPriceDisplay } from './OptimisticPriceDisplay';
import { PriceHistoryTagBadge } from '@/components/product/price-history';
import { MOTION_TOKENS } from './motionTokens';

export interface OptimisticDrawerItemProps {
  item: OptimisticCartItem;
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onRemove: (cartId: string) => void;
  onRetry: (cartId: string) => void;
  onDismissError: (cartId: string) => void;
}

export const OptimisticDrawerItem: React.FC<OptimisticDrawerItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  onRetry,
  onDismissError,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const unitPrice = getItemUnitPrice(item);
  const lineTotal = unitPrice * item.quantity;
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRemove = () => {
    // Before removing, if focus is inside this container, shift to nearest parent or heading
    if (containerRef.current?.contains(document.activeElement)) {
      const heading = document.getElementById('cart-drawer-heading');
      if (heading) {
        heading.focus();
      }
    }
    onRemove(item.cartId);
  };

  return (
    <motion.div
      ref={containerRef}
      layout="position"
      initial={{
        opacity: 0,
        height: prefersReducedMotion ? 'auto' : 0,
      }}
      animate={{
        opacity: 1,
        height: 'auto',
      }}
      exit={{
        opacity: 0,
        height: prefersReducedMotion ? 'auto' : 0,
        transition: {
          duration: MOTION_TOKENS.lineEnterExitDurationSec,
          ease: MOTION_TOKENS.easing,
        },
      }}
      transition={{
        duration: MOTION_TOKENS.lineEnterExitDurationSec,
        ease: MOTION_TOKENS.easing,
      }}
      className="relative overflow-hidden rounded-xl border border-border/60 bg-surface/80 mb-3 group"
    >
      <div className="p-4 flex gap-4 relative z-10">
        {/* Product Image */}
        <div className="w-20 h-20 bg-surface-hover rounded-lg flex-shrink-0 border border-border relative overflow-hidden">
          <Image
            src={item.image}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover"
            width={160}
            height={160}
          />
          {item.personalization && (
            <span className="absolute bottom-1 right-1 bg-accent text-black text-[8px] font-mono px-1 rounded font-bold shadow-sm">
              CUSTOM
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col flex-grow justify-between min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="truncate">
              <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
              {item.selectedVariant && (
                <p className="text-xs text-text-muted mt-0.5">{item.selectedVariant}</p>
              )}
              {item.personalization && (
                <p className="text-xs text-accent mt-0.5 flex items-center gap-1 font-medium truncate">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  &ldquo;{item.personalization.lines.filter(Boolean).join(' ')}&rdquo;
                </p>
              )}
              <div className="mt-1">
                <PriceHistoryTagBadge
                  productId={item.id}
                  currentPrice={item.price}
                  addedPrice={item.addedPrice}
                  mode="cart"
                />
              </div>
            </div>

            {/* Remove Button (min 44x44px accessible target) */}
            <button
              onClick={handleRemove}
              className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center text-text-muted hover:text-red-500 transition-colors rounded-full"
              aria-label={`Remove ${item.name} from bag`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quantity Controls & Price Display */}
          <div className="flex justify-between items-end mt-3">
            <div className="flex items-center bg-background rounded-full border border-border overflow-hidden h-9">
              <button
                onClick={() => onUpdateQuantity(item.cartId, -1)}
                className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                aria-label={`Decrease quantity of ${item.name}`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              {/* Quantity Digit Crossfade with Vertical Slide (Section 8) */}
              <div className="w-8 h-9 relative overflow-hidden flex items-center justify-center">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={item.quantity}
                    initial={{
                      opacity: 0,
                      y: prefersReducedMotion ? 0 : -MOTION_TOKENS.digitSlideDistancePx,
                    }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{
                      opacity: 0,
                      y: prefersReducedMotion ? 0 : MOTION_TOKENS.digitSlideDistancePx,
                    }}
                    transition={{ duration: 0.15, ease: MOTION_TOKENS.easing }}
                    className="text-sm font-medium tabular-nums text-foreground"
                  >
                    {item.quantity}
                  </motion.span>
                </AnimatePresence>
              </div>

              <button
                onClick={() => onUpdateQuantity(item.cartId, 1)}
                className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                aria-label={`Increase quantity of ${item.name}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Price with subtle pending shimmer */}
            <OptimisticPriceDisplay
              amount={lineTotal}
              isOptimistic={item.isOptimistic}
              isSyncingSlow={item.isSyncingSlow}
              size="md"
            />
          </div>
        </div>
      </div>

      {/* In-Place Error & Retry Row (Section 6: "affected line shows small inline 'Couldn't update. Retry' row") */}
      {item.inlineError && (
        <div className="px-4 py-2 bg-red-950/30 border-t border-red-900/40 flex items-center justify-between text-xs text-foreground">
          <div className="flex items-center gap-1.5 text-red-400">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{item.inlineError.message}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRetry(item.cartId)}
              className="px-2.5 py-1 rounded bg-surface hover:bg-surface-hover border border-border text-foreground font-semibold hover:text-accent flex items-center gap-1 min-h-[32px]"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
            <button
              onClick={() => onDismissError(item.cartId)}
              className="p-1 text-text-muted hover:text-foreground"
              aria-label="Dismiss line error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
