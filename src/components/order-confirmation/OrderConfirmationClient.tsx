'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { OrderConfirmationRecord } from '@/lib/order-confirmation/types';
import { OrderHeader } from './OrderHeader';
import { OrderTimeline } from './OrderTimeline';
import { OrderSummaryCard } from './OrderSummaryCard';
import { AddToCalendarMenu } from './AddToCalendarMenu';
import { OrderActions } from './OrderActions';
import { OrderCrossSell } from './OrderCrossSell';

interface OrderConfirmationClientProps {
  order: OrderConfirmationRecord;
}

export const OrderConfirmationClient: React.FC<OrderConfirmationClientProps> = ({
  order: initialOrder,
}) => {
  const [order, setOrder] = useState<OrderConfirmationRecord>(initialOrder);
  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false);
  const prefersReduced = useReducedMotion();
  const [hasEntered, setHasEntered] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(initialOrder.updatedAt || new Date().toISOString());

  // Deduplicate analytics purchase event per order ID (Requirement 1)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const analyticsKey = `matte_purchase_tracked_${order.id}`;
    if (!sessionStorage.getItem(analyticsKey)) {
      if ((window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
        (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'purchase', {
          transaction_id: order.id,
          value: order.pricing.total,
          currency: order.pricing.currency || 'INR',
        });
      }
      sessionStorage.setItem(analyticsKey, 'true');
    }

    // Check if entrance animation already played this session
    const enterKey = `matte_order_entered_${order.id}`;
    if (sessionStorage.getItem(enterKey) || prefersReduced) {
      setHasEntered(true);
    } else {
      sessionStorage.setItem(enterKey, 'true');
    }
  }, [order.id, order.pricing.total, order.pricing.currency, prefersReduced]);

  // Live Refresh handler (Requirement 6 & 10)
  const refreshOrderStatus = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/orders/${order.id}?token=${order.guestAccessToken}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.order) {
          setOrder(data.order);
          setLastUpdated(new Date().toISOString());
        }
      }
    } catch (err) {
      console.error('Failed to refresh order status:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [order.id, order.guestAccessToken]);

  // Status Polling and SSE for Pending Payments with backoff (Requirement 1)
  useEffect(() => {
    if (order.status !== 'payment_pending') return;

    let sse: EventSource | null = null;
    let timer: NodeJS.Timeout;
    let delay = 2500;
    let attempts = 0;
    const maxAttempts = 12;

    // 1. Try Server-Sent Events first
    if (typeof window !== 'undefined' && window.EventSource) {
      try {
        sse = new EventSource(`/api/orders/${order.id}/events?token=${order.guestAccessToken}`);
        sse.addEventListener('status', (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data?.status && data.status !== 'payment_pending') {
              refreshOrderStatus();
              sse?.close();
            }
          } catch {
            // ignore JSON parse
          }
        });
        sse.onerror = () => {
          sse?.close();
          sse = null;
        };
      } catch {
        sse = null;
      }
    }

    // 2. Resilient Polling with backoff
    const poll = async () => {
      if (document.visibilityState === 'hidden') {
        timer = setTimeout(poll, delay);
        return;
      }

      attempts++;
      try {
        const res = await fetch(`/api/orders/${order.id}?token=${order.guestAccessToken}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.order) {
            if (data.order.status !== 'payment_pending') {
              setOrder(data.order);
              setLastUpdated(new Date().toISOString());
              return; // Confirmed!
            }
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }

      if (attempts < maxAttempts) {
        delay = Math.min(delay * 1.4, 12000);
        timer = setTimeout(poll, delay);
      }
    };

    timer = setTimeout(poll, delay);

    return () => {
      clearTimeout(timer);
      sse?.close();
    };
  }, [order.id, order.status, order.guestAccessToken, refreshOrderStatus]);

  // Simulate webhook arrival for interactive demo of pending state
  const handleSimulateWebhook = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(
        `/api/orders/${order.id}?simulate=confirm&token=${order.guestAccessToken}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.order) {
          setOrder(data.order);
          setLastUpdated(new Date().toISOString());
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Framer Motion entrance variants: fade and rise 10 to 14px with 80ms stagger under 1.2s total (Requirement 8)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReduced ? 0 : 0.08,
        delayChildren: prefersReduced ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReduced ? 0.01 : 0.35,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const activeShipments = order.shipments || [];

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Suppress compare tray, sticky Add to Bag bar, and stories row on this page (Requirement 3) */}
      <style jsx global>{`
        [data-compare-tray],
        .compare-tray,
        #compare-tray,
        [data-sticky-add-to-bag],
        .sticky-add-to-bag,
        [data-stories-row],
        .stories-row,
        .stories-container {
          display: none !important;
        }

        @media print {
          nav, footer, .no-print, [data-floating-widget], button, .modalBackdrop {
            display: none !important;
          }
          body {
            background-color: #fff !important;
            color: #000 !important;
          }
        }
      `}</style>

      {/* Simulated Webhook Bar when order is in payment pending */}
      {order.status === 'payment_pending' && (
        <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5 text-xs text-foreground">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>
              <strong>Awaiting UPI / Bank Webhook:</strong> This page automatically updates the instant bank confirmation lands.
            </span>
          </div>
          <button
            type="button"
            onClick={handleSimulateWebhook}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-foreground text-background text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            {isRefreshing ? 'Verifying...' : '⚡ Simulate Webhook Landing'}
          </button>
        </div>
      )}

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start"
        variants={containerVariants}
        initial={hasEntered ? 'visible' : 'hidden'}
        animate="visible"
      >
        {/* Left Column (~60% on desktop: Status Header, Timeline, Actions) */}
        <div className="lg:col-span-7 flex flex-col gap-8 md:gap-10 order-1">
          {/* 1. Status Header & Key Facts */}
          <motion.div variants={itemVariants}>
            <OrderHeader
              order={order}
              calendarSlot={
                activeShipments.length > 0 && !order.isPickup && !order.isDigitalOnly ? (
                  <AddToCalendarMenu
                    orderId={order.id}
                    shipments={activeShipments}
                  />
                ) : null
              }
            />
          </motion.div>

          {/* Mobile Primary Actions: placed before timeline on mobile (Requirement 3) */}
          <div className="flex lg:hidden flex-col gap-3">
            <motion.div variants={itemVariants}>
              <div className="flex items-center gap-3">
                <Link
                  href={`/account/orders?id=${order.id}`}
                  className="flex-1 min-h-[44px] py-2.5 px-4 bg-accent text-[#121212] font-semibold text-sm rounded-lg text-center flex items-center justify-center gap-2"
                >
                  <span>Track Order</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <Link
                  href="/products"
                  className="flex-1 min-h-[44px] py-2.5 px-4 bg-surface border border-border text-foreground font-medium text-sm rounded-lg text-center flex items-center justify-center gap-2"
                >
                  <span>Continue Shopping</span>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* 2. "What Happens Next" Timeline */}
          <motion.div variants={itemVariants}>
            <OrderTimeline
              orderId={order.id}
              shipments={activeShipments}
              isPickup={order.isPickup}
              isDigitalOnly={order.isDigitalOnly}
              onRefreshStatus={refreshOrderStatus}
              lastUpdated={lastUpdated}
              isRefreshing={isRefreshing}
            />
          </motion.div>

          {/* 3. Secondary Actions & Deadlines */}
          <motion.div variants={itemVariants}>
            <OrderActions
              order={order}
              isEditAddressOpen={isEditAddressOpen}
              onCloseEditAddress={() => setIsEditAddressOpen(false)}
              onAddressUpdated={() => {
                refreshOrderStatus();
              }}
            />
          </motion.div>
        </div>

        {/* Right Column (~40% on desktop: Sticky Order Summary Card; on mobile: collapsible summary at bottom) */}
        <div className="lg:col-span-5 w-full order-2">
          <motion.div variants={itemVariants}>
            <OrderSummaryCard
              order={order}
              onEditAddressClick={() => setIsEditAddressOpen(true)}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Cross-Sell and Trust Guarantees strictly below the fold */}
      <OrderCrossSell />
    </div>
  );
};
