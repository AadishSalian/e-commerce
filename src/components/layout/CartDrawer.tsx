'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { X, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { FreeShippingProgressBar } from '@/components/cart/FreeShippingProgressBar';
import {
  OptimisticDrawerItem,
  OfflineSyncBanner,
  ReconciliationNoticeBanner,
  CheckoutGate,
  OptimisticPriceDisplay,
} from '@/components/optimistic';
import { useOptimisticCartStore } from '@/store/useOptimisticCartStore';

export function CartDrawer() {
  const { isCartOpen, closeCart, cartItems, updateQuantity, removeFromCart } = useCart();
  const subtotal = useOptimisticCartStore((s) => s.subtotal);
  const isSyncing = useOptimisticCartStore((s) => s.isSyncing);
  const reconciliationNotices = useOptimisticCartStore((s) => s.reconciliationNotices);
  const dismissNotice = useOptimisticCartStore((s) => s.dismissNotice);
  const retryFailedMutation = useOptimisticCartStore((s) => s.retryFailedMutation);
  const dismissFailedMutation = useOptimisticCartStore((s) => s.dismissFailedMutation);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface border-l border-border z-[60] flex flex-col shadow-2xl pt-safe pb-safe"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2
                id="cart-drawer-heading"
                tabIndex={-1}
                className="text-xl font-bold flex items-center gap-2 outline-none"
              >
                <ShoppingBag className="w-5 h-5 text-accent" /> Your Bag
              </h2>
              <button
                onClick={closeCart}
                className="w-11 h-11 flex items-center justify-center hover:bg-surface-hover rounded-full transition-colors text-text-muted hover:text-foreground"
                aria-label="Close bag drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Offline Sync Banner */}
            <div className="px-6 pt-3">
              <OfflineSyncBanner />
            </div>

            {/* Reconciliation Notices (e.g. stock capped, price shift) */}
            <div className="px-6 pt-2">
              <ReconciliationNoticeBanner
                notices={reconciliationNotices}
                onDismiss={dismissNotice}
              />
            </div>

            {/* Free Shipping Progress Bar */}
            <FreeShippingProgressBar variant="drawer" />

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-text-muted gap-4">
                  <ShoppingBag className="w-12 h-12 opacity-20" />
                  <p className="text-sm">Your bag is empty.</p>
                  <button
                    onClick={closeCart}
                    className="text-foreground hover:text-accent underline underline-offset-4 mt-2 text-sm"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  {cartItems.map((item) => (
                    <OptimisticDrawerItem
                      key={item.cartId}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeFromCart}
                      onRetry={retryFailedMutation}
                      onDismissError={dismissFailedMutation}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="p-6 border-t border-border bg-background">
                <div className="flex justify-between items-center text-sm mb-4">
                  <span className="text-text-muted">Subtotal</span>
                  <OptimisticPriceDisplay
                    amount={subtotal}
                    isOptimistic={isSyncing}
                    size="md"
                  />
                </div>

                {/* Checkout Gate ensures pending predictions are confirmed before payment */}
                <CheckoutGate onSuccessNavigate={closeCart} />

                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="w-full flex justify-center py-3.5 mt-2 bg-transparent text-foreground font-medium rounded-full hover:bg-surface transition-colors duration-200 text-sm"
                >
                  View Full Bag
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
