'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, CheckCircle2 } from 'lucide-react';
import { NotificationCategory } from '@/lib/notifications/types';

interface NotificationEmptyStateProps {
  category: 'all' | NotificationCategory;
  onClose?: () => void;
}

export function NotificationEmptyState({ category, onClose }: NotificationEmptyStateProps) {
  let title = "You're all caught up";
  let explanation =
    'Real order milestones, verified price drops, and restocks will appear here as they happen.';

  if (category === 'orders') {
    title = 'No order updates right now';
    explanation = 'Dispatch milestones, tracking details, and delivery confirmations will appear here.';
  } else if (category === 'price') {
    title = 'No active price drops';
    explanation = 'Items on your wishlists that drop in price by at least 5% will appear here calmly.';
  } else if (category === 'stock') {
    title = 'No restock alerts';
    explanation = 'When out-of-stock items on your wishlists are restocked, you will see them here.';
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center select-none">
      <div className="w-10 h-10 rounded-full bg-surface-active/60 border border-border/60 flex items-center justify-center text-text-muted mb-3">
        <CheckCircle2 className="w-5 h-5 text-accent/70" />
      </div>

      <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
      <p className="text-xs text-text-muted max-w-[260px] mt-1 leading-relaxed">
        {explanation}
      </p>

      <Link
        href="/account/notifications"
        onClick={onClose}
        className="mt-4 text-xs font-medium text-accent hover:underline inline-flex items-center gap-1"
      >
        <span>Manage notification preferences</span> &rarr;
      </Link>
    </div>
  );
}
