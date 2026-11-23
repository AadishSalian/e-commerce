'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { X, ShoppingBag, Bookmark, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { FreeShippingProgressBar } from '@/components/cart/FreeShippingProgressBar';
import { useLocale } from '@/contexts/LocaleContext';
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
  const { t, formatPrice, currency } = useLocale();
  const prevCurrencyRef = React.useRef(currency);
  const [currencyNotice, setCurrencyNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (prevCurrencyRef.current !== currency) {
      setCurrencyNotice(t('cart.currencyUpdatedNotice', { currency }));
      prevCurrencyRef.current = currency;
      const tId = setTimeout(() => setCurrencyNotice(null), 4000);
      return () => clearTimeout(tId);
    }
  }, [currency, t]);

  const subtotal = useOptimisticCartStore((s) => s.subtotal);
  const isSyncing = useOptimisticCartStore((s) => s.isSyncing);
  const savedForLater = useOptimisticCartStore((s) => s.savedForLater);
  const saveForLater = useOptimisticCartStore((s) => s.saveForLater);
  const moveToBag = useOptimisticCartStore((s) => s.moveToBag);
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
                <ShoppingBag className="w-5 h-5 text-accent" /> {t('cart.title')}
              </h2>
              <button
                onClick={closeCart}
                className="w-11 h-11 flex items-center justify-center hover:bg-surface-hover rounded-full transition-colors text-text-muted hover:text-foreground"
                aria-label="Close bag drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Currency Change Real-time Notice (Section 4) */}
            {currencyNotice && (
              <div className="mx-6 mt-3 p-2.5 rounded-lg bg-accent/15 border border-accent/30 text-accent text-xs font-medium flex items-center justify-between">
                <span>{currencyNotice}</span>
                <button
                  type="button"
                  onClick={() => setCurrencyNotice(null)}
                  className="text-accent hover:opacity-80 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

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
                  <p className="text-sm">{t('cart.emptyTitle')}</p>
                  <p className="text-xs max-w-xs">{t('cart.emptySubtitle')}</p>
                  <button
                    onClick={closeCart}
                    className="text-foreground hover:text-accent underline underline-offset-4 mt-2 text-sm"
                  >
                    {t('nav.shop')}
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
                      onSaveForLater={saveForLater}
                      onRetry={retryFailedMutation}
                      onDismissError={dismissFailedMutation}
                    />
                  ))}
                </AnimatePresence>
              )}

              {/* Saved For Later Section (Section 1) */}
              {savedForLater && savedForLater.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border/80">
                  <div className="flex items-center gap-2 mb-3">
                    <Bookmark className="w-4 h-4 text-accent" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Saved for Later ({savedForLater.length})
                    </h3>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {savedForLater.map((savedItem) => (
                      <div
                        key={savedItem.cartId}
                        className="p-3 rounded-xl border border-border/60 bg-surface/50 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-hover shrink-0 relative">
                            <Image
                              src={savedItem.image}
                              alt={savedItem.name}
                              width={80}
                              height={80}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="truncate">
                            <p className="font-medium text-foreground truncate">{savedItem.name}</p>
                            <p className="text-text-muted tabular-nums">{formatPrice(savedItem.price).formatted}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => moveToBag(savedItem.cartId)}
                          className="min-h-[36px] px-3 py-1.5 rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium text-xs flex items-center gap-1 shrink-0 transition-transform active:scale-95"
                          aria-label={`Move ${savedItem.name} to bag`}
                        >
                          {t('cart.moveToBag')} <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="p-6 border-t border-border bg-background">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-text-muted">{t('cart.subtotal')}</span>
                  <OptimisticPriceDisplay
                    amount={subtotal}
                    isOptimistic={isSyncing}
                    size="md"
                  />
                </div>
                <p className="text-[11px] text-text-muted mb-4">{t('cart.taxesNote')}</p>

                {/* Checkout Gate ensures pending predictions are confirmed before payment */}
                <CheckoutGate onSuccessNavigate={closeCart} />

                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="w-full flex justify-center py-3.5 mt-2 bg-transparent text-foreground font-medium rounded-full hover:bg-surface transition-colors duration-200 text-sm"
                >
                  {t('cart.title')}
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
