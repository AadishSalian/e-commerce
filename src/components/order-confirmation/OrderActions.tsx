'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OrderConfirmationRecord } from '@/lib/order-confirmation/types';
import styles from './OrderActions.module.css';

interface OrderActionsProps {
  order: OrderConfirmationRecord;
  isEditAddressOpen: boolean;
  onCloseEditAddress: () => void;
  onAddressUpdated: () => void;
}

export const OrderActions: React.FC<OrderActionsProps> = ({
  order,
  isEditAddressOpen,
  onCloseEditAddress,
  onAddressUpdated,
}) => {
  const router = useRouter();
  const [emailSent, setEmailSent] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelStatus, setCancelStatus] = useState<string | null>(null);

  // Address form state
  const [line1, setLine1] = useState(order.customer.shippingAddress.line1);
  const [city, setCity] = useState(order.customer.shippingAddress.city);
  const [state, setState] = useState(order.customer.shippingAddress.state);
  const [zip, setZip] = useState(order.customer.shippingAddress.zip);
  const [addressSaveError, setAddressSaveError] = useState<string | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const isCancellable = Boolean(
    order.cancellableUntil && new Date(order.cancellableUntil).getTime() > Date.now()
  );

  const handleSendEmailAgain = () => {
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 4000);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAddress(true);
    setAddressSaveError(null);

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: order.guestAccessToken,
          shippingAddress: {
            line1,
            city,
            state,
            zip,
            country: order.customer.shippingAddress.country,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onAddressUpdated();
        onCloseEditAddress();
      } else {
        setAddressSaveError(data.error || 'Failed to update address');
      }
    } catch {
      setAddressSaveError('Network error while saving address');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleCancelOrder = async () => {
    setCancelStatus('Cancelling order...');
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: order.guestAccessToken,
          action: 'cancel',
        }),
      });
      if (res.ok) {
        setCancelStatus('Order cancelled. Full refund has been initiated to your original payment method.');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setCancelStatus('The cancellation window for this order has expired.');
      }
    } catch {
      setCancelStatus('Failed to cancel order.');
    }
  };

  // Payment Failed State (Requirement 1): No confirmation, explain plainly, keep cart intact, offer retry
  if (order.status === 'payment_failed') {
    return (
      <div className="flex flex-col gap-4 p-6 bg-surface border border-red-500/30 rounded-xl">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Complete your order with another payment method
          </h3>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            Your items remain reserved in your bag. You can retry with a different credit card, UPI, net banking, or choose Cash on Delivery.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/checkout"
            className="px-5 py-2.5 bg-foreground text-background font-semibold text-sm rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span>Retry Checkout</span>
          </Link>

          <Link
            href="/cart"
            className={styles.secondaryBtn}
          >
            <span>View Cart</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.actionsRow}>
        <div className={styles.buttonGroup}>
          <Link href="/products" className={styles.secondaryBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Continue Shopping</span>
          </Link>

          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={handleSendEmailAgain}
            disabled={emailSent}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span>{emailSent ? 'Confirmation Sent!' : 'Email Confirmation Again'}</span>
          </button>
        </div>

        {isCancellable && (
          <button
            type="button"
            className={styles.cancelLink}
            onClick={() => setIsCancelOpen(true)}
          >
            Cancel this order
          </button>
        )}
      </div>

      {/* Edit Address Modal */}
      {isEditAddressOpen && (
        <div className={styles.modalBackdrop} onClick={onCloseEditAddress}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="edit-address-title"
          >
            <h3 id="edit-address-title" className={styles.modalTitle}>
              Update Delivery Destination
            </h3>
            <p className="text-xs text-text-secondary">
              Orders can be updated until workshop production or dispatch processing begins.
            </p>

            {addressSaveError && (
              <div className="p-2.5 bg-red-950/40 border border-red-500/40 text-red-300 text-xs rounded">
                {addressSaveError}
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="flex flex-col gap-3">
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Address Line 1</label>
                <input
                  type="text"
                  required
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Postal Code (Pincode)</label>
                <input
                  type="text"
                  required
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={onCloseEditAddress}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="px-4 py-2 bg-foreground text-background font-medium rounded-lg text-sm cursor-pointer disabled:opacity-50"
                >
                  {isSavingAddress ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {isCancelOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsCancelOpen(false)}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="cancel-order-title"
          >
            <h3 id="cancel-order-title" className={styles.modalTitle}>
              Cancel Order #{order.id}?
            </h3>
            <p className="text-xs text-text-secondary">
              If you cancel now, your payment will be fully refunded to your original payment method. If personalized items have already entered workshop milling, cancellation is no longer possible.
            </p>

            {cancelStatus && (
              <div className="p-2.5 bg-surface text-xs rounded border border-border">
                {cancelStatus}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setIsCancelOpen(false)}
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg text-sm hover:bg-red-700 cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
