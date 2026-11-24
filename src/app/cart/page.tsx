'use client';

import { MOCK_PRODUCTS, Product } from '@/lib/mockData';
import Link from 'next/link';
import { Minus, Plus, X, ShoppingBag, Sparkles, CreditCard, ChevronRight, Clock, AlertTriangle, Edit3, Bookmark, ArrowUpRight, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from '@/components/ui';
import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCartStore, getItemUnitPrice, CartItem } from '@/store/useCartStore';
import { FreeShippingProgressBar } from '@/components/cart/FreeShippingProgressBar';
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE, formatCurrency } from '@/config/shipping';
import { EMICalculatorModal } from '@/components/emi';
import { formatEmiCurrency } from '@/lib/emi/calculator';
import { SelectedEmiPlan } from '@/lib/emi/types';
import { PriceHistoryTagBadge } from '@/components/product/price-history';
import { EditPersonalizationModal } from '@/components/cart/EditPersonalizationModal';
import {
  OfflineSyncBanner,
  ReconciliationNoticeBanner,
  CheckoutGate,
  OptimisticPriceDisplay,
} from '@/components/optimistic';
import { useOptimisticCartStore } from '@/store/useOptimisticCartStore';
import { useLocale } from '@/contexts/LocaleContext';

export default function CartPage() {
  const { isLoggedIn } = useAuth();
  const { t, formatPrice, emiSupported, currencyConfig } = useLocale();
  const {
    cartItems,
    savedForLater,
    removeFromCart,
    saveForLater,
    moveToBag,
    updateQuantity,
    retryFailedMutation,
    dismissFailedMutation,
    cartEmiPlan,
    setCartEmiPlan,
    emiNotification,
    setEmiNotification,
  } = useCartStore();

  const [isEmiModalOpen, setIsEmiModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const reconciliationNotices = useOptimisticCartStore((s) => s.reconciliationNotices);
  const dismissNotice = useOptimisticCartStore((s) => s.dismissNotice);
  const isSyncing = useOptimisticCartStore((s) => s.isSyncing);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + getItemUnitPrice(item) * item.quantity,
    0
  );
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = subtotal > 0 ? (isFreeShipping ? 0 : STANDARD_SHIPPING_FEE) : 0;
  const total = subtotal + shipping;

  // Max additional workshop lead time among personalized items
  const maxPersonalizationLeadTime = useMemo(() => {
    return cartItems.reduce((max, item) => {
      const days = item.personalization?.lead_time_days || 0;
      return days > max ? days : max;
    }, 0);
  }, [cartItems]);

  // Active EMI plan: prioritize cart-level plan, or fallback to first item's selected plan
  const activeEmiPlan: SelectedEmiPlan | null = useMemo(() => {
    if (cartEmiPlan) return cartEmiPlan;
    const itemWithPlan = cartItems.find((i) => i.selectedEmiPlan);
    return itemWithPlan ? itemWithPlan.selectedEmiPlan! : null;
  }, [cartEmiPlan, cartItems]);

  // Synthetic product for whole-bag EMI calculator
  const bagProduct: Product = useMemo(
    () => ({
      id: 'bag-checkout',
      name: 'Entire Bag Order',
      description: t('common.items', { count: cartItems.length }),
      price: total,
      category: cartItems.some((i) => i.category === 'Home & Furniture')
        ? 'Home & Furniture'
        : 'Tech',
      isNew: false,
      image: cartItems[0]?.image || '',
    }),
    [total, cartItems]
  );

  return (
    <div className="min-h-screen bg-background pt-8 md:pt-4 pb-32">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-8">
          {t('cart.title')}
        </h1>

        <div className="flex flex-col gap-6">
          {/* Offline Sync Banner */}
          <OfflineSyncBanner />

          {/* Reconciliation Notice Banner */}
          <ReconciliationNoticeBanner
            notices={reconciliationNotices}
            onDismiss={dismissNotice}
          />
          {/* EMI Update Notification */}
          <AnimatePresence>
            {emiNotification && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3.5 bg-surface border border-accent/40 rounded-xl flex items-center justify-between text-xs text-foreground shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-accent shrink-0" />
                  <span className="font-medium">{emiNotification}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEmiNotification(null)}
                  className="p-1 rounded-full hover:bg-surface-hover text-text-muted hover:text-foreground transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Workshop Dispatch Lead Time Notice (if bag contains personalized items) */}
          {maxPersonalizationLeadTime > 0 && (
            <div className="p-3.5 bg-surface border border-border rounded-xl flex items-center gap-2.5 text-xs text-text-muted">
              <Clock className="w-4 h-4 text-accent shrink-0" />
              <span>
                Your order contains custom personalized items. Estimated workshop preparation time adds{' '}
                <strong className="text-foreground">+{maxPersonalizationLeadTime} business days</strong> to standard dispatch.
              </span>
            </div>
          )}

          {/* Free Shipping Progress Bar */}
          <div className="rounded-xl border border-border overflow-hidden bg-surface/20">
            <FreeShippingProgressBar variant="full" />
          </div>

          {/* Cart Items List */}
          <div className="flex flex-col border-t border-border">
            <AnimatePresence>
              {cartItems.map((item) => {
                const unitPrice = getItemUnitPrice(item);
                const lineTotal = unitPrice * item.quantity;

                return (
                  <motion.div
                    key={item.cartId}
                    layout
                    initial={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.3 }}
                    className="flex py-8 border-b border-border gap-6 relative"
                  >
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-surface rounded-lg flex-shrink-0 flex items-center justify-center border border-border overflow-hidden relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {item.personalization && (
                        <span className="absolute bottom-1 right-1 bg-accent text-black text-[9px] font-mono px-1 rounded font-bold shadow-sm">
                          CUSTOM
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col flex-grow justify-between">
                      <div className="flex justify-between items-start pr-8">
                        <div>
                          <Link
                            href={`/products/${item.id}`}
                            className="text-lg font-medium text-foreground hover:text-accent transition-colors"
                          >
                            {item.name}
                          </Link>
                          {item.selectedVariant && (
                            <p className="text-sm text-text-muted mt-0.5">
                              {item.selectedVariant}
                            </p>
                          )}

                          {/* Personalization Line Info & In-Cart Edit Link */}
                          {item.personalization && (
                            <div className="mt-2.5 p-2.5 rounded-xl bg-surface border border-accent/30 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                                  Personalized: &ldquo;{item.personalization.lines.filter(Boolean).join(' ')}&rdquo;
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setEditingItem(item)}
                                  className="text-accent hover:underline font-medium text-[11px] ml-2 flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" /> Edit
                                </button>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-text-muted">
                                <span>Style: {item.personalization.font_label}</span>
                                <span>•</span>
                                <span>+{formatPrice(item.personalization.price_addon / 100).formatted} / unit</span>
                                <span>•</span>
                                <span className="text-amber-400 font-medium">Non-returnable</span>
                                <span>•</span>
                                <span>Est. +{item.personalization.lead_time_days}d</span>
                              </div>
                            </div>
                          )}

                          {/* Selected EMI plan on the cart line */}
                          {emiSupported && item.selectedEmiPlan && (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-accent/30 text-xs">
                              <CreditCard className="w-3 h-3 text-accent" />
                              <span className="text-text-muted">EMI:</span>
                              <strong className="text-foreground tabular-nums">
                                {item.selectedEmiPlan.planType === 'pay_later'
                                  ? `Pay Later (${item.selectedEmiPlan.payLaterDays} days)`
                                  : `${formatEmiCurrency(
                                      item.selectedEmiPlan.monthlyInstallment
                                    )}/mo × ${item.selectedEmiPlan.tenureMonths} mo`}
                              </strong>
                              <span className="text-[11px] text-text-muted">
                                ({item.selectedEmiPlan.lenderName})
                              </span>
                            </div>
                          )}

                          {/* Price history drop badge */}
                          <div className="mt-2">
                            <PriceHistoryTagBadge
                              productId={item.id}
                              variantId={item.selectedVariant}
                              currentPrice={item.price}
                              addedPrice={item.addedPrice}
                              mode="cart"
                            />
                          </div>
                        </div>
                        <p className="text-foreground font-medium tabular-nums">
                          {formatPrice(lineTotal).formatted}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-4">
                        {/* Quantity Editor */}
                        <div className="flex items-center gap-4 bg-surface rounded-full px-3 py-1 border border-border">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartId, -1)}
                            className="text-text-muted hover:text-foreground transition-colors p-1"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-medium w-4 text-center tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartId, 1)}
                            className="text-text-muted hover:text-foreground transition-colors p-1"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Save for later button */}
                        <button
                          type="button"
                          onClick={() => saveForLater(item.cartId)}
                          className="min-h-[36px] px-3 py-1.5 rounded-full text-xs font-medium text-text-muted hover:text-foreground hover:bg-surface border border-transparent hover:border-border transition-colors flex items-center gap-1.5"
                          aria-label={`Save ${item.name} for later`}
                        >
                          <Bookmark className="w-3.5 h-3.5" /> Save for later
                        </button>
                      </div>

                      {/* In-place line error row (Section 6) */}
                      {item.inlineError && (
                        <div className="mt-3 px-3 py-2 bg-red-950/30 border border-red-900/40 rounded-lg flex items-center justify-between text-xs text-foreground">
                          <div className="flex items-center gap-1.5 text-red-400">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.inlineError.message}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => retryFailedMutation(item.cartId)}
                              className="px-2 py-1 rounded bg-surface hover:bg-surface-hover border border-border text-foreground font-semibold flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Retry
                            </button>
                            <button
                              type="button"
                              onClick={() => dismissFailedMutation(item.cartId)}
                              className="p-1 text-text-muted hover:text-foreground"
                              aria-label="Dismiss error"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cartId)}
                      className="absolute top-8 right-0 text-text-muted hover:text-foreground transition-colors p-2"
                      aria-label={`Remove ${item.name} from bag`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Saved for Later Section (Section 1) */}
            {savedForLater && savedForLater.length > 0 && (
              <div className="mt-10 pt-8 border-t border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Bookmark className="w-5 h-5 text-accent" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Saved for Later ({savedForLater.length})
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {savedForLater.map((saved) => (
                    <div
                      key={saved.cartId}
                      className="p-4 rounded-xl border border-border bg-surface/40 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-surface-hover shrink-0 relative border border-border/80">
                          <img
                            src={saved.image}
                            alt={saved.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="truncate">
                          <p className="font-medium text-foreground text-sm truncate">{saved.name}</p>
                          <p className="text-xs text-text-muted mt-0.5 tabular-nums">
                            {formatPrice(saved.price).formatted}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => moveToBag(saved.cartId)}
                        className="min-h-[40px] px-4 py-2 rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium text-xs flex items-center gap-1.5 shrink-0 transition-transform active:scale-95"
                      >
                        Move to Bag <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cartItems.length === 0 && (!savedForLater || savedForLater.length === 0) && (
              <div className="py-16 text-center">
                <EmptyState
                  icon={<ShoppingBag className="w-8 h-8" />}
                  title="Your bag is empty."
                  description="Explore our collection of meticulously engineered products and bespoke personalizations."
                  actionText="Discover Products"
                  actionHref="/products"
                />
              </div>
            )}
          </div>

          {/* Cart Summary & Checkout Actions */}
          {cartItems.length > 0 && (
            <div className="mt-8 flex flex-col gap-6">
              <div className="p-6 bg-surface border border-border rounded-xl flex flex-col gap-3">
                <div className="flex justify-between text-sm text-text-muted">
                  <span>{t('cart.subtotal')}</span>
                  <OptimisticPriceDisplay amount={subtotal} isOptimistic={isSyncing} size="sm" />
                </div>
                <div className="flex justify-between text-sm text-text-muted">
                  <span>{t('cart.shipping')}</span>
                  <span className="text-foreground font-medium tabular-nums">
                    {shipping === 0 ? t('cart.freeShipping') : formatPrice(shipping).formatted}
                  </span>
                </div>
                <div className="w-full h-px bg-border my-1" />
                <div className="flex justify-between text-lg font-bold text-foreground">
                  <span>{t('cart.total')}</span>
                  <OptimisticPriceDisplay amount={total} isOptimistic={isSyncing} size="lg" />
                </div>
                {formatPrice(total).isEstimate && (
                  <p className="text-[11px] text-text-muted text-end mt-1">
                    {t('pricing.approximateEstimate', { currency: currencyConfig.code })} · {t('pricing.checkoutSettlement', { currency: 'INR' })}
                  </p>
                )}
              </div>

              <CheckoutGate className="shadow-lg py-4 text-base font-semibold">
                {t('cart.checkoutButton')}
              </CheckoutGate>
            </div>
          )}
        </div>
      </div>

      {/* In-Cart Personalization Editor Modal */}
      <EditPersonalizationModal
        item={editingItem}
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
      />

      {/* Whole-bag EMI Calculator Modal */}
      <EMICalculatorModal
        isOpen={isEmiModalOpen}
        onClose={() => setIsEmiModalOpen(false)}
        product={bagProduct}
        livePrice={total}
        onSelectPlan={(plan) => setCartEmiPlan(plan)}
      />
    </div>
  );
}
