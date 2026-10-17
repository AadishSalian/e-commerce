/**
 * Free Shipping Configuration & Currency Standards
 *
 * Merchandise Subtotal Calculation Rule:
 * The free-shipping threshold evaluates strictly against the net merchandise subtotal
 * (i.e. gross product item total minus item-level and promotional order discounts).
 * It MUST explicitly exclude:
 *   1. Shipping fees and delivery surcharges
 *   2. Applicable sales taxes, VAT, or GST
 *   3. Gift cards and store credit redemptions
 *
 * This guarantees that promotional discounts reduce the qualifying threshold,
 * preventing margin compression and ensuring shoppers reach the genuine
 * merchandise spend requirement before unlocking complimentary delivery.
 */

// Central configuration threshold (default ₹1,999)
export const FREE_SHIPPING_THRESHOLD: number = 
  Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD) || 1999;

export const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || 'INR';
export const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_LOCALE || 'en-IN';

/**
 * Convert floating-point currency amount to integer minor units (paise / cents)
 * to prevent IEEE 754 precision mismatches during threshold comparisons.
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert integer minor units back to standard decimal currency.
 */
export function fromMinorUnits(minorUnits: number): number {
  return minorUnits / 100;
}

/**
 * Format currency amount with Intl.NumberFormat according to active locale and currency.
 */
export function formatCurrency(
  amount: number,
  locale: string = DEFAULT_LOCALE,
  currency: string = DEFAULT_CURRENCY
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Check if the destination address/pincode is eligible for free shipping.
 * Excludes remote territories or specific non-serviceable postal codes.
 */
export function isShippingEligible(pincode?: string, country?: string): boolean {
  if (!pincode) return true;
  // Specific remote island/special logistics zones not covered by standard free delivery
  const remotePincodePrefixes = ['744', '682'];
  const cleaned = pincode.trim();
  return !remotePincodePrefixes.some((prefix) => cleaned.startsWith(prefix));
}
/**
 * Standard delivery fee charged when the order subtotal is below the free shipping threshold.
 */
export const STANDARD_SHIPPING_FEE: number = 
  Number(process.env.NEXT_PUBLIC_STANDARD_SHIPPING_FEE) || 99;
