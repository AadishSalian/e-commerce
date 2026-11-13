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

  // Move focus to <h1> on load per WCAG Accessibility requirement 9
  useEffect(() => {
    h1Ref.current?.focus();
    if (liveRef.current) {
      if (order.status === 'confirmed') {
        liveRef.current.textContent = `Order placed. Order number ${order.id}. Confirmation sent to ${order.customer.maskedEmail}.`;
      } else if (order.status === 'confirmed_cod') {
        liveRef.current.textContent = `Order placed under Cash on Delivery. Order number ${order.id}. Pay on delivery.`;
      } else if (order.status === 'payment_pending') {
        liveRef.current.textContent = `We are confirming your payment for order ${order.id}.`;
      } else if (order.status === 'payment_failed') {
        liveRef.current.textContent = `Payment requires attention for order ${order.id}. Cart remains intact.`;
      } else if (order.status === 'partially_confirmed') {
        liveRef.current.textContent = `Order partially confirmed for order ${order.id}.`;
      }
    }
  }, [order.id, order.status, order.customer.maskedEmail]);

  const handleCopyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.id);
      setCopied(true);
      if (liveRef.current) {
        liveRef.current.textContent = `Order number ${order.id} copied to clipboard`;
      }
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateGuestAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestPassword.length >= 6) {
      setGuestAccountCreated(true);
    }
  };

  // Determine truthful headline and supporting line based on server's status (Requirement 1 & 4)
  let headline = 'Order placed';
  let subline = `Confirmation sent to ${order.customer.maskedEmail}`;

  if (order.status === 'confirmed_cod') {
    headline = 'Order placed';
    const dueAmount = order.payment.amountDueOnDelivery ?? order.pricing.total;
    subline = `Confirmation sent to ${order.customer.maskedEmail}. Pay ₹${dueAmount.toLocaleString('en-IN')} on delivery`;
  } else if (order.status === 'payment_pending') {
    headline = "We're confirming your payment";
    subline = `Your payment via ${order.payment.methodTitle} is being settled with your bank. We'll update this page automatically once verified`;
  } else if (order.status === 'payment_failed') {
    headline = 'Payment requires attention';
    subline = order.payment.failureReason || 'Your transaction could not be completed. Your cart remains intact';
  } else if (order.status === 'partially_confirmed') {
    headline = 'Order partially confirmed';
    subline = order.orderAdjustment?.reason || `1 item in your order was out of stock and has been refunded. Remaining items are confirmed`;
  }

  // Delivery / Fulfillment fact display
  let deliveryDisplay = 'Estimated within 3–5 business days';
  if (order.isPickup) {
    deliveryDisplay = order.pickupDetails?.pickupWindow || 'Ready for studio pickup';
  } else if (order.isDigitalOnly) {
    deliveryDisplay = 'Delivered immediately to email';
  } else if (order.deliveryDateUnknown) {
    deliveryDisplay = "We'll confirm your delivery date by email";
  } else if (order.shipments.length > 1) {
    deliveryDisplay = `Arriving in ${order.shipments.length} split shipments`;
  } else if (order.shipments[0]?.estimatedDelivery?.formattedDisplay) {
    deliveryDisplay = order.shipments[0].estimatedDelivery.formattedDisplay;
  }

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

      {/* Prominent Order Adjustment Notification if items changed after payment */}
      {order.orderAdjustment && (
        <div className={styles.adjustmentBanner} role="alert">
          <div className="flex items-start gap-2.5">
            <svg
              className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="flex flex-col gap-1 text-xs">
              <strong className="font-semibold text-foreground text-sm">
                Order Modification &amp; Refund Notice
              </strong>
              <p className="text-text-secondary leading-relaxed">
                {order.orderAdjustment.reason}
              </p>
              <div className="pt-1 flex flex-wrap gap-x-4 gap-y-1 font-medium text-foreground">
                <span>Original charge: ₹{order.orderAdjustment.originalTotal.toLocaleString('en-IN')}</span>
                <span className="text-accent">
                  Refund issued: ₹{order.orderAdjustment.refundAmount.toLocaleString('en-IN')} ({order.orderAdjustment.refundMethod})
                </span>
                <span>Adjusted total: ₹{order.orderAdjustment.newTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
          <span className={styles.factLabel}>
            {order.isPickup ? 'Pickup Window' : 'Estimated Delivery'}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={styles.factValue}>{deliveryDisplay}</span>
            {!order.isPickup && !order.isDigitalOnly && !order.deliveryDateUnknown && calendarSlot}
          </div>
        </div>
      </div>

      {/* Honest notice for personalized lead time */}
      {hasPersonalized && (
        <div className={styles.personalizedNotice} role="note">
          <svg
            className={styles.noticeIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div>
            <strong>Personalized Production:</strong> Custom engraved items are individually machined to your specification in our studio (adding 2–3 business days). Because each piece is uniquely fabricated to your approved preview, custom items cannot be returned.
          </div>
        </div>
      )}

      {/* Pickup Details Card if Store Pickup order */}
      {order.isPickup && order.pickupDetails && (
        <div className={styles.pickupCard} role="region" aria-label="Store pickup instructions">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0 text-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-sm text-foreground">
                {order.pickupDetails.storeName}
              </span>
              <span className="text-text-secondary">
                {order.pickupDetails.address}, {order.pickupDetails.city} - {order.pickupDetails.pincode}
              </span>
              <span className="text-text-muted mt-0.5">
                Hours: {order.pickupDetails.hours}
              </span>
              <p className="text-text-secondary mt-1 bg-surface-active p-2 rounded border border-border">
                {order.pickupDetails.instructions}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Digital Delivery Card if Digital-only order */}
      {order.isDigitalOnly && order.digitalFulfillmentNotice && (
        <div className={styles.digitalCard} role="note">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0 text-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-sm text-foreground">
                Instant Digital Delivery
              </span>
              <span className="text-text-secondary leading-relaxed">
                {order.digitalFulfillmentNotice}
              </span>
            </div>
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
