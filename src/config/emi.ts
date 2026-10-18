import { Lender, PayLaterOption } from '@/lib/emi/types';

/**
 * Global EMI Configurations
 */
export const EMI_MIN_AMOUNT = 
  Number(process.env.NEXT_PUBLIC_EMI_MIN_AMOUNT) || 3000;

export const EMI_MAX_AMOUNT = 
  Number(process.env.NEXT_PUBLIC_EMI_MAX_AMOUNT) || 1000000;

export const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || 'INR';
export const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_LOCALE || 'en-IN';

/**
 * Category-specific Tenure Configurations
 * Target categories: Electronics (Tech) and Furniture (Home & Furniture)
 */
export interface CategoryEmiConfig {
  tenures: number[];
  defaultTenure: number;
  minAmount?: number;
  maxDownPaymentPercentage: number;
}

export const CATEGORY_EMI_CONFIGS: Record<string, CategoryEmiConfig> = {
  // Electronics / Tech
  Tech: {
    tenures: [3, 6, 9, 12, 18],
    defaultTenure: 6,
    minAmount: 1000,
    maxDownPaymentPercentage: 50,
  },
  Electronics: {
    tenures: [3, 6, 9, 12, 18],
    defaultTenure: 6,
    minAmount: 1000,
    maxDownPaymentPercentage: 50,
  },
  // Furniture (allows longer tenures for high-ticket home goods)
  'Home & Furniture': {
    tenures: [3, 6, 9, 12, 18, 24, 36],
    defaultTenure: 12,
    minAmount: 1000,
    maxDownPaymentPercentage: 50,
  },
  Furniture: {
    tenures: [3, 6, 9, 12, 18, 24, 36],
    defaultTenure: 12,
    minAmount: 1000,
    maxDownPaymentPercentage: 50,
  },
  // Default fallback for any other qualifying merchandise
  Default: {
    tenures: [3, 6, 9, 12, 18, 24],
    defaultTenure: 6,
    minAmount: EMI_MIN_AMOUNT,
    maxDownPaymentPercentage: 50,
  },
};

export function getCategoryEmiConfig(category?: string): CategoryEmiConfig {
  if (!category) return CATEGORY_EMI_CONFIGS.Default;
  const match = Object.keys(CATEGORY_EMI_CONFIGS).find(
    (key) => key.toLowerCase() === category.trim().toLowerCase()
  );
  return match ? CATEGORY_EMI_CONFIGS[match] : CATEGORY_EMI_CONFIGS.Default;
}

/**
 * Check if a product category is an eligible high-ticket EMI target
 */
export function isEmiCategory(category?: string): boolean {
  if (!category) return false;
  const lower = category.toLowerCase();
  return (
    lower.includes('tech') ||
    lower.includes('electronic') ||
    lower.includes('furniture') ||
    lower.includes('home')
  );
}

/**
 * Dynamic Lender Configurations
 * Real-world bank & provider rates, fees, card types, and No-Cost availability
 */
export const EMI_LENDERS: Lender[] = [
  {
    id: 'hdfc-cc',
    name: 'HDFC Bank Credit Card',
    shortName: 'HDFC Bank',
    cardType: 'credit',
    minAmount: 3000,
    processingFee: 199,
    processingFeeGstRate: 0.18,
    rates: {
      3: { annualRate: 0, isNoCost: true, discountOffset: true },
      6: { annualRate: 0, isNoCost: true, discountOffset: true },
      9: { annualRate: 13.5, isNoCost: false },
      12: { annualRate: 14.0, isNoCost: false },
      18: { annualRate: 15.0, isNoCost: false },
      24: { annualRate: 15.5, isNoCost: false },
      36: { annualRate: 16.0, isNoCost: false },
    },
    eligibilityDescription: 'Available for HDFC Visa/Mastercard/RuPay credit cards',
    isEligible: (amount) => {
      if (amount < 3000) {
        return { eligible: false, reason: 'Requires minimum order of ₹3,000' };
      }
      return { eligible: true };
    },
  },
  {
    id: 'icici-cc',
    name: 'ICICI Bank Credit Card',
    shortName: 'ICICI Bank',
    cardType: 'credit',
    minAmount: 3000,
    processingFee: 199,
    processingFeeGstRate: 0.18,
    rates: {
      3: { annualRate: 0, isNoCost: true, discountOffset: true },
      6: { annualRate: 0, isNoCost: true, discountOffset: true },
      9: { annualRate: 13.0, isNoCost: false },
      12: { annualRate: 13.5, isNoCost: false },
      18: { annualRate: 14.5, isNoCost: false },
      24: { annualRate: 15.0, isNoCost: false },
      36: { annualRate: 15.5, isNoCost: false },
    },
    eligibilityDescription: 'Available for ICICI Bank credit cards',
    isEligible: (amount) => {
      if (amount < 3000) {
        return { eligible: false, reason: 'Requires minimum order of ₹3,000' };
      }
      return { eligible: true };
    },
  },
  {
    id: 'axis-cc',
    name: 'Axis Bank Credit Card',
    shortName: 'Axis Bank',
    cardType: 'credit',
    minAmount: 2500,
    processingFee: 199,
    processingFeeGstRate: 0.18,
    rates: {
      3: { annualRate: 0, isNoCost: true, discountOffset: true },
      6: { annualRate: 12.5, isNoCost: false },
      9: { annualRate: 13.5, isNoCost: false },
      12: { annualRate: 14.0, isNoCost: false },
      18: { annualRate: 15.0, isNoCost: false },
      24: { annualRate: 15.5, isNoCost: false },
      36: { annualRate: 16.0, isNoCost: false },
    },
    eligibilityDescription: 'Axis Bank credit card with instant online authorization',
    isEligible: (amount) => {
      if (amount < 2500) {
        return { eligible: false, reason: 'Requires minimum order of ₹2,500' };
      }
      return { eligible: true };
    },
  },
  {
    id: 'sbi-cc',
    name: 'SBI Card (Credit)',
    shortName: 'SBI Card',
    cardType: 'credit',
    minAmount: 3000,
    processingFee: 99,
    processingFeeGstRate: 0.18,
    rates: {
      3: { annualRate: 13.0, isNoCost: false },
      6: { annualRate: 13.5, isNoCost: false },
      9: { annualRate: 14.0, isNoCost: false },
      12: { annualRate: 14.5, isNoCost: false },
      18: { annualRate: 15.0, isNoCost: false },
      24: { annualRate: 15.5, isNoCost: false },
      36: { annualRate: 16.0, isNoCost: false },
    },
    eligibilityDescription: 'State Bank of India credit cards',
    isEligible: (amount) => {
      if (amount < 3000) {
        return { eligible: false, reason: 'Requires minimum order of ₹3,000' };
      }
      return { eligible: true };
    },
  },
  {
    id: 'kotak-cc',
    name: 'Kotak Mahindra Credit Card',
    shortName: 'Kotak Bank',
    cardType: 'credit',
    minAmount: 3000,
    processingFee: 199,
    processingFeeGstRate: 0.18,
    rates: {
      3: { annualRate: 0, isNoCost: true, discountOffset: true },
      6: { annualRate: 13.0, isNoCost: false },
      9: { annualRate: 13.5, isNoCost: false },
      12: { annualRate: 14.0, isNoCost: false },
      18: { annualRate: 14.5, isNoCost: false },
      24: { annualRate: 15.0, isNoCost: false },
    },
    eligibilityDescription: 'Valid for Kotak credit cardholders',
    isEligible: (amount) => {
      if (amount < 3000) {
        return { eligible: false, reason: 'Requires minimum order of ₹3,000' };
      }
      return { eligible: true };
    },
  },
  {
    id: 'onecard-fintech',
    name: 'OneCard Metallic Credit Card',
    shortName: 'OneCard',
    cardType: 'credit',
    minAmount: 1500,
    processingFee: 0, // Zero processing fee!
    processingFeeGstRate: 0,
    rates: {
      3: { annualRate: 0, isNoCost: true, discountOffset: true },
      6: { annualRate: 0, isNoCost: true, discountOffset: true },
      9: { annualRate: 12.0, isNoCost: false },
      12: { annualRate: 13.0, isNoCost: false },
      18: { annualRate: 14.0, isNoCost: false },
    },
    eligibilityDescription: 'Zero processing fee for all OneCard members',
    isEligible: (amount) => {
      if (amount < 1500) {
        return { eligible: false, reason: 'Requires minimum order of ₹1,500' };
      }
      return { eligible: true };
    },
  },
  {
    id: 'hdfc-dc',
    name: 'HDFC Bank Debit Card EMI',
    shortName: 'HDFC Debit',
    cardType: 'debit',
    minAmount: 5000, // Debit card EMI threshold is higher
    processingFee: 199,
    processingFeeGstRate: 0.18,
    rates: {
      3: { annualRate: 15.0, isNoCost: false },
      6: { annualRate: 15.5, isNoCost: false },
      9: { annualRate: 16.0, isNoCost: false },
      12: { annualRate: 16.0, isNoCost: false },
    },
    eligibilityDescription: 'Pre-approved HDFC debit cardholders with SMS confirmation',
    isEligible: (amount) => {
      if (amount < 5000) {
        return { eligible: false, reason: 'Requires minimum cart of ₹5,000 for Debit Card EMI' };
      }
      return { eligible: true };
    },
  },
  {
    id: 'icici-dc',
    name: 'ICICI Bank Debit Card EMI',
    shortName: 'ICICI Debit',
    cardType: 'debit',
    minAmount: 5000,
    processingFee: 199,
    processingFeeGstRate: 0.18,
    rates: {
      3: { annualRate: 15.0, isNoCost: false },
      6: { annualRate: 15.5, isNoCost: false },
      9: { annualRate: 16.0, isNoCost: false },
      12: { annualRate: 16.0, isNoCost: false },
    },
    eligibilityDescription: 'Pre-approved ICICI debit card customers only',
    isEligible: (amount) => {
      if (amount < 5000) {
        return { eligible: false, reason: 'Requires minimum cart of ₹5,000 for Debit Card EMI' };
      }
      return { eligible: true };
    },
  },
];

/**
 * Pay-Later Options (Section 4)
 */
export const PAY_LATER_OPTIONS: PayLaterOption[] = [
  {
    id: 'pl-15',
    title: 'Pay Later — 15 Days',
    provider: 'Simpl / Lazypay Partner',
    tenureDays: 15,
    fee: 0,
    lateFeeTerms: 'No fee if settled within 15 days. ₹50 flat late charge thereafter.',
    minAmount: 500,
    maxAmount: 25000,
    eligibilityNote: 'Subject to approval based on phone number credit record',
  },
  {
    id: 'pl-30',
    title: 'Pay Later — 30 Days',
    provider: 'Zest / Capital Partner',
    tenureDays: 30,
    fee: 0,
    lateFeeTerms: 'Interest-free for 30 days. Standard late penal interest applies after due date.',
    minAmount: 1000,
    maxAmount: 40000,
    eligibilityNote: 'Instant digital KYC & credit assessment required',
  },
];

export const FINANCIAL_DISCLOSURE_TEXT =
  'EMI availability is subject to lender approval and your card/credit eligibility. Rates and fees are shown by the lender.';

export const LEGAL_DISCLAIMER_NOTE =
  'Financial disclosure: EMI terms shown are indicative and subject to lender partner approval and card issuer policies.';
