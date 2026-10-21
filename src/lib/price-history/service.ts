import fs from 'fs';
import path from 'path';
import {
  DailyPricePoint,
  PriceHistoryResponse,
  PriceHistoryStats,
  PriceRecord,
  PromotionPeriod,
} from './types';
import { computePriceTag, computeWasPrice, MIN_HISTORY_DAYS } from './tagLogic';
import { DEFAULT_CURRENCY, toMinorUnits } from './currency';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'price-history.json');

// Memory cache for recorded price rows
let cachedRecords: PriceRecord[] | null = null;

/**
 * Ensure data directory and file exist
 */
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = generateInitialSeedData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    cachedRecords = initialData;
  }
}

/**
 * Load all recorded price history rows (from file/memory).
 * History is strictly append-only.
 */
export function getAllPriceRecords(): PriceRecord[] {
  if (cachedRecords) {
    return cachedRecords;
  }
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    cachedRecords = JSON.parse(raw);
    return cachedRecords || [];
  } catch (error) {
    console.error('Failed to read price history data:', error);
    return [];
  }
}

/**
 * Record a price change to the immutable price history log.
 * Never deletes or rewrites history; corrections are new rows with an audit note.
 */
export function recordPriceChange(entry: {
  productId: string;
  variantId?: string | null;
  price: number; // integer minor units
  currency?: string;
  source: PriceRecord['source'];
  auditNote?: string;
  recordedAt?: string;
}): PriceRecord {
  ensureDataFile();
  const records = getAllPriceRecords();

  const newRecord: PriceRecord = {
    id: `ph_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    productId: entry.productId,
    variantId: entry.variantId || null,
    price: Math.round(entry.price),
    currency: entry.currency || DEFAULT_CURRENCY,
    recordedAt: entry.recordedAt || new Date().toISOString(),
    source: entry.source,
    auditNote: entry.auditNote,
  };

  records.push(newRecord);
  cachedRecords = records;

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to persist price record:', error);
  }

  return newRecord;
}

/**
 * Get price history for a product/variant over the specified window (30, 90, 365, or all).
 */
export function getProductPriceHistory(
  productId: string,
  variantId?: string | null,
  windowDaysInput: number | string = 30
): PriceHistoryResponse | null {
  const allRecords = getAllPriceRecords();

  // Filter records for this product and variant
  // If variantId is specified, look for variant-specific records or fallback to base product
  let productRecords = allRecords.filter((r) => {
    if (r.productId !== productId) return false;
    if (variantId) {
      return r.variantId === variantId;
    }
    return !r.variantId; // Base product records
  });

  // If no variant-specific records exist yet for this variant, fallback to base product records
  if (variantId && productRecords.length === 0) {
    productRecords = allRecords.filter((r) => r.productId === productId && !r.variantId);
  }

  if (productRecords.length === 0) {
    return null;
  }

  // Sort chronologically ascending
  productRecords.sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  const currency = productRecords[0].currency || DEFAULT_CURRENCY;
  const trackingStartDate = productRecords[0].recordedAt.slice(0, 10);

  // Group by calendar day (YYYY-MM-DD)
  const dayMap = new Map<string, { prices: number[]; isPromotion: boolean }>();
  for (const record of productRecords) {
    const day = record.recordedAt.slice(0, 10);
    if (!dayMap.has(day)) {
      dayMap.set(day, { prices: [], isPromotion: false });
    }
    const entry = dayMap.get(day)!;
    entry.prices.push(record.price);
    if (record.source === 'promotion_start') {
      entry.isPromotion = true;
    }
  }

  // Fill in intermediate days if price stayed flat between recordings
  const sortedDays = Array.from(dayMap.keys()).sort();
  const firstDay = new Date(sortedDays[0]);
  const today = new Date();
  
  // Build continuous daily points
  const continuousDailyPoints: DailyPricePoint[] = [];
  let lastKnownClosingPrice = productRecords[0].price;
  let activePromotion = false;

  const currentIterDate = new Date(firstDay);
  while (currentIterDate <= today) {
    const dayStr = currentIterDate.toISOString().slice(0, 10);
    const dayData = dayMap.get(dayStr);

    if (dayData && dayData.prices.length > 0) {
      const lowest = Math.min(...dayData.prices);
      const closing = dayData.prices[dayData.prices.length - 1];
      if (dayData.isPromotion) activePromotion = true;

      // Check if promotion ended today
      const endRec = productRecords.find(
        (r) => r.recordedAt.startsWith(dayStr) && r.source === 'promotion_end'
      );
      if (endRec) {
        activePromotion = false;
      }

      continuousDailyPoints.push({
        date: dayStr,
        lowestPrice: lowest,
        closingPrice: closing,
        isPromotion: activePromotion || dayData.isPromotion,
        recordsCount: dayData.prices.length,
      });
      lastKnownClosingPrice = closing;
    } else {
      // Price held steady from previous day
      continuousDailyPoints.push({
        date: dayStr,
        lowestPrice: lastKnownClosingPrice,
        closingPrice: lastKnownClosingPrice,
        isPromotion: activePromotion,
        recordsCount: 0,
      });
    }

    // Step forward 1 day
    currentIterDate.setDate(currentIterDate.getDate() + 1);
  }

  const daysTracked = continuousDailyPoints.length;

  // Determine window filter
  let windowDays = 30;
  if (typeof windowDaysInput === 'string') {
    if (windowDaysInput.toLowerCase() === 'all') {
      windowDays = Math.max(daysTracked, 1);
    } else {
      const parsed = parseInt(windowDaysInput, 10);
      windowDays = isNaN(parsed) ? 30 : parsed;
    }
  } else {
    windowDays = windowDaysInput;
  }

  // Slice daily points to requested window
  const filteredPoints = continuousDailyPoints.slice(-windowDays);

  if (filteredPoints.length === 0) {
    return null;
  }

  // Calculate precomputed stats strictly from real data
  let lowest = Infinity;
  let highest = -Infinity;
  let sum = 0;
  let lowestDate = filteredPoints[0].date;
  let highestDate = filteredPoints[0].date;

  for (const point of filteredPoints) {
    if (point.lowestPrice < lowest) {
      lowest = point.lowestPrice;
      lowestDate = point.date;
    }
    if (point.closingPrice > highest) {
      highest = point.closingPrice;
      highestDate = point.date;
    }
    sum += point.closingPrice;
  }

  const current = filteredPoints[filteredPoints.length - 1].closingPrice;
  const average = Math.round(sum / filteredPoints.length);

  // Compute "was price" anchor strictly from history (highest price held for at least 7 days)
  const wasPrice = computeWasPrice(filteredPoints, current, 7);

  const stats: PriceHistoryStats = {
    lowest,
    highest,
    current,
    average,
    lowestDate,
    highestDate,
    daysTracked,
    wasPrice,
  };

  // Extract promotion periods from records
  const promotionPeriods: PromotionPeriod[] = [];
  let currentPromoStart: string | null = null;
  for (const record of productRecords) {
    if (record.source === 'promotion_start') {
      currentPromoStart = record.recordedAt.slice(0, 10);
    } else if (record.source === 'promotion_end' && currentPromoStart) {
      promotionPeriods.push({
        startDate: currentPromoStart,
        endDate: record.recordedAt.slice(0, 10),
      });
      currentPromoStart = null;
    }
  }
  if (currentPromoStart) {
    promotionPeriods.push({
      startDate: currentPromoStart,
      endDate: today.toISOString().slice(0, 10),
    });
  }

  // Server-computed truthful tag
  const tag = computePriceTag(filteredPoints, stats, trackingStartDate, {
    minHistoryDays: MIN_HISTORY_DAYS,
    windowDays,
    currency,
  });

  return {
    productId,
    variantId: variantId || null,
    currency,
    daysTracked,
    trackingStartDate,
    stats,
    dailyPoints: filteredPoints,
    promotionPeriods,
    tag,
    qualifiesForChart: daysTracked >= MIN_HISTORY_DAYS,
  };
}

/**
 * Helper to generate authentic recorded price history over the past 90 days.
 * Seeds diverse products to test all tag states truthfully:
 * - t-1: Lowest price in 30 days (and variant history)
 * - t-2: Promotional sale period that ended (shows promo bands)
 * - t-3: Price unchanged for 30 days (same_for_days)
 * - t-4: Price increased recently (higher_than_usual)
 * - t-5: 20 days of data (< 30, >= 14) -> "Lowest price in 20 days"
 * - t-6: 5 days of data (< 14) -> neutral tracking started note, no chart
 */
function generateInitialSeedData(): PriceRecord[] {
  const records: PriceRecord[] = [];
  const now = new Date();

  const getDateStr = (daysAgo: number, hoursOffset: number = 0) => {
    const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 + hoursOffset * 60 * 60 * 1000);
    return d.toISOString();
  };

  // -------------------------------------------------------------------------
  // Product t-1: "Matte Keyboard 1" (Base price ₹24,900 / $249)
  // Tracked for 90 days. Was ₹24,900, dropped to ₹21,900 2 days ago -> "Lowest price in 30 days"
  // -------------------------------------------------------------------------
  // Initial catalog entry 90 days ago
  records.push({
    id: 'ph_t1_init',
    productId: 't-1',
    price: 24900,
    currency: 'INR',
    recordedAt: getDateStr(90),
    source: 'initial_record',
  });
  // Intraday flash event 45 days ago
  records.push({
    id: 'ph_t1_flash1',
    productId: 't-1',
    price: 22900,
    currency: 'INR',
    recordedAt: getDateStr(45, 2),
    source: 'promotion_start',
  });
  records.push({
    id: 'ph_t1_flash1_end',
    productId: 't-1',
    price: 24900,
    currency: 'INR',
    recordedAt: getDateStr(44, 18),
    source: 'promotion_end',
  });
  // Price dropped 3 days ago to 21900 -> New 30-day low!
  records.push({
    id: 'ph_t1_drop',
    productId: 't-1',
    price: 21900,
    currency: 'INR',
    recordedAt: getDateStr(3, 9),
    source: 'catalog_update',
  });

  // Variant v-1 ("Matte Black"): Same as base
  records.push({
    id: 'ph_t1_v1_init',
    productId: 't-1',
    variantId: 'Matte Black',
    price: 24900,
    currency: 'INR',
    recordedAt: getDateStr(90),
    source: 'initial_record',
  });
  records.push({
    id: 'ph_t1_v1_drop',
    productId: 't-1',
    variantId: 'Matte Black',
    price: 21900,
    currency: 'INR',
    recordedAt: getDateStr(3, 9),
    source: 'catalog_update',
  });

  // Variant v-2 ("Graphite"): Special edition, was ₹26,900, dropped to ₹23,900
  records.push({
    id: 'ph_t1_v2_init',
    productId: 't-1',
    variantId: 'Graphite',
    price: 26900,
    currency: 'INR',
    recordedAt: getDateStr(90),
    source: 'initial_record',
  });
  records.push({
    id: 'ph_t1_v2_drop',
    productId: 't-1',
    variantId: 'Graphite',
    price: 23900,
    currency: 'INR',
    recordedAt: getDateStr(5, 10),
    source: 'catalog_update',
  });

  // -------------------------------------------------------------------------
  // Product t-2: "Ceramic Earbuds" (Base ₹19,900)
  // Tracked for 45 days. Had a promotional sale between 25 and 15 days ago.
  // Currently restored to standard price ₹19,900.
  // -------------------------------------------------------------------------
  records.push({
    id: 'ph_t2_init',
    productId: 't-2',
    price: 19900,
    currency: 'INR',
    recordedAt: getDateStr(45),
    source: 'initial_record',
  });
  records.push({
    id: 'ph_t2_promo_start',
    productId: 't-2',
    price: 16900,
    currency: 'INR',
    recordedAt: getDateStr(25, 8),
    source: 'promotion_start',
  });
  records.push({
    id: 'ph_t2_promo_end',
    productId: 't-2',
    price: 19900,
    currency: 'INR',
    recordedAt: getDateStr(15, 20),
    source: 'promotion_end',
  });

  // -------------------------------------------------------------------------
  // Product t-3: "Monolith Over-Ears" (Base ₹34,900)
  // Tracked for 35 days. Completely flat, never changed.
  // -> "Price has stayed the same for 35 days"
  // -------------------------------------------------------------------------
  records.push({
    id: 'ph_t3_init',
    productId: 't-3',
    price: 34900,
    currency: 'INR',
    recordedAt: getDateStr(35),
    source: 'initial_record',
  });

  // -------------------------------------------------------------------------
  // Product t-4: "Tactile Smartwatch" (Base ₹49,900)
  // Tracked for 60 days. Was ₹42,900 until 7 days ago, now ₹49,900 (> 10% above average).
  // -> "Price is higher than usual"
  // -------------------------------------------------------------------------
  records.push({
    id: 'ph_t4_init',
    productId: 't-4',
    price: 42900,
    currency: 'INR',
    recordedAt: getDateStr(60),
    source: 'initial_record',
  });
  records.push({
    id: 'ph_t4_hike',
    productId: 't-4',
    price: 49900,
    currency: 'INR',
    recordedAt: getDateStr(7, 12),
    source: 'catalog_update',
  });

  // -------------------------------------------------------------------------
  // Product t-5: "Studio Monitor Hub" (Base ₹129,900)
  // Tracked for exactly 20 days. Dropped to ₹119,900 today.
  // -> "Lowest price in 20 days" (honoring strict rule: if only 20 days, say 20 days!)
  // -------------------------------------------------------------------------
  records.push({
    id: 'ph_t5_init',
    productId: 't-5',
    price: 129900,
    currency: 'INR',
    recordedAt: getDateStr(20),
    source: 'initial_record',
  });
  records.push({
    id: 'ph_t5_drop',
    productId: 't-5',
    price: 119900,
    currency: 'INR',
    recordedAt: getDateStr(0, 1),
    source: 'catalog_update',
  });

  // -------------------------------------------------------------------------
  // Product t-6: New product with only 6 days of history (< MIN_HISTORY_DAYS = 14)
  // -> No chart and neutral "Price tracking started on [date]"
  // -------------------------------------------------------------------------
  records.push({
    id: 'ph_t6_init',
    productId: 't-6',
    price: 15900,
    currency: 'INR',
    recordedAt: getDateStr(6),
    source: 'initial_record',
  });

  return records;
}
