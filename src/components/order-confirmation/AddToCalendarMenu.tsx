'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ShipmentGroup } from '@/lib/order-confirmation/types';
import {
  generateIcsContent,
  buildGoogleCalendarUrl,
  buildOutlookWebUrl,
  getCalendarPayloadFromShipment,
} from '@/lib/order-confirmation/calendar';
import styles from './AddToCalendarMenu.module.css';

interface AddToCalendarMenuProps {
  orderId: string;
  shipments: ShipmentGroup[];
}

export const AddToCalendarMenu: React.FC<AddToCalendarMenuProps> = ({
  orderId,
  shipments,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedShipmentIdx, setSelectedShipmentIdx] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeShipment = shipments[selectedShipmentIdx] || shipments[0];

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!activeShipment || !activeShipment.estimatedDelivery?.start) {
    return null; // Hide if no date available yet
  }

  const payload = getCalendarPayloadFromShipment(orderId, activeShipment);
  const googleUrl = buildGoogleCalendarUrl(payload);
  const outlookUrl = buildOutlookWebUrl(payload);

  const handleDownloadIcs = () => {
    const icsString = generateIcsContent(payload);
    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `order-${orderId}-delivery.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        className={styles.triggerButton}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Add estimated delivery date to calendar"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>Add to calendar</span>
      </button>

      {isOpen && (
        <>
          <div
            className={styles.menuBackdrop}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={menuRef}
            className={styles.popoverContent}
            role="dialog"
            aria-label="Calendar export options"
          >
            <div className={styles.menuHeader}>
              <span>Add Delivery Date</span>
            </div>

            {/* If multi-shipment, allow selecting shipment */}
            {shipments.length > 1 && (
              <div className="px-2 py-1 flex flex-col gap-1">
                <span className="text-[11px] text-text-muted">Choose Shipment:</span>
                <select
                  value={selectedShipmentIdx}
                  onChange={(e) => setSelectedShipmentIdx(Number(e.target.value))}
                  className="bg-background border border-border text-foreground text-xs p-1.5 rounded"
                >
                  {shipments.map((s, idx) => (
                    <option key={s.id} value={idx}>
                      {s.title} ({s.estimatedDelivery.formattedDisplay})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              className={styles.menuItem}
              onClick={handleDownloadIcs}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Apple Calendar / Outlook (.ics)</span>
            </button>

            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.menuItem}
              onClick={() => setIsOpen(false)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>Google Calendar</span>
            </a>

            <a
              href={outlookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.menuItem}
              onClick={() => setIsOpen(false)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span>Outlook.com Web</span>
            </a>

            <div className={styles.disclaimer}>
              Calendar events do not update automatically if logistics dates change. You can re-export from this page anytime.
            </div>
          </div>
        </>
      )}
    </div>
  );
};
