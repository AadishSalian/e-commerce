'use client';

import React from 'react';
import Link from 'next/link';
import { ShipmentGroup } from '@/lib/order-confirmation/types';
import { formatOrderPlacedDate } from '@/lib/order-confirmation/masking';
import styles from './OrderTimeline.module.css';

interface OrderTimelineProps {
  orderId: string;
  shipments: ShipmentGroup[];
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({
  orderId,
  shipments,
}) => {
  return (
    <section className={styles.timelineContainer} aria-labelledby="timeline-heading">
      <div className="flex items-center justify-between">
        <h2 id="timeline-heading" className="text-xl font-bold tracking-tight text-foreground">
          What happens next
        </h2>
      </div>

      {shipments.map((shipment) => (
        <div key={shipment.id} className={styles.shipmentBlock}>
          <div className={styles.shipmentHeader}>
            <h3 className={styles.shipmentTitle}>{shipment.title}</h3>
            {shipment.carrier && (
              <span className={styles.carrierBadge}>
                <span>Carrier:</span>
                <strong className="text-foreground">{shipment.carrier}</strong>
              </span>
            )}
          </div>

          <ol className={styles.timelineList} aria-label={`${shipment.title} progress stages`}>
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
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

                    {stage.trackingUrl && stage.trackingNumber && (
                      <div className="mt-1">
                        <a
                          href={stage.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.trackingLink}
                        >
                          <span>Track via {stage.carrier || 'carrier'} (#{stage.trackingNumber})</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

          {/* Primary Action Button */}
          <div className="pt-2 border-t border-border flex items-center justify-between flex-wrap gap-3">
            <Link
              href={`/account/orders?id=${orderId}`}
              className={styles.trackOrderButton}
              aria-label={`Track order #${orderId} in account portal`}
            >
              <span>Track Order</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>

            <Link
              href="/account/orders"
              className="text-xs text-text-muted hover:text-foreground transition-colors underline underline-offset-2"
            >
              View in order history &rarr;
            </Link>
          </div>
        </div>
      ))}
    </section>
  );
};
