'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { OrderConfirmationRecord } from '@/lib/order-confirmation/types';
import { formatEditableDeadline } from '@/lib/order-confirmation/masking';
import styles from './OrderSummaryCard.module.css';

interface OrderSummaryCardProps {
  order: OrderConfirmationRecord;
  onEditAddressClick?: () => void;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  order,
  onEditAddressClick,
}) => {
  const [mobileExpanded, setMobileExpanded] = useState(true);

  const formatPrice = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: order.pricing.currency || 'INR',
      maximumFractionDigits: amt % 1 === 0 ? 0 : 2,
    }).format(amt);
  };

  const totalItemsCount = order.shipments.reduce(
    (acc, s) => acc + s.items.reduce((sum, item) => sum + item.quantity, 0),
    0
  );

  const isEditable =
    order.editableUntil && new Date(order.editableUntil).getTime() > Date.now();
  const editableDeadlineText = formatEditableDeadline(order.editableUntil);

  return (
    <aside className={styles.summaryWrapper} aria-label="Order summary and invoice details">
      {/* Mobile Collapsible Header */}
      <button
        type="button"
        className={styles.mobileDisclosureHeader}
        onClick={() => setMobileExpanded((prev) => !prev)}
        aria-expanded={mobileExpanded}
      >
        <div className="flex items-center gap-2">
          <span>Order Summary</span>
          <span className="text-xs text-text-muted font-normal">
            ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold tabular-nums">
            {formatPrice(order.pricing.total)}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${mobileExpanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Desktop Heading */}
      <div className="hidden md:flex items-center justify-between">
        <h2 className={styles.cardTitle}>Order Summary</h2>
        <span className="text-xs text-text-muted">
          {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      {mobileExpanded && (
        <>
          {/* Items List grouped by shipment */}
          <div className={styles.itemsList}>
            {order.shipments.map((shipment) => (
              <div key={shipment.id} className="flex flex-col gap-3">
                {order.shipments.length > 1 && (
                  <div className="text-xs font-semibold text-text-muted uppercase tracking-wider pt-2 border-t border-border">
                    {shipment.title}
                  </div>
                )}

                {shipment.items.map((item) => (
                  <div key={item.id} className={styles.itemRow}>
                    <div className={styles.itemImageWrapper}>
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={64}
                        height={64}
                        className={styles.itemImage}
                      />
                    </div>

                    <div className={styles.itemDetails}>
                      <div className={styles.itemName}>{item.name}</div>
                      {item.variant && (
                        <div className={styles.itemVariant}>{item.variant}</div>
                      )}

                      {/* Personalized Inscription Details */}
                      {item.isPersonalized && item.personalization && (
                        <div className={styles.personalizationSpecBox}>
                          <div>
                            <span className={styles.specLabel}>Inscription: </span>
                            <span className={styles.specValue}>
                              "{item.personalization.inscription}"
                            </span>
                          </div>
                          <div>
                            <span className={styles.specLabel}>Typography: </span>
                            <span>{item.personalization.fontName}</span> •{' '}
                            <span>{item.personalization.placement}</span>
                          </div>
                          <div className="text-[11px] text-accent mt-0.5">
                            Custom production item (Non-returnable)
                          </div>
                        </div>
                      )}

                      <div className={styles.itemPriceRow}>
                        <span className={styles.itemQty}>Qty: {item.quantity}</span>
                        <span className={styles.itemPrice}>
                          {formatPrice(item.linePrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Pricing Breakdown Table */}
          <div className={styles.pricingTable} role="table" aria-label="Order pricing breakdown">
            <div className={styles.pricingRow} role="row">
              <span role="rowheader">Merchandise Subtotal</span>
              <span className={styles.pricingValue} role="cell">
                {formatPrice(order.pricing.subtotal)}
              </span>
            </div>

            {order.pricing.discount > 0 && (
              <div className={styles.pricingRow} role="row">
                <span role="rowheader">
                  Discount {order.pricing.couponCode ? `(${order.pricing.couponCode})` : ''}
                </span>
                <span className="text-accent font-medium tabular-nums" role="cell">
                  -{formatPrice(order.pricing.discount)}
                </span>
              </div>
            )}

            {order.pricing.personalizationFee > 0 && (
              <div className={styles.pricingRow} role="row">
                <span role="rowheader">Studio Engraving & Customization</span>
                <span className={styles.pricingValue} role="cell">
                  {formatPrice(order.pricing.personalizationFee)}
                </span>
              </div>
            )}

            <div className={styles.pricingRow} role="row">
              <span role="rowheader">Delivery & Handling</span>
              <span className={styles.pricingValue} role="cell">
                {order.pricing.isShippingFree || order.pricing.shipping === 0
                  ? 'Free (Complimentary)'
                  : formatPrice(order.pricing.shipping)}
              </span>
            </div>

            <div className={styles.pricingRow} role="row">
              <span role="rowheader">
                GST (Included) {order.pricing.taxGstNumber ? `[${order.pricing.taxGstNumber}]` : ''}
              </span>
              <span className={styles.pricingValue} role="cell">
                {formatPrice(order.pricing.taxGst)}
              </span>
            </div>

            <div className={styles.totalRow} role="row">
              <span role="rowheader">Total Amount</span>
              <span className={styles.totalValue} role="cell">
                {formatPrice(order.pricing.total)}
              </span>
            </div>
          </div>

          {/* Payment Details Section */}
          <div className={styles.infoSection}>
            <div className={styles.infoBlock}>
              <span className={styles.infoTitle}>Payment Method</span>
              <div className={styles.infoContent}>
                <div>{order.payment.methodTitle}</div>
                <div className="text-xs text-text-muted">{order.payment.maskedDetails}</div>
                {order.payment.transactionId && (
                  <div className="text-[11px] text-text-muted/80 font-mono">
                    Ref: {order.payment.transactionId}
                  </div>
                )}
              </div>

              {/* EMI Plan Specifics */}
              {order.payment.emiPlan && (
                <div className={styles.emiDetailsBox}>
                  <div className="flex justify-between font-medium text-foreground">
                    <span>Financing:</span>
                    <span>{order.payment.emiPlan.lenderName}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Tenure:</span>
                    <span className="text-foreground">
                      {order.payment.emiPlan.tenureMonths} Months
                    </span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Monthly:</span>
                    <span className="text-foreground font-semibold">
                      {formatPrice(order.payment.emiPlan.monthlyInstallment)} / mo
                    </span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Annual Interest:</span>
                    <span className="text-foreground">
                      {order.payment.emiPlan.isNoCost
                        ? '0% (No-cost)'
                        : `${order.payment.emiPlan.annualInterestRate}%`}
                    </span>
                  </div>
                  <div className="flex justify-between text-text-muted pt-1 border-t border-border/50">
                    <span>Total Agreed Payable:</span>
                    <span className="text-accent font-semibold">
                      {formatPrice(order.payment.emiPlan.totalPayable)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Address Section */}
            <div className={styles.infoBlock}>
              <div className="flex items-center justify-between">
                <span className={styles.infoTitle}>Delivery Destination</span>
                {isEditable && onEditAddressClick && (
                  <button
                    type="button"
                    onClick={onEditAddressClick}
                    className="text-xs text-accent underline cursor-pointer"
                  >
                    Edit address
                  </button>
                )}
              </div>
              <div className={styles.infoContent}>
                <div className="font-medium">
                  {order.customer.firstName} {order.customer.lastName}
                </div>
                <div className="text-xs text-text-secondary">
                  {order.customer.shippingAddress.line1}
                  {order.customer.shippingAddress.line2 ? `, ${order.customer.shippingAddress.line2}` : ''}
                </div>
                <div className="text-xs text-text-secondary">
                  {order.customer.shippingAddress.city}, {order.customer.shippingAddress.state} -{' '}
                  {order.customer.shippingAddress.zip}
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  Phone: {order.customer.maskedPhone}
                </div>

                {isEditable && editableDeadlineText && (
                  <div className="text-[11px] text-text-muted mt-1 italic">
                    You can change your destination {editableDeadlineText}.
                  </div>
                )}
              </div>
            </div>

            {/* Gift Options */}
            {order.giftOptions?.isGift && (
              <div className={styles.infoBlock}>
                <span className={styles.infoTitle}>Gift Packaging</span>
                <div className="text-xs text-text-secondary bg-surface p-2 rounded border border-border">
                  {order.giftOptions.message ? (
                    <div>"{order.giftOptions.message}"</div>
                  ) : (
                    <div>Complimentary gift presentation enabled.</div>
                  )}
                  {order.giftOptions.hidePricesOnSlip && (
                    <div className="text-[11px] text-accent mt-1">
                      Prices hidden on package packing slip.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons under summary */}
          <div className={styles.summaryActions}>
            <Link
              href={`/api/orders/${order.id}/invoice?token=${order.guestAccessToken}`}
              target="_blank"
              className={styles.actionButton}
              aria-label="Download tax invoice PDF"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>Download Invoice</span>
            </Link>

            <Link
              href={`/contact?orderId=${order.id}`}
              className={styles.actionButton}
              aria-label={`Need help with order ${order.id}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Need Help?</span>
            </Link>
          </div>
        </>
      )}
    </aside>
  );
};
