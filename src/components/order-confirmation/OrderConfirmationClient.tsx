'use client';

import React, { useState, useEffect } from 'react';
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

  // Deduplicate analytics purchase event
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const analyticsKey = `matte_purchase_tracked_${order.id}`;
    if (!sessionStorage.getItem(analyticsKey)) {
      // Fire purchase event once per order
      if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
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

  // Status Polling for Pending Payments (with exponential backoff)
  useEffect(() => {
    if (order.status !== 'payment_pending') return;

    let delay = 2000; // Start at 2s
    let attempts = 0;
    const maxAttempts = 10;
    let timer: NodeJS.Timeout;

    const poll = async () => {
      if (document.visibilityState === 'hidden') {
        // Pause while tab is hidden
        timer = setTimeout(poll, delay);
        return;
      }

      attempts++;
      try {
        const res = await fetch(`/api/orders/${order.id}?token=${order.guestAccessToken}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.order && data.order.status !== 'payment_pending') {
            setOrder(data.order);
            return; // Finished!
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }

      if (attempts < maxAttempts) {
        delay = Math.min(delay * 1.5, 12000); // Exponential backoff up to 12s
        timer = setTimeout(poll, delay);
      }
    };

    timer = setTimeout(poll, delay);
    return () => clearTimeout(timer);
  }, [order.id, order.status, order.guestAccessToken]);

  // Framer Motion entrance variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  const activeShipments = order.shipments || [];

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Hide sticky add to cart, compare trays, and floating widgets on print and confirmation */}
      <style jsx global>{`
        @media print {
          nav, footer, .no-print, [data-floating-widget] {
            display: none !important;
          }
          body {
            background-color: #fff !important;
            color: #000 !important;
          }
        }
      `}</style>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start"
        variants={containerVariants}
        initial={hasEntered ? 'visible' : 'hidden'}
        animate="visible"
      >
        {/* Left Column (~60%): Status Header, Timeline, Actions */}
        <div className="lg:col-span-7 flex flex-col gap-8 md:gap-10">
          <motion.div variants={itemVariants}>
            <OrderHeader
              order={order}
              calendarSlot={
                activeShipments.length > 0 ? (
                  <AddToCalendarMenu
                    orderId={order.id}
                    shipments={activeShipments}
                  />
                ) : null
              }
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <OrderTimeline
              orderId={order.id}
              shipments={activeShipments}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <OrderActions
              order={order}
              isEditAddressOpen={isEditAddressOpen}
              onCloseEditAddress={() => setIsEditAddressOpen(false)}
              onAddressUpdated={() => {
                // Refresh local order state
                fetch(`/api/orders/${order.id}?token=${order.guestAccessToken}`)
                  .then((r) => r.json())
                  .then((d) => d.order && setOrder(d.order))
                  .catch(() => {});
              }}
            />
          </motion.div>
        </div>

        {/* Right Column (~40%): Sticky Order Summary Card */}
        <div className="lg:col-span-5 w-full">
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
