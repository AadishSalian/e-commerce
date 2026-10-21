import {
  DailyPricePoint,
  PriceHistoryStats,
  PriceHistoryTag,
} from './types';
import { formatPriceMinor, formatShortDate } from './currency';

export const MIN_HISTORY_DAYS = 14;
export const DEFAULT_WINDOW_DAYS = 30;
export const MIN_HELD_DAYS_FOR_DROP = 7;
export const HIGHER_THAN_USUAL_THRESHOLD = 1.10; // 10% above average

export interface TagComputeOptions {
  minHistoryDays?: number;
  windowDays?: number;
  minHeldDaysForDrop?: number;
  higherThanUsualThreshold?: number;
  currency?: string;
  locale?: string;
}

/**
 * Computes a truthful anchor "was ₹X" price.
 * Rule: Highest price held continuously for at least 7 days in the last 30 days,
 * and strictly higher than the current price.
 * If no price was held for at least 7 days, returns null.
 */
export function computeWasPrice(
  dailyPoints: DailyPricePoint[],
  currentPrice: number,
  minHeldDays: number = MIN_HELD_DAYS_FOR_DROP
): number | null {
  if (!dailyPoints || dailyPoints.length === 0) return null;

  // Track contiguous runs of the same closing price
  let candidateWasPrice: number | null = null;
  let currentRunPrice = -1;
  let currentRunCount = 0;

  for (let i = 0; i < dailyPoints.length; i++) {
    const point = dailyPoints[i];
    if (point.closingPrice === currentRunPrice) {
      currentRunCount++;
    } else {
      currentRunPrice = point.closingPrice;
      currentRunCount = 1;
    }

    if (currentRunCount >= minHeldDays && currentRunPrice > currentPrice) {
      if (candidateWasPrice === null || currentRunPrice > candidateWasPrice) {
        candidateWasPrice = currentRunPrice;
      }
    }
  }

  return candidateWasPrice;
}

/**
 * Deterministic tag logic running on real, server-recorded price data.
 * 
 * Strict Priority Order:
 * 1. `tracking_started`: Neutral note if daysTracked < MIN_HISTORY_DAYS. No promotional claim!
 * 2. `same_for_days`: Flat price where price has remained identical across all tracked days.
 * 3. `lowest_in_days`: Current price is <= minimum in the period, newly reached today or single instance.
 * 4. `same_as_low`: Current price equals lowest price in period, but low was reached earlier.
 * 5. `price_dropped`: Current price dropped below a price held for at least 7 days.
 * 6. `higher_than_usual`: Current price is >= 10% above the period average.
 * 7. null: No tag qualifies. Never fabricate a fallback.
 */
export function computePriceTag(
  dailyPoints: DailyPricePoint[],
  stats: PriceHistoryStats,
  trackingStartDate: string,
  options: TagComputeOptions = {}
): PriceHistoryTag | null {
  const {
    minHistoryDays = MIN_HISTORY_DAYS,
    windowDays = DEFAULT_WINDOW_DAYS,
    minHeldDaysForDrop = MIN_HELD_DAYS_FOR_DROP,
    higherThanUsualThreshold = HIGHER_THAN_USUAL_THRESHOLD,
    currency = 'INR',
    locale = 'en-IN',
  } = options;

  if (!dailyPoints || dailyPoints.length === 0) {
    return null;
  }

  const daysTracked = stats.daysTracked;

  // ----------------------------------------------------
  // Priority 1: Neutral note if fewer than minimum days
  // ----------------------------------------------------
  if (daysTracked < minHistoryDays) {
    if (trackingStartDate) {
      const formattedStart = formatShortDate(trackingStartDate, false, locale);
      return {
        type: 'tracking_started',
        text: `Price tracking started on ${formattedStart}`,
        highlightPhrase: 'Price tracking started',
        isNeutral: true,
      };
    }
    return null;
  }

  const current = stats.current;
  const lowest = stats.lowest;
  const highest = stats.highest;
  const average = stats.average;

  // Filter daily points within the active window (e.g. 30 days)
  const windowPoints = dailyPoints.slice(-windowDays);
  const effectiveWindowDays = Math.min(daysTracked, windowDays);

  // ----------------------------------------------------
  // Priority 2: "Price has stayed the same for N days"
  // If price has never changed across the entire tracked window
  // ----------------------------------------------------
  const allPricesSame = dailyPoints.every(
    (p) => p.lowestPrice === current && p.closingPrice === current
  );
  if (allPricesSame && daysTracked >= minHistoryDays) {
    const phrase = `Price has stayed the same for ${daysTracked} days`;
    return {
      type: 'same_for_days',
      text: phrase,
      highlightPhrase: phrase,
    };
  }

  const windowLowest = Math.min(...windowPoints.map((p) => p.lowestPrice));
  const isCurrentLowest = current <= windowLowest;

  // Lowest points in this window
  const lowestPoints = windowPoints.filter((p) => p.lowestPrice === windowLowest);
  const firstLowestDate = lowestPoints[0]?.date;
  const latestDate = windowPoints[windowPoints.length - 1]?.date;
  // If the lowest price first appeared today (or only at the end), it is a new low
  const isNewLowToday = firstLowestDate === latestDate || lowestPoints.length === 1;

  // ----------------------------------------------------
  // Priority 3: "Lowest price in X days"
  // ----------------------------------------------------
  if (isCurrentLowest && isNewLowToday) {
    const periodLabel = `${effectiveWindowDays} days`;
    const phrase = `Lowest price in ${periodLabel}`;
    return {
      type: 'lowest_in_days',
      text: phrase,
      highlightPhrase: phrase,
      sinceDate: firstLowestDate,
      diffAmount: highest > current ? highest - current : undefined,
    };
  }

  // ----------------------------------------------------
  // Priority 4: "Same price as X-day low"
  // ----------------------------------------------------
  if (isCurrentLowest && !isNewLowToday) {
    const periodLabel = `${effectiveWindowDays}-day low`;
    const phrase = `Same price as ${periodLabel}`;
    return {
      type: 'same_as_low',
      text: phrase,
      highlightPhrase: phrase,
      sinceDate: firstLowestDate,
    };
  }

  // ----------------------------------------------------
  // Priority 5: "Price dropped ₹X since [date]"
  // ----------------------------------------------------
  let heldPrice: number | null = null;
  let dropDate: string | null = null;

  let currentRunCount = 0;
  let lastRunPrice = -1;

  for (let i = windowPoints.length - 2; i >= 0; i--) {
    const point = windowPoints[i];
    if (lastRunPrice === -1) {
      lastRunPrice = point.closingPrice;
      currentRunCount = 1;
    } else if (point.closingPrice === lastRunPrice) {
      currentRunCount++;
    } else {
      if (currentRunCount >= minHeldDaysForDrop && lastRunPrice > current) {
        heldPrice = lastRunPrice;
        dropDate = windowPoints[i + 1]?.date || point.date;
        break;
      }
      lastRunPrice = point.closingPrice;
      currentRunCount = 1;
    }
  }

  if (!heldPrice && currentRunCount >= minHeldDaysForDrop && lastRunPrice > current) {
    heldPrice = lastRunPrice;
    dropDate = windowPoints[windowPoints.length - currentRunCount]?.date || windowPoints[0].date;
  }

  if (heldPrice && dropDate && heldPrice > current) {
    const diff = heldPrice - current;
    const formattedDiff = formatPriceMinor(diff, currency, locale);
    const formattedDate = formatShortDate(dropDate, false, locale);
    return {
      type: 'price_dropped',
      text: `Price dropped ${formattedDiff} since ${formattedDate}`,
      highlightPhrase: `Price dropped ${formattedDiff}`,
      diffAmount: diff,
      sinceDate: dropDate,
    };
  }

  // ----------------------------------------------------
  // Priority 6: "Price is higher than usual"
  // ----------------------------------------------------
  if (average > 0 && current >= average * higherThanUsualThreshold) {
    const phrase = 'Price is higher than usual';
    return {
      type: 'higher_than_usual',
      text: phrase,
      highlightPhrase: phrase,
      diffAmount: current - average,
    };
  }

  // ----------------------------------------------------
  // Priority 7: No tag when nothing qualifies
  // ----------------------------------------------------
  return null;
}
