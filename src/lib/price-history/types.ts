/**
 * Price History Data Layer & Tag Types
 * 
 * Strict honesty rules:
 * - Integer minor units end to end (e.g. paise / cents)
 * - Deterministic, server-computed tags
 * - No estimated, backfilled, or invented data
 */

export type PriceSource =
  | 'catalog_update'
  | 'promotion_start'
  | 'promotion_end'
  | 'manual_correction'
  | 'import'
  | 'initial_record';

export interface PriceRecord {
  id: string;
  productId: string;
  variantId?: string | null;
  /** Integer minor units: e.g. 24900 for ₹249.00 or $249.00 */
  price: number;
  currency: string;
  /** ISO 8601 string */
  recordedAt: string;
  source: PriceSource;
  auditNote?: string;
}

export interface PromotionPeriod {
  startDate: string; // ISO 8601 or YYYY-MM-DD
  endDate: string;   // ISO 8601 or YYYY-MM-DD
  name?: string;
  discountMinorUnits?: number;
}

export interface DailyPricePoint {
  date: string; // YYYY-MM-DD
  lowestPrice: number;  // minor units
  closingPrice: number; // minor units
  isPromotion: boolean;
  recordsCount: number;
}

export interface PriceHistoryStats {
  lowest: number;       // minor units
  highest: number;      // minor units
  current: number;      // minor units
  average: number;      // minor units
  lowestDate: string;   // YYYY-MM-DD
  highestDate: string;  // YYYY-MM-DD
  daysTracked: number;
  /**
   * Only populated if a higher price was held for at least 7 days in the last 30 days.
   * Null if no such price exists. Never fabricated.
   */
  wasPrice: number | null;
}

export type PriceTagType =
  | 'lowest_in_days'
  | 'price_dropped'
  | 'same_as_low'
  | 'higher_than_usual'
  | 'same_for_days'
  | 'tracking_started';

export interface PriceHistoryTag {
  type: PriceTagType;
  text: string;
  highlightPhrase: string;
  diffAmount?: number; // minor units
  sinceDate?: string;  // formatted date string or ISO
  isNeutral?: boolean;
}

export interface PriceHistoryResponse {
  productId: string;
  variantId: string | null;
  currency: string;
  daysTracked: number;
  trackingStartDate: string;
  stats: PriceHistoryStats;
  dailyPoints: DailyPricePoint[];
  promotionPeriods: PromotionPeriod[];
  tag: PriceHistoryTag | null;
  /** False if daysTracked < MIN_HISTORY_DAYS */
  qualifiesForChart: boolean;
}
