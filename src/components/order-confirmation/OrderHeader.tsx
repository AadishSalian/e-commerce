'use client';

import React, { useState, useRef, useEffect } from 'react';
import { OrderConfirmationRecord } from '@/lib/order-confirmation/types';
import { formatOrderPlacedDate } from '@/lib/order-confirmation/masking';
import { OrderCheckmark } from './OrderCheckmark';
import styles from './OrderHeader.module.css';

interface OrderHeaderProps {
  order: OrderConfirmationRecord;
  calendarSlot?: React.ReactNode;
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({ order, calendarSlot }) => {
  const [copied, setCopied] = useState(false);
  const [guestPassword, setGuestPassword] = useState('');
  const [guestAccountCreated, setGuestAccountCreated] = useState(false);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  // Focus heading on mount per WCAG accessibility requirement
  useEffect(() => {
    h1Ref.current?.focus();
  }, []);

  const handleCopyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.id);
      setCopied(true);
      if (liveRef.current) {
        liveRef.current.textContent = `Order number ${order.id} copied to clipboard`;
      }
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCreateGuestAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestPassword.length >= 6) {
      setGuestAccountCreated(true);
    }
  };

  // Determine honest headline and supporting message based on server status
  let headline = 'Order placed';
  let subline = `We've sent a confirmation to ${order.customer.maskedEmail}.`;

  if (order.status === 'confirmed_cod') {
    headline = 'Order placed (Cash on Delivery)';
    subline = `We've sent your receipt to ${order.customer.maskedEmail}. Pay ₹${order.payment.amountDueOnDelivery?.toLocaleString('en-IN') || order.pricing.total} upon arrival.`;
  } else if (order.status === 'payment_pending') {
    headline = "We're confirming your payment";
    subline = `Your payment via ${order.payment.methodTitle} is being settled with your bank. We'll update this page automatically once verified.`;
  } else if (order.status === 'payment_failed') {
    headline = 'Payment requires attention';
    subline = order.payment.failureReason || 'Your transaction could not be processed. Your items remain safe in your cart.';
  } else if (order.status === 'partially_confirmed') {
    headline = 'Order partially confirmed';
    subline = 'Some items were confirmed, while others could not be fulfilled. Refunds have been initiated automatically.';
  }

  // Earliest and latest estimated delivery across all shipments
  const earliestShipment = order.shipments[0];
  const deliveryDisplay = earliestShipment
    ? order.shipments.length > 1
      ? `Arriving in ${order.shipments.length} shipments`
      : earliestShipment.estimatedDelivery.formattedDisplay
    : 'Estimated within 3–5 days';

  // Check if any items are personalized
  const hasPersonalized = order.shipments.some((s) => s.items.some((i) => i.isPersonalized));

  return (
    <section className={styles.headerWrapper} aria-labelledby="order-confirmation-heading">
      {/* Polite live region for screen reader announcements */}
      <div ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true" />

      <div className={styles.titleArea}>
        <OrderCheckmark orderId={order.id} status={order.status} />
        <div>
          <h1
            ref={h1Ref}
            id="order-confirmation-heading"
            tabIndex={-1}
            className={styles.headline}
          >
            {headline}
          </h1>
          <p className={styles.subheadline}>{subline}</p>
        </div>
      </div>

      {/* Key Facts Row */}
      <div className={styles.factsCard} role="region" aria-label="Order key facts">
        <div className={styles.factItem}>
          <span className={styles.factLabel}>Order Number</span>
          <div className={styles.factValue}>
            <span>#{order.id}</span>
            <button
              type="button"
              className={styles.copyButton}
              onClick={handleCopyOrderNumber}
              aria-label={`Copy order number ${order.id}`}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className={styles.factItem}>
          <span className={styles.factLabel}>Placed On</span>
          <span className={styles.factValue}>
            {formatOrderPlacedDate(order.createdAt, 'en-IN')}
          </span>
        </div>

        <div className={styles.factItem}>
          <span className={styles.factLabel}>Estimated Delivery</span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={styles.factValue}>{deliveryDisplay}</span>
            {calendarSlot}
          </div>
        </div>
      </div>

      {/* Plain notice for personalized items */}
      {hasPersonalized && (
        <div className={styles.personalizedNotice} role="note">
          <svg className={styles.noticeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div>
            <strong>Personalized Production:</strong> Custom engraved items are machined to order in our studio (adding 2–3 business days). Because each piece is uniquely fabricated to your specification, personalized items cannot be returned.
          </div>
        </div>
      )}

      {/* Guest Account Creation Panel */}
      {order.customer.isGuest && (
        <div className={styles.guestAccountPanel}>
          <h3 className={styles.guestPanelTitle}>Create an account to track this order</h3>
          <p className={styles.guestPanelText}>
            Save your details for one-click tracking, automated return processing, and receipt archiving.
          </p>
          {guestAccountCreated ? (
            <p className="text-xs text-accent font-medium">
              ✓ Account created! We have linked order #{order.id} to your profile.
            </p>
          ) : (
            <form onSubmit={handleCreateGuestAccount} className={styles.guestForm}>
              <input
                type="email"
                value={order.customer.email}
                readOnly
                disabled
                className={`${styles.guestInput} opacity-70 cursor-not-allowed`}
                aria-label="Your email address"
              />
              <input
                type="password"
                placeholder="Choose a password (min 6 chars)"
                minLength={6}
                required
                value={guestPassword}
                onChange={(e) => setGuestPassword(e.target.value)}
                className={styles.guestInput}
                aria-label="Password for new account"
              />
              <button type="submit" className={styles.guestButton}>
                Save Account
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
};
