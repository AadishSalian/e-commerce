'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ShipmentGroup } from '@/lib/order-confirmation/types';
import {
  generateIcsContent,
  generateMultiShipmentIcsContent,
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
  const [selectedShipmentMode, setSelectedShipmentMode] = useState<string>('all');
  const [sequence, setSequence] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);

  // Filter shipments that have valid delivery dates
  const validShipments = shipments.filter(
    (s) => s.estimatedDelivery && s.estimatedDelivery.start
  );

  // Focus management: Trap / return focus and handle Escape
  useEffect(() => {
    if (!isOpen) return;

    firstActionRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Hide action completely when there's no usable date yet (Requirement 7)
  if (validShipments.length === 0) {
    return null;
  }

  // Active target shipment if a specific one is selected
  const activeShipment =
    selectedShipmentMode === 'all'
      ? validShipments[0]
      : validShipments.find((s) => s.id === selectedShipmentMode) || validShipments[0];

  const payload = getCalendarPayloadFromShipment(orderId, activeShipment, undefined, sequence);
  const googleUrl = buildGoogleCalendarUrl(payload);
  const outlookUrl = buildOutlookWebUrl(payload);

  const handleDownloadIcs = (isAll: boolean = false) => {
    let icsString: string;
    let fileName: string;

    if (isAll && validShipments.length > 1) {
      const payloads = validShipments.map((s) =>
        getCalendarPayloadFromShipment(orderId, s, undefined, sequence)
      );
      icsString = generateMultiShipmentIcsContent(payloads);
      fileName = `order-${orderId}-all-deliveries.ics`;
    } else {
      icsString = generateIcsContent(payload);
      fileName = `order-${orderId}-delivery.ics`;
    }

    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleIncrementSequence = () => {
    setSequence((prev) => prev + 1);
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
            onClick={() => {
              setIsOpen(false);
              triggerRef.current?.focus();
            }}
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

            {/* Split Shipments Selector: choose shipment or "Add all" (Requirement 7) */}
            {validShipments.length > 1 && (
              <div className="px-2 py-1 flex flex-col gap-1 border-b border-border/50 pb-2">
                <label htmlFor="calendar-shipment-select" className="text-[11px] text-text-muted font-medium">
                  Select Shipment:
                </label>
                <select
                  id="calendar-shipment-select"
                  value={selectedShipmentMode}
                  onChange={(e) => setSelectedShipmentMode(e.target.value)}
                  className="bg-background border border-border text-foreground text-xs p-1.5 rounded focus:outline-none focus:border-accent"
                >
                  <option value="all">Add all shipments ({validShipments.length} events)</option>
                  {validShipments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.estimatedDelivery.formattedDisplay})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Apple / Outlook .ics download */}
            {selectedShipmentMode === 'all' && validShipments.length > 1 ? (
              <button
                ref={firstActionRef}
                type="button"
                className={styles.menuItem}
                onClick={() => handleDownloadIcs(true)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Add all ({validShipments.length} shipments) to Apple / Outlook (.ics)</span>
              </button>
            ) : (
              <button
                ref={firstActionRef}
                type="button"
                className={styles.menuItem}
                onClick={() => handleDownloadIcs(false)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Apple Calendar / Outlook (.ics)</span>
              </button>
            )}

            {/* Google Calendar Web Link */}
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.menuItem}
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>Google Calendar</span>
            </a>

            {/* Outlook.com Web Link */}
            <a
              href={outlookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.menuItem}
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span>Outlook.com Web</span>
            </a>

            {/* Updated Date Support (Requirement 7) */}
            <div className="pt-1 border-t border-border/50">
              <button
                type="button"
                onClick={handleIncrementSequence}
                className="text-[11px] text-accent hover:underline text-left px-2 py-1 cursor-pointer"
              >
                Estimate changed? Click to generate revision (SEQ: {sequence + 1})
              </button>
            </div>

            <div className={styles.disclaimer}>
              Calendar events do not update automatically if transit dates change. Re-adding will update the existing entry without duplicating.
            </div>
          </div>
        </>
      )}
    </div>
  );
};
