/**
 * Merchant Payment and Gateways Configuration
 * Config-driven brand acceptance, CSP directives, and provider settings.
 */

import { ExtendedCardBrandId, MerchantPaymentConfig } from './types';
import { CARD_BRAND_DEFINITIONS } from './cardBrands';

export const DEFAULT_MERCHANT_CONFIG: MerchantPaymentConfig = {
  acceptedBrands: ['visa', 'mastercard', 'amex', 'rupay'] as const,
  require3DSecure: true,
  supportCoBadgedSelection: true,
  gatewayProvider: 'stripe',
};

/**
 * Checks if a detected brand is accepted by this merchant.
 * If brand is 'unknown', we treat it as potentially acceptable (never block unknown prefix).
 */
export function isBrandAccepted(
  brand: ExtendedCardBrandId,
  config: MerchantPaymentConfig = DEFAULT_MERCHANT_CONFIG
): boolean {
  if (brand === 'unknown') return true;
  return config.acceptedBrands.includes(brand);
}

/**
 * Generates a calm, informative message when an unsupported brand is detected.
 */
export function getUnsupportedBrandMessage(brand: ExtendedCardBrandId): string | null {
  if (brand === 'unknown') return null;
  const meta = CARD_BRAND_DEFINITIONS[brand];
  const brandName = meta ? meta.name : brand;
  return `We don't accept ${brandName} cards. Try another card or UPI.`;
}

/**
 * Strict Content Security Policy (CSP) directives for Payment Gateways.
 * Enforces SAQ A requirement: provider scripts and iframes must load only from official origins.
 */
export const PAYMENT_CSP_DIRECTIVES = {
  'script-src': [
    "'self'",
    'https://js.stripe.com',
    'https://checkout.razorpay.com',
    'https://api.razorpay.com',
  ],
  'frame-src': [
    "'self'",
    'https://js.stripe.com',
    'https://hooks.stripe.com',
    'https://api.razorpay.com',
  ],
  'connect-src': [
    "'self'",
    'https://api.stripe.com',
    'https://l.stripe.com',
    'https://api.razorpay.com',
  ],
} as const;

/**
 * Builds standard CSP header string from payment gateway directives.
 */
export function buildPaymentCspHeader(): string {
  return Object.entries(PAYMENT_CSP_DIRECTIVES)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}
