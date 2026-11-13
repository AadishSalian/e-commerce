'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ShipmentGroup } from '@/lib/order-confirmation/types';
import { formatOrderPlacedDate } from '@/lib/order-confirmation/masking';
import styles from './OrderTimeline.module.css';

interface OrderTimelineProps {
  orderId: string;
  shipments: ShipmentGroup[];
  isPickup?: boolean;
  isDigitalOnly?: boolean;
  onRefreshStatus?: () => void;
  lastUpdated?: string;
  isRefreshing?: boolean;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({
  orderId,
  shipments,
  isPickup = false,
  isDigitalOnly = false,
  onRefreshStatus,
  lastUpdated,
  isRefreshing = false,
}) => {
  const prefersReduced = useReducedMotion();
  const [localLastUpdated, setLocalLastUpdated] = useState<string>(
    lastUpdated || new Date().toISOString()
  );

  // Digital items do not have physical logistics delivery timeline
  if (isDigitalOnly) {
    return (
      <section className={styles.timelineContainer} aria-labelledby="timeline-heading">
        <h2 id="timeline-heading" className="text-xl font-bold tracking-tight text-foreground">
          What happens next
        </h2>
        <div className={styles.shipmentBlock}>
          <div className="flex items-center gap-3 text-sm text-foreground">
            <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <strong className="block font-semibold">Digital Delivery Complete</strong>
              <span className="text-xs text-text-secondary">
                Your activation key and documentation have been emailed. No shipping or transit required.
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-border flex items-center gap-3">
            <Link href="/products" className={styles.trackOrderButton}>
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Pickup orders do not have carrier dispatch line
  if (isPickup) {
    return (
      <section className={styles.timelineContainer} aria-labelledby="timeline-heading">
        <h2 id="timeline-heading" className="text-xl font-bold tracking-tight text-foreground">
          What happens next
        </h2>
        <div className={styles.shipmentBlock}>
          <div className="flex items-center gap-3 text-sm text-foreground">
            <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
            </div>
            <div>
              <strong className="block font-semibold">Studio Team Preparing Your Order</strong>
              <span className="text-xs text-text-secondary">
                Our specialists are inspecting and packaging your items. We'll send an SMS notification the moment your parcel is ready at the concierge.
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-border flex items-center gap-3">
            <Link href="/products" className={styles.trackOrderButton}>
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const handleManualRefresh = () => {
    if (onRefreshStatus) {
      onRefreshStatus();
    }
    setLocalLastUpdated(new Date().toISOString());
  };

  return (
    <section className={styles.timelineContainer} aria-labelledby="timeline-heading">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 id="timeline-heading" className="text-xl font-bold tracking-tight text-foreground">
          What happens next
        </h2>

        {/* Live Status Indicator & Retry per Requirement 10 */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>
            Last updated: {formatOrderPlacedDate(localLastUpdated, 'en-IN') || 'Just now'}
          </span>
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-1 rounded hover:bg-surface-active text-text-secondary hover:text-foreground transition-colors cursor-pointer"
            aria-label="Refresh order status"
            title="Refresh order status"
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
              className={isRefreshing ? 'animate-spin' : ''}
              aria-hidden="true"
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>
      </div>

      {shipments.map((shipment) => {
        // Find index of current step to compute line fill height
        const currentIndex = shipment.stages.findIndex((s) => s.isCurrent);
        const lastCompletedIndex = shipment.stages
          .map((s) => s.isCompleted)
          .lastIndexOf(true);
        const activeIndex = currentIndex !== -1 ? currentIndex : Math.max(0, lastCompletedIndex);
        const progressFraction =
          shipment.stages.length > 1
            ? (activeIndex / (shipment.stages.length - 1)) * 100
            : 0;

        return (
          <div key={shipment.id} className={styles.shipmentBlock}>
            <div className={styles.shipmentHeader}>
              <div className="flex items-center gap-2">
                <h3 className={styles.shipmentTitle}>{shipment.title}</h3>
                {shipment.totalShipments > 1 && (
                  <span className="text-[11px] text-text-muted bg-surface-active px-2 py-0.5 rounded border border-border">
                    Shipment {shipment.shipmentNumber} of {shipment.totalShipments}
                  </span>
                )}
              </div>

              {shipment.carrier && (
                <span className={styles.carrierBadge}>
                  <span>Carrier:</span>
                  <strong className="text-foreground">{shipment.carrier}</strong>
                </span>
              )}
            </div>

            {/* Split Shipment Explanation Notice */}
            {shipment.totalShipments > 1 && (
              <div className="text-xs text-text-muted bg-surface/50 p-2.5 rounded border border-border/60">
                💡 <strong>Why separate shipments?</strong> Items are dispatched from specialized regional facilities (e.g. custom laser workshop vs. fast-ship inventory) so each piece arrives as swiftly as possible without delaying the rest of your order.
              </div>
            )}

            <div className="relative">
              {/* Animated Progress Line */}
              <div className={styles.lineTrack}>
                <motion.div
                  className={styles.lineFill}
                  initial={prefersReduced ? false : { height: 0 }}
                  animate={{ height: `${progressFraction}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              <ol
                className={styles.timelineList}
                aria-label={`${shipment.title} fulfillment progress`}
              >
                {shipment.stages.map((stage) => {
                  let markerClass = styles.futureMarker;
                  if (stage.isCompleted) {
                    markerClass = styles.completedMarker;
                  } else if (stage.isCurrent) {
                    markerClass = styles.currentMarker;
                  }

                  return (
                    <li
                      key={stage.key}
                      className={styles.timelineStep}
                      aria-current={stage.isCurrent ? 'step' : undefined}
                    >
                      <div className={`${styles.nodeMarker} ${markerClass}`}>
                        {stage.isCompleted ? (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : stage.isCurrent ? (
                          <div className="w-2 h-2 rounded-full bg-accent" />
                        ) : null}
                      </div>

                      <div className={styles.stepContent}>
                        <div className={styles.stepLabelRow}>
                          <span className={styles.stepLabel}>{stage.label}</span>
                          {stage.timestamp && (
                            <span className={styles.stepTimestamp}>
                              {formatOrderPlacedDate(stage.timestamp, 'en-IN')}
                            </span>
                          )}
                          {!stage.timestamp && stage.estimatedDateOrRange && (
                            <span className="text-xs text-text-muted italic">
                              ({stage.estimatedDateOrRange})
                            </span>
                          )}
                        </div>

                        {stage.sublabel && (
                          <span className={styles.stepSublabel}>{stage.sublabel}</span>
                        )}

                        {/* Special Carrier & Delivery Instructions */}
                        {stage.key === 'packed' && !stage.isCompleted && (
                          <p className="text-[11px] text-text-muted mt-0.5">
                            You'll receive SMS and email alerts with live courier tracking as soon as this parcel is scanned at the hub.
                          </p>
                        )}

                        {stage.trackingUrl && stage.trackingNumber && (
                          <div className="mt-1">
                            <a
                              href={stage.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.trackingLink}
                            >
                              <span>Track via {stage.carrier || 'carrier'} (#{stage.trackingNumber})</span>
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </a>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Logistics Service Guarantees (Signature, White-glove) */}
            {(shipment.signatureRequired || shipment.whiteGloveAssembly) && (
              <div className="pt-2 border-t border-border flex flex-col gap-1.5 text-xs text-text-secondary">
                {shipment.signatureRequired && (
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent" aria-hidden="true">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span><strong>Direct Signature Required:</strong> Recipient must sign upon physical handover.</span>
                  </div>
                )}
                {shipment.whiteGloveAssembly && (
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent" aria-hidden="true">
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span><strong>White-Glove Placement:</strong> Delivery team uncrates, positions, and installs in your designated room.</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions for this shipment */}
            <div className="pt-2 border-t border-border flex items-center justify-between flex-wrap gap-3">
              <Link
                href={`/account/orders?id=${orderId}`}
                className={styles.trackOrderButton}
                aria-label={`Track order #${orderId} in account portal`}
              >
                <span>Track Order</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>

              <Link
                href="/products"
                className="text-xs text-text-muted hover:text-foreground transition-colors underline underline-offset-2"
              >
                Continue shopping &rarr;
              </Link>
            </div>
          </div>
        );
      })}
    </section>
  );
};
