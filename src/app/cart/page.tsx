'use client';

import { MOCK_PRODUCTS, Product } from '@/lib/mockData';
import Link from 'next/link';
import { Minus, Plus, X, ShoppingBag, Sparkles, CreditCard, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from '@/components/ui';
import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCartStore } from '@/store/useCartStore';
import { FreeShippingProgressBar } from '@/components/cart/FreeShippingProgressBar';
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE, formatCurrency } from '@/config/shipping';
import { EMICalculatorModal } from '@/components/emi';
import { formatEmiCurrency } from '@/lib/emi/calculator';
import { SelectedEmiPlan } from '@/lib/emi/types';
import { PriceHistoryTagBadge } from '@/components/product/price-history';

export default function CartPage() {
  const { isLoggedIn } = useAuth();
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    cartEmiPlan,
    setCartEmiPlan,
    emiNotification,
    setEmiNotification,
  } = useCartStore();

  const [isEmiModalOpen, setIsEmiModalOpen] = useState(false);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = subtotal > 0 ? (isFreeShipping ? 0 : STANDARD_SHIPPING_FEE) : 0;
  const total = subtotal + shipping;

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
      description: `${cartItems.length} item${cartItems.length === 1 ? '' : 's'} in bag`,
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
          Your Bag.
        </h1>

        <div className="flex flex-col gap-6">
          {/* EMI Update Notification (Requirement 6) */}
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

          {/* Free Shipping Progress Bar */}
          <div className="rounded-xl border border-border overflow-hidden bg-surface/20">
            <FreeShippingProgressBar variant="full" />
          </div>

          {/* Cart Items List */}
          <div className="flex flex-col border-t border-border">
            <AnimatePresence>
              {cartItems.map((item) => (
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

                        {/* Selected EMI plan on the cart line (Requirement 6) */}
                        {item.selectedEmiPlan && (
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
                        {/* Price history drop badge if price has fallen since added */}
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
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 mt-4">
                      {/* Quantity Editor */}
                      <div className="flex items-center gap-4 bg-surface rounded-full px-3 py-1 border border-border">
                        <button
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
                          onClick={() => updateQuantity(item.cartId, 1)}
                          className="text-text-muted hover:text-foreground transition-colors p-1"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.cartId)}
                    className="absolute top-8 right-0 text-text-muted hover:text-foreground transition-colors p-2"
                    aria-label={`Remove ${item.name} from bag`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {cartItems.length === 0 && (
              <div className="py-12 border-b border-border">
                <EmptyState
                  icon={<ShoppingBag className="w-12 h-12" />}
                  title="Your bag is empty."
                  description="Your setup is waiting for its next addition. Discover our premium hardware."
                  actionText="Explore Products"
                  actionHref="/products"
                />
              </div>
            )}
          </div>

          {/* Order Summary */}
          {cartItems.length > 0 && (
            <div className="w-full pt-8 flex flex-col items-end">
              <div className="w-full md:w-1/2 flex flex-col gap-3 mb-6 p-6 rounded-2xl bg-surface border border-border">
                <div className="flex justify-between text-text-muted text-sm">
                  <span>Subtotal</span>
                  <span className="tabular-nums">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-text-muted text-sm">
                  <span>Shipping</span>
                  <span
                    className={
                      isFreeShipping
                        ? 'text-accent font-medium'
                        : 'text-foreground font-medium'
                    }
                  >
                    {isFreeShipping ? 'Free' : formatCurrency(shipping)}
                  </span>
                </div>

                <div className="flex justify-between text-foreground text-xl font-bold pt-3 border-t border-border">
                  <span>Total</span>
                  <span className="tabular-nums">${total.toFixed(2)}</span>
                </div>

                {/* Requirement 6: Order summary shows "Pay ₹X/month for N months" beneath the total */}
                {activeEmiPlan ? (
                  <div className="pt-2 border-t border-border/50 text-right space-y-0.5">
                    <p className="text-sm font-semibold text-accent tabular-nums">
                      Pay {formatEmiCurrency(activeEmiPlan.monthlyInstallment)}/month for{' '}
                      {activeEmiPlan.tenureMonths} months
                    </p>
                    <p className="text-[11px] text-text-muted">
                      via {activeEmiPlan.lenderName}{' '}
                      {activeEmiPlan.isNoCost
                        ? '• No-cost EMI'
                        : `• ${activeEmiPlan.annualInterestRate}% p.a.`}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsEmiModalOpen(true)}
                      className="text-[11px] text-accent hover:underline pt-1 inline-block"
                    >
                      Change or remove EMI plan
                    </button>
                  </div>
                ) : (
                  total >= 1000 && (
                    <div className="pt-2 border-t border-border/50 flex justify-between items-center text-xs">
                      <span className="text-text-muted">Flexible payments:</span>
                      <button
                        type="button"
                        onClick={() => setIsEmiModalOpen(true)}
                        className="text-accent hover:underline font-medium inline-flex items-center gap-0.5"
                      >
                        <span>Choose EMI plan</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )
                )}
              </div>

              <Link
                href={isLoggedIn ? '/checkout' : '/login'}
                className="w-full md:w-1/2 py-4 bg-foreground text-background font-medium rounded-full hover:scale-[0.98] transition-transform duration-200 text-center shadow-lg"
              >
                Proceed to Checkout
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Cart Whole-Bag EMI Calculator Modal */}
      {cartItems.length > 0 && (
        <EMICalculatorModal
          isOpen={isEmiModalOpen}
          onClose={() => setIsEmiModalOpen(false)}
          product={bagProduct}
          livePrice={total}
          onSelectPlan={(plan) => setCartEmiPlan(plan)}
        />
      )}
    </div>
  );
}
