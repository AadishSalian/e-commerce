'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, WifiOff } from 'lucide-react';
import { useOptimisticCartStore } from '@/store/useOptimisticCartStore';

export interface CheckoutGateProps {
  onSuccessNavigate?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const CheckoutGate: React.FC<CheckoutGateProps> = ({
  onSuccessNavigate,
  className = '',
  children,
}) => {
  const router = useRouter();
  const isCheckoutGated = useOptimisticCartStore((s) => s.isCheckoutGated);
  const isOnline = useOptimisticCartStore((s) => s.isOnline);
  const flushPending = useOptimisticCartStore((s) => s.flushPending);
  const [isFlushing, setIsFlushing] = useState(false);

  const handleCheckoutClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!isOnline) {
      return;
    }

    setIsFlushing(true);
    try {
      // Flush and wait for all pending mutations to settle
      await flushPending();
      if (onSuccessNavigate) {
        onSuccessNavigate();
      } else {
        router.push('/checkout');
      }
    } finally {
      setIsFlushing(false);
    }
  };

  if (!isOnline) {
    return (
      <div className="flex flex-col gap-2">
        <button
          disabled
          aria-disabled="true"
          className={`w-full flex items-center justify-center gap-2 py-4 bg-surface text-text-muted border border-border font-medium rounded-full cursor-not-allowed opacity-60 min-h-[44px] ${className}`}
        >
          <WifiOff className="w-4 h-4" />
          <span>Checkout unavailable while offline</span>
        </button>
        <p className="text-[11px] text-center text-text-muted">
          Your changes will sync automatically when your internet connection is restored.
        </p>
      </div>
    );
  }

  const isPending = isCheckoutGated || isFlushing;

  return (
    <button
      onClick={handleCheckoutClick}
      disabled={isPending}
      aria-busy={isPending}
      className={`w-full flex items-center justify-center gap-2 py-4 bg-foreground text-background font-medium rounded-full transition-transform duration-200 hover:scale-[0.98] min-h-[44px] ${
        isPending ? 'opacity-80 cursor-wait' : ''
      } ${className}`}
    >
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-background shrink-0" />
          <span>Updating your bag…</span>
        </>
      ) : (
        children || (
          <>
            <Lock className="w-4 h-4" />
            <span>Checkout</span>
          </>
        )
      )}
    </button>
  );
};
