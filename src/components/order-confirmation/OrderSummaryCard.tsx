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
  const [showAllItemsMobile, setShowAllItemsMobile] = useState(false);

  const formatPrice = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: order.pricing.currency || 'INR',
      maximumFractionDigits: amt % 1 === 0 ? 0 : 2,
    }).format(amt);
  };

  const allItems = order.shipments.flatMap((s) => s.items);
  const totalItemsCount = allItems.reduce((sum, item) => sum + item.quantity, 0);

  // Editable window check (Requirement 6 & 10)
  const isEditable = Boolean(
    order.editableUntil && new Date(order.editableUntil).getTime() > Date.now()
  );
  const editableDeadlineText = formatEditableDeadline(order.editableUntil);

  // For many items edge case (> 3 items), allow collapsing on mobile
  const hasManyItems = allItems.length > 3;

  return (
    <aside
      className={styles.summaryWrapper}
      aria-label="Order summary, payment breakdown, and delivery details"
    >
      {/* Mobile Collapsible Header / Disclosure Button with aria-expanded (Requirement 3 & 9) */}
      <button
        type="button"
        className={styles.mobileDisclosureHeader}
        onClick={() => setMobileExpanded((prev) => !prev)}
        aria-expanded={mobileExpanded}
        aria-controls="order-summary-content"
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

      {/* Desktop Card Title */}
      <div className="hidden md:flex items-center justify-between">
        <h2 className={styles.cardTitle}>Order Summary</h2>
        <span className="text-xs text-text-muted font-mono">
          {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      {mobileExpanded && (
        <div id="order-summary-content" className="flex flex-col gap-4">
          {/* Items List grouped by shipment */}
          <div className={styles.itemsList}>
            {order.shipments.map((shipment) => {
              const displayItems =
                hasManyItems && !showAllItemsMobile
                  ? shipment.items.slice(0, 3)
                  : shipment.items;

              return (
                <div key={shipment.id} className="flex flex-col gap-3">
                  {order.shipments.length > 1 && (
                    <div className="text-xs font-semibold text-text-muted uppercase tracking-wider pt-2 border-t border-border flex items-center justify-between">
                      <span>{shipment.title}</span>
                      <span className="text-[11px] font-normal lowercase">
                        {shipment.items.length} {shipment.items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  )}

                  {displayItems.map((item) => (
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

                        {/* Partial Fulfillment or Refund Status */}
                        {item.fulfillmentStatus === 'cancelled_refunded' && (
                          <div className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 p-1.5 rounded mt-1">
                            {item.unfulfilledReason || 'Out of stock; refunded.'}
                          </div>
                        )}

                        {/* Personalized Inscription Details from stored server truth */}
                        {item.isPersonalized && item.personalization && (
                          <div className={styles.personalizationSpecBox}>
                            <div>
                              <span className={styles.specLabel}>Custom Inscription: </span>
                              <span className={styles.specValue}>
                                "{item.personalization.inscription}"
                              </span>
                            </div>
                            <div className="text-[11px] text-text-muted">
                              <span>Font: {item.personalization.fontName}</span> •{' '}
                              <span>Placement: {item.personalization.placement}</span>
                            </div>
                            <div className="text-[11px] text-accent mt-0.5 font-medium">
                              Studio Machined • Non-returnable
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
              );
            })}

            {/* Many Items Collapse Toggle on Mobile (Requirement 10) */}
            {hasManyItems && (
              <button
                type="button"
                onClick={() => setShowAllItemsMobile((prev) => !prev)}
                className="text-xs text-accent underline self-center py-1 cursor-pointer font-medium"
              >
                {showAllItemsMobile
                  ? 'Show fewer items'
                  : `Show all ${allItems.length} items`}
              </button>
            )}
          </div>

          {/* Pricing Breakdown Table (Semantic Table per Requirement 5 & 9) */}
          <table className={styles.pricingTable} aria-label="Order pricing breakdown">
            <tbody>
              <tr className={styles.pricingRow}>
                <th scope="row" className="font-normal text-left text-text-secondary">
                  Merchandise Subtotal
                </th>
                <td className={styles.pricingValue}>
                  {formatPrice(order.pricing.subtotal)}
                </td>
              </tr>

              {order.pricing.discount > 0 && (
                <tr className={styles.pricingRow}>
                  <th scope="row" className="font-normal text-left text-text-secondary">
                    Discount {order.pricing.couponCode ? `(${order.pricing.couponCode})` : ''}
                  </th>
                  <td className="text-accent font-medium tabular-nums text-right">
                    -{formatPrice(order.pricing.discount)}
                  </td>
                </tr>
              )}

              {order.pricing.personalizationFee > 0 && (
                <tr className={styles.pricingRow}>
                  <th scope="row" className="font-normal text-left text-text-secondary">
                    Studio Laser Engraving Fee
                  </th>
                  <td className={styles.pricingValue}>
                    {formatPrice(order.pricing.personalizationFee)}
                  </td>
                </tr>
              )}

              {order.pricing.giftWrapFee > 0 && (
                <tr className={styles.pricingRow}>
                  <th scope="row" className="font-normal text-left text-text-secondary">
                    Gift Presentation &amp; Packaging
                  </th>
                  <td className={styles.pricingValue}>
                    {formatPrice(order.pricing.giftWrapFee)}
                  </td>
                </tr>
              )}

              <tr className={styles.pricingRow}>
                <th scope="row" className="font-normal text-left text-text-secondary">
                  Delivery &amp; Logistics
                </th>
                <td className={styles.pricingValue}>
                  {order.pricing.isShippingFree || order.pricing.shipping === 0
                    ? 'Free (Complimentary)'
                    : formatPrice(order.pricing.shipping)}
                </td>
              </tr>

              <tr className={styles.pricingRow}>
                <th scope="row" className="font-normal text-left text-text-secondary">
                  GST (Included){' '}
                  {order.pricing.taxGstNumber ? `[${order.pricing.taxGstNumber}]` : ''}
                </th>
                <td className={styles.pricingValue}>
                  {formatPrice(order.pricing.taxGst)}
                </td>
              </tr>

              <tr className={styles.totalRow}>
                <th scope="row" className="font-bold text-left text-foreground">
                  Total Payable
                </th>
                <td className={styles.totalValue}>
                  {formatPrice(order.pricing.total)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Payment Details Section */}
          <div className={styles.infoSection}>
            <div className={styles.infoBlock}>
              <span className={styles.infoTitle}>Payment Method</span>
              <div className={styles.infoContent}>
                <div className="font-medium">{order.payment.methodTitle}</div>
                <div className="text-xs text-text-muted">{order.payment.maskedDetails}</div>
                {order.payment.transactionId && (
                  <div className="text-[11px] text-text-muted font-mono mt-0.5">
                    Ref: {order.payment.transactionId}
                  </div>
                )}
              </div>

              {/* EMI Plan Specifics (Requirement 5) */}
              {order.payment.emiPlan && (
                <div className={styles.emiDetailsBox}>
                  <div className="flex justify-between font-medium text-foreground">
                    <span>Financing Partner:</span>
                    <span>{order.payment.emiPlan.lenderName}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Tenure &amp; Installment:</span>
                    <span className="text-foreground font-semibold">
                      {formatPrice(order.payment.emiPlan.monthlyInstallment)} ×{' '}
                      {order.payment.emiPlan.tenureMonths} months
                    </span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Annual Interest Rate:</span>
                    <span className="text-foreground">
                      {order.payment.emiPlan.isNoCost
                        ? '0% (No-Cost EMI)'
                        : `${order.payment.emiPlan.annualInterestRate}% p.a.`}
                    </span>
                  </div>
                  <div className="flex justify-between text-text-muted pt-1 border-t border-border/50">
                    <span>Total Payable:</span>
                    <span className="text-accent font-semibold">
                      {formatPrice(order.payment.emiPlan.totalPayable)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Destination / Pickup Section */}
            {order.isPickup && order.pickupDetails ? (
              <div className={styles.infoBlock}>
                <span className={styles.infoTitle}>Studio Pickup Location</span>
                <div className={styles.infoContent}>
                  <div className="font-medium">{order.pickupDetails.storeName}</div>
                  <div className="text-xs text-text-secondary">
                    {order.pickupDetails.address}, {order.pickupDetails.city} - {order.pickupDetails.pincode}
                  </div>
                  <div className="text-xs text-accent mt-0.5">
                    {order.pickupDetails.pickupWindow}
                  </div>
                </div>
              </div>
            ) : order.isDigitalOnly ? (
              <div className={styles.infoBlock}>
                <span className={styles.infoTitle}>Digital Recipient</span>
                <div className={styles.infoContent}>
                  <div className="text-xs text-text-secondary">
                    Delivered to: {order.customer.email}
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.infoBlock}>
                <div className="flex items-center justify-between">
                  <span className={styles.infoTitle}>Delivery Destination</span>
                  {/* Edit Address Link visible ONLY while the order is still editable (Requirement 5 & 6) */}
                  {isEditable && onEditAddressClick && (
                    <button
                      type="button"
                      onClick={onEditAddressClick}
                      className="text-xs text-accent underline cursor-pointer hover:opacity-80 transition-opacity"
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
                      You can change your address {editableDeadlineText}.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: Invoice Download & Support (Requirement 5) */}
          <div className={styles.summaryActions}>
            <Link
              href={`/api/orders/${order.id}/invoice?token=${order.guestAccessToken}`}
              target="_blank"
              className={styles.actionButton}
              aria-label={`Download invoice for order ${order.id}`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
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
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Need Help?</span>
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
};
