'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Package,
  Tag,
  Layers,
  ShieldAlert,
  ShieldCheck,
  MoreVertical,
  Check,
  Eye,
  Trash2,
  BellOff,
  ShoppingBag,
} from 'lucide-react';
import { NotificationRecord } from '@/lib/notifications/types';
import { formatRelativeTime } from '@/lib/notifications/validation';
import { formatPriceMinor } from '@/lib/price-history/currency';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useCart } from '@/contexts/CartContext';
import { MOCK_PRODUCTS } from '@/lib/mockData';

interface NotificationItemProps {
  notification: NotificationRecord;
  onNavigate?: () => void;
}

export function NotificationItem({ notification, onNavigate }: NotificationItemProps) {
  const router = useRouter();
  const { markAsRead, markAsUnread, dismiss } = useNotificationStore();
  const { addToCart, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isUnread = notification.read_at === null;
  const isSecurity = notification.category === 'account';
  const isPrice = notification.category === 'price';
  const isStock = notification.category === 'stock';

  // Close overflow menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  const handleRowClick = () => {
    if (isUnread) {
      markAsRead(notification.id);
    }
    onNavigate?.();
  };

  const handleToggleRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUnread) {
      markAsRead(notification.id);
    } else {
      markAsUnread(notification.id);
    }
    setMenuOpen(false);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dismiss(notification.id);
    setMenuOpen(false);
  };

  const handleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    onNavigate?.();
    router.push('/account/notifications');
  };

  const handleInlineAddToBag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const productId = notification.payload.productId;
    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (product) {
      addToCart(product, 1, notification.payload.variantValue);
      openCart();
    } else if (notification.deep_link) {
      router.push(notification.deep_link);
    }
  };

  const renderIconChip = () => {
    if (isSecurity) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
          <ShieldAlert className="w-4 h-4" />
        </div>
      );
    }
    if (isPrice) {
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
          <Tag className="w-4 h-4" />
        </div>
      );
    }
    if (isStock) {
      return (
        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20">
          <Layers className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-surface-active text-foreground flex items-center justify-center shrink-0 border border-border">
        <Package className="w-4 h-4" />
      </div>
    );
  };

  const formattedAbsoluteDate = new Date(notification.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: 'hidden', transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative list-none border-b border-border/40 transition-colors ${
        isUnread ? 'bg-surface/60 hover:bg-surface-hover/80' : 'bg-transparent hover:bg-surface/40'
      } ${isSecurity ? 'border-l-2 border-l-amber-500/70' : ''}`}
    >
      <Link
        href={notification.deep_link}
        onClick={handleRowClick}
        className="flex items-start gap-3 p-3.5 w-full text-left outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
      >
        {/* Unread accent dot indicator */}
        <div className="pt-2">
          {isUnread ? (
            <span
              className="block w-2 h-2 rounded-full bg-accent shrink-0"
              aria-hidden="true"
            />
          ) : (
            <span className="block w-2 h-2 shrink-0 opacity-0" aria-hidden="true" />
          )}
        </div>

        {/* Thumbnail or Icon Chip */}
        {notification.payload.productImage ? (
          <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-border bg-surface-active">
            <Image
              src={notification.payload.productImage}
              alt=""
              width={44}
              height={44}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          renderIconChip()
        )}

        {/* Content Column */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isUnread && <span className="sr-only">Unread: </span>}
            <h3
              className={`text-xs leading-snug truncate ${
                isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'
              }`}
            >
              {notification.title}
            </h3>
          </div>

          <p className="text-xs text-text-muted leading-relaxed line-clamp-2 mt-0.5">
            {notification.body}
          </p>

          {/* Price Drop metadata */}
          {isPrice && notification.payload.newPriceMinor && (
            <div className="flex items-center gap-2 mt-1.5 text-xs">
              <span className="font-semibold text-foreground tabular-nums">
                {formatPriceMinor(notification.payload.newPriceMinor, notification.payload.currency)}
              </span>
              {notification.payload.oldPriceMinor && (
                <span className="line-through text-text-muted tabular-nums">
                  {formatPriceMinor(notification.payload.oldPriceMinor, notification.payload.currency)}
                </span>
              )}
              {notification.payload.dropAmountMinor && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 tabular-nums">
                  Save {formatPriceMinor(notification.payload.dropAmountMinor, notification.payload.currency)}
                </span>
              )}
            </div>
          )}

          {/* Restock Inline Add to Bag */}
          {isStock && (
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleInlineAddToBag}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-accent text-background hover:bg-accent-hover transition-colors shadow-2xs cursor-pointer"
                aria-label={`Add ${notification.payload.productName || 'item'} to bag`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to bag</span>
              </button>
            </div>
          )}

          {/* Security alert "This wasn't me" action */}
          {isSecurity && (
            <div className="mt-1.5 flex items-center gap-3 text-xs">
              <span className="text-amber-400 font-medium hover:underline">
                This wasn’t me &rarr;
              </span>
            </div>
          )}

          {/* Timestamp */}
          <div className="mt-1 flex items-center gap-2 text-[11px] text-text-muted/70 tabular-nums">
            <time
              dateTime={notification.created_at}
              title={formattedAbsoluteDate}
            >
              {formatRelativeTime(notification.created_at)}
            </time>
            {notification.payload.carrier && (
              <>
                <span>·</span>
                <span>{notification.payload.carrier}</span>
              </>
            )}
          </div>
        </div>
      </Link>

      {/* Overflow row menu button */}
      <div className="absolute top-2.5 right-2" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          className="p-1.5 rounded-md text-text-muted hover:text-foreground hover:bg-surface-active transition-colors cursor-pointer"
          aria-label="Notification actions"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-1 w-44 rounded-xl bg-surface border border-border shadow-lg py-1 z-30 text-xs font-medium backdrop-blur-md"
          >
            <button
              role="menuitem"
              type="button"
              onClick={handleToggleRead}
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
            >
              {isUnread ? (
                <>
                  <Check className="w-3.5 h-3.5 text-accent" />
                  <span>Mark as read</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-text-muted" />
                  <span>Mark as unread</span>
                </>
              )}
            </button>

            <button
              role="menuitem"
              type="button"
              onClick={handleDismiss}
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-text-muted" />
              <span>Dismiss</span>
            </button>

            {!isSecurity && (
              <button
                role="menuitem"
                type="button"
                onClick={handleMute}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer border-t border-border/40 mt-1"
              >
                <BellOff className="w-3.5 h-3.5" />
                <span>Mute {notification.category} alerts</span>
              </button>
            )}
          </div>
        )}
      </div>
    </motion.li>
  );
}
