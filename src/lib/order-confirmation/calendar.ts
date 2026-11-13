/**
 * Calendar Event Generation (RFC 5545 iCalendar standard).
 * Generates valid .ics files and web links for Google Calendar and Outlook.com.
 * Strictly avoids leaking sensitive PII (addresses, phone numbers) into shared calendars.
 */

import { ShipmentGroup } from './types';

export interface CalendarEventPayload {
  orderId: string;
  shipmentId?: string;
  shipmentTitle?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;  // YYYY-MM-DD
  isEstimate: boolean;
  windowConfirmed?: boolean;
  timeWindow?: string; // e.g. "14:00 - 17:00"
  trackingUrl?: string;
  storeDomain?: string;
  sequence?: number;
  timeZone?: string;
}

/**
 * Escapes characters in iCalendar text per RFC 5545 Section 3.3.11.
 * Backslashes, semicolons, commas, and newlines must be escaped.
 */
export function escapeIcsText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Folds lines to at most 75 octets per RFC 5545 Section 3.1.
 * Continuation lines begin with a single space.
 */
export function foldIcsLine(line: string): string {
  if (Buffer.byteLength(line, 'utf8') <= 75) {
    return line;
  }

  const parts: string[] = [];
  let current = '';

  for (const char of line) {
    const candidate = current + char;
    // Continuation line prefix is 1 space (1 byte)
    const maxBytes = parts.length === 0 ? 75 : 74;

    if (Buffer.byteLength(candidate, 'utf8') > maxBytes) {
      parts.push(current);
      current = char;
    } else {
      current = candidate;
    }
  }

  if (current) {
    parts.push(current);
  }

  return parts.join('\r\n ');
}

/**
 * Formats a Date object into UTC iCalendar timestamp: YYYYMMDDTHHMMSSZ
 */
export function formatIcsUtcTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  const hh = pad(date.getUTCHours());
  const mm = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

/**
 * Formats YYYY-MM-DD to YYYYMMDD for VALUE=DATE
 */
export function formatIcsDateOnly(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

/**
 * Computes non-inclusive next day for RFC 5545 VALUE=DATE DTEND.
 */
export function computeNextDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const nextDate = new Date(Date.UTC(y, m - 1, d + 1));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${nextDate.getUTCFullYear()}${pad(nextDate.getUTCMonth() + 1)}${pad(nextDate.getUTCDate())}`;
}

/**
 * Generates lines for a single RFC 5545 VEVENT block.
 */
export function generateVeventBlock(
  payload: CalendarEventPayload,
  referenceDate: Date = new Date()
): string[] {
  const {
    orderId,
    shipmentId,
    shipmentTitle,
    startDate,
    endDate,
    isEstimate,
    windowConfirmed,
    timeWindow,
    trackingUrl,
    storeDomain = 'matte.store',
    sequence = 0,
    timeZone = 'Asia/Kolkata',
  } = payload;

  const titleSuffix = isEstimate ? ' (estimated)' : '';
  const summaryText = shipmentTitle
    ? `Delivery: Order #${orderId} - ${shipmentTitle}${titleSuffix}`
    : `Delivery: Order #${orderId}${titleSuffix}`;

  const cleanTrackingUrl = trackingUrl || `https://${storeDomain}/account/orders`;
  const descriptionText = [
    `Delivery for Order #${orderId}.`,
    isEstimate ? 'Estimated delivery window. Dates may change based on transit.' : 'Confirmed delivery window.',
    `Track your shipment: ${cleanTrackingUrl}`,
    `Need help? Contact support@${storeDomain}`,
  ].join('\n');

  const dtstamp = formatIcsUtcTimestamp(referenceDate);
  const uid = shipmentId
    ? `order-${orderId}-${shipmentId}@${storeDomain}`
    : `order-${orderId}@${storeDomain}`;

  const lines: string[] = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `SEQUENCE:${sequence}`,
    'STATUS:CONFIRMED',
    'TRANSP:TRANSPARENT', // Free time on user's calendar
  ];

  // If a time window was confirmed by the carrier (e.g. "14:00 - 17:00"), use timed DTSTART/DTEND
  if (windowConfirmed && timeWindow && timeWindow.includes('-')) {
    const [startH, endH] = timeWindow.split('-').map((s) => s.trim().replace(/:/g, ''));
    const startNum = startH.padStart(4, '0') + '00';
    const endNum = endH.padStart(4, '0') + '00';
    const dateOnly = formatIcsDateOnly(startDate);
    lines.push(`DTSTART;TZID=${timeZone}:${dateOnly}T${startNum}`);
    lines.push(`DTEND;TZID=${timeZone}:${dateOnly}T${endNum}`);
  } else {
    // Standard All-Day or Multi-Day Range
    const dtstart = formatIcsDateOnly(startDate);
    const dtend = computeNextDay(endDate || startDate);
    lines.push(`DTSTART;VALUE=DATE:${dtstart}`);
    lines.push(`DTEND;VALUE=DATE:${dtend}`);
  }

  lines.push(`SUMMARY:${escapeIcsText(summaryText)}`);
  lines.push(`DESCRIPTION:${escapeIcsText(descriptionText)}`);
  lines.push(`URL:${escapeIcsText(cleanTrackingUrl)}`);

  // Reminder Alarm: 9:00 AM the morning before (-P1D)
  lines.push(
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:-P1D',
    `DESCRIPTION:${escapeIcsText(`Tomorrow: Delivery for Order #${orderId}`)}`,
    'END:VALARM',
    'END:VEVENT'
  );

  return lines;
}

/**
 * Generates an RFC 5545 compliant .ics file string for a single event.
 */
export function generateIcsContent(
  payload: CalendarEventPayload,
  referenceDate: Date = new Date()
): string {
  const veventLines = generateVeventBlock(payload, referenceDate);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MATTE.//Order Confirmation Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...veventLines,
    'END:VCALENDAR',
  ];

  // Join lines with strict CRLF, folding lines over 75 bytes
  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

/**
 * Generates an RFC 5545 compliant .ics file containing all shipments in a single calendar invite.
 */
export function generateMultiShipmentIcsContent(
  payloads: CalendarEventPayload[],
  referenceDate: Date = new Date()
): string {
  const allVevents = payloads.flatMap((p) => generateVeventBlock(p, referenceDate));
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MATTE.//Order Confirmation Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...allVevents,
    'END:VCALENDAR',
  ];

  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

/**
 * Builds Google Calendar web template link.
 */
export function buildGoogleCalendarUrl(payload: CalendarEventPayload): string {
  const {
    orderId,
    shipmentTitle,
    startDate,
    endDate,
    isEstimate,
    trackingUrl,
    storeDomain = 'matte.store',
  } = payload;

  const titleSuffix = isEstimate ? ' (estimated)' : '';
  const text = shipmentTitle
    ? `Delivery: Order #${orderId} - ${shipmentTitle}${titleSuffix}`
    : `Delivery: Order #${orderId}${titleSuffix}`;

  const dtstart = formatIcsDateOnly(startDate);
  const dtend = computeNextDay(endDate || startDate);
  const dates = `${dtstart}/${dtend}`;

  const cleanTrackingUrl = trackingUrl || `https://${storeDomain}/account/orders`;
  const details = [
    `Delivery for Order #${orderId}.`,
    isEstimate ? 'Estimated delivery window. Dates may change based on transit.' : 'Confirmed delivery window.',
    `Track shipment: ${cleanTrackingUrl}`,
  ].join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text,
    dates,
    details,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Builds Outlook.com web compose link.
 */
export function buildOutlookWebUrl(payload: CalendarEventPayload): string {
  const {
    orderId,
    shipmentTitle,
    startDate,
    endDate,
    isEstimate,
    trackingUrl,
    storeDomain = 'matte.store',
  } = payload;

  const titleSuffix = isEstimate ? ' (estimated)' : '';
  const subject = shipmentTitle
    ? `Delivery: Order #${orderId} - ${shipmentTitle}${titleSuffix}`
    : `Delivery: Order #${orderId}${titleSuffix}`;

  const cleanTrackingUrl = trackingUrl || `https://${storeDomain}/account/orders`;
  const body = [
    `Delivery for Order #${orderId}.`,
    isEstimate ? 'Estimated delivery window. Dates may change based on transit.' : 'Confirmed delivery window.',
    `Track shipment: ${cleanTrackingUrl}`,
  ].join('\n');

  const params = new URLSearchParams({
    rru: 'addevent',
    subject,
    startdt: startDate,
    enddt: endDate || startDate,
    allday: 'true',
    body,
  });

  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
}

/**
 * Helper to build calendar payload from a shipment group.
 */
export function getCalendarPayloadFromShipment(
  orderId: string,
  shipment: ShipmentGroup,
  storeDomain?: string,
  sequence: number = 0
): CalendarEventPayload {
  return {
    orderId,
    shipmentId: shipment.totalShipments > 1 ? shipment.id : undefined,
    shipmentTitle: shipment.totalShipments > 1 ? shipment.title : undefined,
    startDate: shipment.estimatedDelivery.start,
    endDate: shipment.estimatedDelivery.end || shipment.estimatedDelivery.start,
    isEstimate: shipment.estimatedDelivery.isEstimate,
    windowConfirmed: shipment.estimatedDelivery.windowConfirmed,
    timeWindow: shipment.estimatedDelivery.timeWindow,
    trackingUrl: shipment.trackingUrl,
    storeDomain,
    sequence,
  };
}
