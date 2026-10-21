/**
 * Currency and price formatting utilities for integer minor units (paise/cents).
 */

export const DEFAULT_CURRENCY = 'INR';
export const DEFAULT_LOCALE = 'en-IN';

/**
 * Converts integer minor units (paise/cents) to standard currency string.
 * Example: 24900 with INR -> "₹249" (or "₹249.00" if fraction > 0)
 */
export function formatPriceMinor(
  minorUnits: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE
): string {
  const majorUnits = (minorUnits || 0) / 100;
  const hasFraction = minorUnits % 100 !== 0;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(majorUnits);
}

/**
 * Converts standard major units (e.g. 249) to integer minor units (e.g. 24900).
 */
export function toMinorUnits(majorUnits: number): number {
  return Math.round((majorUnits || 0) * 100);
}

/**
 * Converts minor units (e.g. 24900) to major units (e.g. 249).
 */
export function toMajorUnits(minorUnits: number): number {
  return (minorUnits || 0) / 100;
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) into a human readable short date like "12 Oct" or "12 Oct 2026".
 */
export function formatShortDate(
  dateInput: string | Date,
  includeYear: boolean = false,
  locale: string = DEFAULT_LOCALE
): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    ...(includeYear ? { year: 'numeric' } : {}),
  }).format(date);
}
