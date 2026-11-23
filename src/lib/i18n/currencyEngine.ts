import {
  BASE_SETTLEMENT_CURRENCY,
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  getCurrencyConfig,
  getLocaleConfig,
  SUPPORTED_CURRENCIES,
  CurrencyConfig,
} from './config';
import { getTranslation } from './translations';

export interface ExchangeRateRecord {
  rates: Record<string, number>; // Base INR: 1 INR = rate * Target
  timestamp: number;
  source: string;
  marginBps: number; // Basis points margin, default 0
}

/**
 * Authoritative cached exchange rates with fallback to last known good rates
 */
const DEFAULT_RATES: Record<string, number> = SUPPORTED_CURRENCIES.reduce(
  (acc, c) => ({ ...acc, [c.code]: c.rateToBaseINR }),
  {}
);

let cachedRateRecord: ExchangeRateRecord = {
  rates: DEFAULT_RATES,
  timestamp: Date.now(),
  source: 'ECB_RBI_COMBINED_FEED',
  marginBps: 0,
};

const ONE_HOUR_MS = 60 * 60 * 1000;

export function getCachedRates(): ExchangeRateRecord {
  return cachedRateRecord;
}

export function updateExchangeRates(newRates: Record<string, number>, source: string = 'BACKEND_SERVICE') {
  cachedRateRecord = {
    rates: { ...cachedRateRecord.rates, ...newRates },
    timestamp: Date.now(),
    source,
    marginBps: 0,
  };
}

/**
 * Returns exchange rate from INR base to target currency.
 * Always falls back to last known good rate if unavailable.
 */
export function getExchangeRate(targetCurrency: string): number {
  const code = (targetCurrency || DEFAULT_CURRENCY).toUpperCase();
  if (code === BASE_SETTLEMENT_CURRENCY) return 1.0;
  return cachedRateRecord.rates[code] || DEFAULT_RATES[code] || 1.0;
}

/**
 * Converts integer minor units (paise) of base INR to minor units in target currency.
 * Respects decimal precision (0 for JPY, 3 for KWD, 2 for INR/USD/EUR).
 */
export function convertMinorUnits(
  baseMinorUnitsINR: number,
  targetCurrency: string
): { targetMinorUnits: number; targetMajorUnits: number } {
  const targetConfig = getCurrencyConfig(targetCurrency);
  const rate = getExchangeRate(targetCurrency);

  // 1 INR = 100 paise. Major base INR = baseMinorUnitsINR / 100
  const baseMajor = baseMinorUnitsINR / 100;
  const rawTargetMajor = baseMajor * rate;

  // Apply currency specific rounding
  const roundedMajor = applyCurrencyRounding(rawTargetMajor, targetCurrency);

  // Convert to minor units based on decimal precision
  const multiplier = Math.pow(10, targetConfig.minorUnits);
  const targetMinorUnits = Math.round(roundedMajor * multiplier);

  return {
    targetMinorUnits,
    targetMajorUnits: roundedMajor,
  };
}

/**
 * Centralized rounding rule applied uniformly across product card, cart, checkout, emails, and invoices.
 */
export function applyCurrencyRounding(
  rawMajor: number,
  currencyCode: string
): number {
  const config = getCurrencyConfig(currencyCode);

  if (config.minorUnits === 0 || config.roundingRule === 'whole') {
    return Math.round(rawMajor);
  }

  if (config.roundingRule === 'charm99') {
    return Math.floor(rawMajor) + 0.99;
  }

  if (config.roundingRule === 'step05') {
    return Math.round(rawMajor * 20) / 20;
  }

  // Standard rounding based on currency minor decimal digits
  const factor = Math.pow(10, config.minorUnits);
  return Math.round(rawMajor * factor) / factor;
}

/**
 * Memoized Intl.NumberFormat cache by `${locale}_${currency}_${minFrac}_${maxFrac}`
 */
const numberFormatCache = new Map<string, Intl.NumberFormat>();

export function getNumberFormatter(
  locale: string,
  currency: string,
  options?: Intl.NumberFormatOptions
): Intl.NumberFormat {
  const currConfig = getCurrencyConfig(currency);
  const minDigits = options?.minimumFractionDigits ?? (currConfig.minorUnits === 0 ? 0 : 2);
  const maxDigits = options?.maximumFractionDigits ?? currConfig.minorUnits;

  const key = `${locale}_${currency}_${minDigits}_${maxDigits}`;
  let formatter = numberFormatCache.get(key);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: minDigits,
        maximumFractionDigits: maxDigits,
        currencyDisplay: 'symbol',
        ...options,
      });
    } catch {
      formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      });
    }
    numberFormatCache.set(key, formatter);
  }
  return formatter;
}

export interface HonestPrice {
  /** The final display string, e.g. "₹2,499" or "Approx. $29.99" */
  formatted: string;
  /** Raw currency formatted amount without qualifier, e.g. "$29.99" */
  formattedAmount: string;
  /** Numeric major units in target currency */
  targetMajor: number;
  /** Integer minor units in target currency */
  targetMinor: number;
  /** Target currency code */
  currency: string;
  /** Whether the price is a native settlement price or converted estimate */
  isNative: boolean;
  isEstimate: boolean;
  /** Qualifier text, e.g. "Approx." or null */
  qualifier: string | null;
  /** Base price in INR minor units */
  baseMinorINR: number;
  /** Base price in INR major units */
  baseMajorINR: number;
  /** Base formatted string, e.g. "₹2,499" */
  formattedBaseINR: string;
  /** Honest checkout statement */
  settlementNotice: string;
  /** Tax disclaimer */
  taxLabel: string;
  /** Accessible spoken name for screen readers, ensuring unambiguous currency */
  accessibleLabel: string;
}

/**
 * Formats any price with complete honesty rules as specified in Prompt Section 4.
 *
 * @param baseAmountINR Amount in base INR (can be given as major e.g. 249 or minor e.g. 24900)
 * @param isMinorUnits Whether baseAmountINR is in minor units (paise). Defaults to true if >= 1000 and integer, or pass explicit flag.
 */
export function formatHonestPrice({
  baseAmountINR,
  isMinor = false,
  targetCurrency = DEFAULT_CURRENCY,
  locale = DEFAULT_LOCALE,
}: {
  baseAmountINR: number;
  isMinor?: boolean;
  targetCurrency?: string;
  locale?: string;
}): HonestPrice {
  const baseMinorINR = isMinor ? Math.round(baseAmountINR) : Math.round(baseAmountINR * 100);
  const baseMajorINR = baseMinorINR / 100;
  const currCode = (targetCurrency || DEFAULT_CURRENCY).toUpperCase();
  const currConfig = getCurrencyConfig(currCode);
  const isNative = currConfig.isSettlement; // true for INR
  const isEstimate = !isNative;

  // Convert to target currency
  const { targetMinorUnits, targetMajorUnits } = convertMinorUnits(baseMinorINR, currCode);

  // Format base in INR
  const baseFormatter = getNumberFormatter(locale, BASE_SETTLEMENT_CURRENCY);
  const formattedBaseINR = baseFormatter.format(baseMajorINR);

  // Format target amount
  const targetFormatter = getNumberFormatter(locale, currCode);
  const formattedAmount = targetFormatter.format(targetMajorUnits);

  // Qualifier for estimates
  const approxWord = getTranslation('pricing.approx', locale);
  const qualifier = isEstimate ? approxWord : null;
  const formatted = isEstimate ? `${approxWord} ${formattedAmount}` : formattedAmount;

  // Settlement statement
  const settlementNotice = isNative
    ? getTranslation('checkout.guarantee', locale)
    : `You'll be charged ${formattedBaseINR} in INR. Your bank may apply its own exchange rate.`;

  // Tax basis
  const taxLabel = currConfig.taxInclusive
    ? getTranslation('pricing.taxIncluded', locale)
    : getTranslation('pricing.taxExcluded', locale);

  // Accessible label: spells out currency code to avoid ambiguity (e.g. $ vs CA$ vs A$)
  const accessibleLabel = isEstimate
    ? `${approxWord} ${formattedAmount} ${currConfig.name}`
    : `${formattedAmount} ${currConfig.name}`;

  return {
    formatted,
    formattedAmount,
    targetMajor: targetMajorUnits,
    targetMinor: targetMinorUnits,
    currency: currCode,
    isNative,
    isEstimate,
    qualifier,
    baseMinorINR,
    baseMajorINR,
    formattedBaseINR,
    settlementNotice,
    taxLabel,
    accessibleLabel,
  };
}

/**
 * Checks whether an EMI plan can be offered for a currency.
 * EMI and pay-later are only offered where the lender supports the currency and region (INR).
 */
export function isEmiSupportedForCurrency(currencyCode: string): boolean {
  return (currencyCode || DEFAULT_CURRENCY).toUpperCase() === 'INR';
}

/**
 * Wishlist Price-Drop Calculator:
 * Price-drop and history logic runs on the base currency (INR) and only displays in the chosen one!
 * This prevents false "price drop" claims caused by exchange rate movements!
 */
export function calculateHonestPriceDrop({
  currentBasePriceINR,
  savedBasePriceINR,
  targetCurrency,
  locale,
}: {
  currentBasePriceINR: number;
  savedBasePriceINR: number;
  targetCurrency: string;
  locale: string;
}): { hasPriceDrop: boolean; percentage: number; badgeText: string | null } {
  if (!savedBasePriceINR || savedBasePriceINR <= currentBasePriceINR) {
    return { hasPriceDrop: false, percentage: 0, badgeText: null };
  }

  // Calculate percentage purely based on authoritative INR base price!
  const diff = savedBasePriceINR - currentBasePriceINR;
  const percentage = Math.round((diff / savedBasePriceINR) * 100);

  if (percentage < 3) {
    return { hasPriceDrop: false, percentage, badgeText: null };
  }

  const badgeText = getTranslation('pricing.priceDropNotice', locale, { percent: percentage });
  return {
    hasPriceDrop: true,
    percentage,
    badgeText,
  };
}
