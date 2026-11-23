import { LocaleConfig, LOCALES } from './config';

export interface MarketReadinessGate {
  translationCompleteness: number; // Percentage, e.g. 100% for tier 1
  legalReviewed: boolean;
  paymentMethodsAvailable: string[];
  taxComplianceVerified: boolean;
  localizedAddressSchema: boolean;
  localizedCustomerSupport: boolean;
  localizedEmailSms: boolean;
  seoHreflangConfigured: boolean;
}

export const MARKET_READINESS_REGISTRY: Record<string, MarketReadinessGate> = {
  'en-IN': {
    translationCompleteness: 100,
    legalReviewed: true,
    paymentMethodsAvailable: ['UPI', 'Cards', 'NetBanking', 'COD', 'EMI'],
    taxComplianceVerified: true, // GST compliant
    localizedAddressSchema: true, // Pincode, State, City
    localizedCustomerSupport: true,
    localizedEmailSms: true,
    seoHreflangConfigured: true,
  },
  'hi-IN': {
    translationCompleteness: 100,
    legalReviewed: true,
    paymentMethodsAvailable: ['UPI', 'Cards', 'NetBanking', 'COD', 'EMI'],
    taxComplianceVerified: true,
    localizedAddressSchema: true,
    localizedCustomerSupport: true,
    localizedEmailSms: true,
    seoHreflangConfigured: true,
  },
  'kn-IN': {
    translationCompleteness: 100,
    legalReviewed: true,
    paymentMethodsAvailable: ['UPI', 'Cards', 'NetBanking', 'COD', 'EMI'],
    taxComplianceVerified: true,
    localizedAddressSchema: true,
    localizedCustomerSupport: true,
    localizedEmailSms: true,
    seoHreflangConfigured: true,
  },
  'ta-IN': {
    translationCompleteness: 100,
    legalReviewed: true,
    paymentMethodsAvailable: ['UPI', 'Cards', 'NetBanking', 'COD', 'EMI'],
    taxComplianceVerified: true,
    localizedAddressSchema: true,
    localizedCustomerSupport: true,
    localizedEmailSms: true,
    seoHreflangConfigured: true,
  },
  'de-DE': {
    translationCompleteness: 72,
    legalReviewed: false, // Pending Impressum & Widerrufsbelehrung review
    paymentMethodsAvailable: ['SEPA', 'Klarna', 'Cards', 'PayPal'],
    taxComplianceVerified: false,
    localizedAddressSchema: true,
    localizedCustomerSupport: false,
    localizedEmailSms: false,
    seoHreflangConfigured: true,
  },
  'ja-JP': {
    translationCompleteness: 65,
    legalReviewed: false,
    paymentMethodsAvailable: ['Konbini', 'PayPay', 'Cards'],
    taxComplianceVerified: false,
    localizedAddressSchema: true, // Postal code first, prefecture, city, street
    localizedCustomerSupport: false,
    localizedEmailSms: false,
    seoHreflangConfigured: true,
  },
  'ar-AE': {
    translationCompleteness: 68,
    legalReviewed: false,
    paymentMethodsAvailable: ['Cards', 'ApplePay', 'Mada'],
    taxComplianceVerified: false,
    localizedAddressSchema: false,
    localizedCustomerSupport: false,
    localizedEmailSms: false,
    seoHreflangConfigured: true,
  },
};

export function canEnableLocale(localeCode: string): { canEnable: boolean; reasons: string[] } {
  const gate = MARKET_READINESS_REGISTRY[localeCode];
  if (!gate) {
    return {
      canEnable: false,
      reasons: ['No market readiness audit recorded for locale: ' + localeCode],
    };
  }

  const reasons: string[] = [];
  if (gate.translationCompleteness < 95) {
    reasons.push(`Translation completeness is ${gate.translationCompleteness}% (requires >= 95%)`);
  }
  if (!gate.legalReviewed) {
    reasons.push('Legal counsel review incomplete for country-specific terms and consumer rights');
  }
  if (!gate.taxComplianceVerified) {
    reasons.push('Tax compliance (VAT/GST/Sales tax) and invoice regulations unverified');
  }
  if (!gate.localizedCustomerSupport) {
    reasons.push('Customer support channel in target language is not yet staffed');
  }
  if (!gate.localizedEmailSms) {
    reasons.push('Transactional email and SMS notification templates not fully translated');
  }
  if (gate.paymentMethodsAvailable.length === 0) {
    reasons.push('No localized payment methods configured for target market');
  }

  return {
    canEnable: reasons.length === 0,
    reasons,
  };
}
