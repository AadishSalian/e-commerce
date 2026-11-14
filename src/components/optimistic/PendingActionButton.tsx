'use client';

/**
 * PendingActionButton
 * Implements Section 1 rules for non-optimistic / high-risk / irreversible actions:
 * - Payment, order placement, money movement
 * - Stock reservations at checkout
 * - Security actions (password, email changes, sign-out)
 * - Coupon redemption with server verification
 *
 * Provides immediate feedback via an inline spinner, disabled state, and calm "Confirming…"
 * without ever assuming optimistic success before server confirmation.
 */

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

export interface PendingActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onAction: () => Promise<void> | void;
  pendingText?: string;
  className?: string;
  icon?: React.ReactNode;
}

export const PendingActionButton: React.FC<PendingActionButtonProps> = ({
  children,
  onAction,
  pendingText = 'Confirming…',
  className = '',
  icon,
  disabled = false,
  ...props
}) => {
  const [isPending, setIsPending] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isPending) return;

    setIsPending(true);
    try {
      await onAction();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isPending}
      aria-busy={isPending}
      className={`relative inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-medium text-sm transition-all duration-200 select-none min-h-[44px] min-w-[44px] ${
        isPending
          ? 'bg-surface border border-border text-text-muted cursor-wait opacity-80'
          : 'bg-foreground text-background hover:bg-foreground/90'
      } ${disabled ? 'opacity-40 cursor-not-allowed hover:bg-foreground' : ''} ${className}`}
      {...props}
    >
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-accent shrink-0" aria-hidden="true" />
          <span>{pendingText}</span>
        </>
      ) : (
        <>
          {icon}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};
