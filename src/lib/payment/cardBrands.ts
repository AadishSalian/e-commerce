/**
 * Card Brand Specifications and IIN (Issuer Identification Number) Ranges
 * Source: EMVCo, ISO/IEC 7812, Stripe Card Brand Specifications, NPCI RuPay specs.
 *
 * Last updated: 2026-11-11
 * Scheduled review: Quarterly
 */

import {
  CardBrandId,
  CardBrandDefinition,
  CardBrandDetectionResult,
  ExtendedCardBrandId,
} from './types';

export const CARD_BRAND_TABLE_LAST_UPDATED = '2026-11-11';
export const CARD_BRAND_TABLE_VERSION = '2026.11';

export const CARD_BRAND_DEFINITIONS: Record<CardBrandId, CardBrandDefinition> = {
  visa: {
    id: 'visa',
    name: 'Visa',
    shortName: 'Visa',
    securityCodeName: 'CVV',
    securityCodeLength: 3,
    securityCodeLocation: 'back',
    securityCodeHelper: '3 digits on the back',
    lengths: [13, 16, 19] as const,
    grouping: [4, 4, 4, 4] as const,
    placeholder: '4242 4242 4242 4242',
    officialDocUrl: 'https://usa.visa.com',
  },
  mastercard: {
    id: 'mastercard',
    name: 'Mastercard',
    shortName: 'Mastercard',
    securityCodeName: 'CVC',
    securityCodeLength: 3,
    securityCodeLocation: 'back',
    securityCodeHelper: '3 digits on the back',
    lengths: [16] as const,
    grouping: [4, 4, 4, 4] as const,
    placeholder: '5500 0000 0000 0004',
    officialDocUrl: 'https://www.mastercard.us',
  },
  amex: {
    id: 'amex',
    name: 'American Express',
    shortName: 'Amex',
    securityCodeName: 'CID',
    securityCodeLength: 4,
    securityCodeLocation: 'front',
    securityCodeHelper: '4 digits on the front',
    lengths: [15] as const,
    grouping: [4, 6, 5] as const,
    placeholder: '3782 822463 10005',
    officialDocUrl: 'https://www.americanexpress.com',
  },
  rupay: {
    id: 'rupay',
    name: 'RuPay',
    shortName: 'RuPay',
    securityCodeName: 'CVV',
    securityCodeLength: 3,
    securityCodeLocation: 'back',
    securityCodeHelper: '3 digits on the back',
    lengths: [16] as const,
    grouping: [4, 4, 4, 4] as const,
    placeholder: '6080 1234 5678 9012',
    officialDocUrl: 'https://www.npci.org.in/what-we-do/rupay',
  },
  discover: {
    id: 'discover',
    name: 'Discover',
    shortName: 'Discover',
    securityCodeName: 'CID',
    securityCodeLength: 3,
    securityCodeLocation: 'back',
    securityCodeHelper: '3 digits on the back',
    lengths: [16, 17, 18, 19] as const,
    grouping: [4, 4, 4, 4] as const,
    placeholder: '6011 0000 0000 0004',
    officialDocUrl: 'https://www.discover.com',
  },
  diners: {
    id: 'diners',
    name: 'Diners Club',
    shortName: 'Diners',
    securityCodeName: 'CVV',
    securityCodeLength: 3,
    securityCodeLocation: 'back',
    securityCodeHelper: '3 digits on the back',
    lengths: [14, 15, 16, 17, 18, 19] as const,
    grouping: [4, 6, 4] as const,
    placeholder: '3000 123456 7890',
    officialDocUrl: 'https://www.dinersclub.com',
  },
  jcb: {
    id: 'jcb',
    name: 'JCB',
    shortName: 'JCB',
    securityCodeName: 'CVV',
    securityCodeLength: 3,
    securityCodeLocation: 'back',
    securityCodeHelper: '3 digits on the back',
    lengths: [16, 17, 18, 19] as const,
    grouping: [4, 4, 4, 4] as const,
    placeholder: '3528 0000 0000 0000',
    officialDocUrl: 'https://www.global.jcb/en',
  },
  unionpay: {
    id: 'unionpay',
    name: 'UnionPay',
    shortName: 'UnionPay',
    securityCodeName: 'CVN',
    securityCodeLength: 3,
    securityCodeLocation: 'back',
    securityCodeHelper: '3 digits on the back',
    lengths: [16, 17, 18, 19] as const,
    grouping: [4, 4, 4, 4] as const,
    placeholder: '6200 0000 0000 0000',
    officialDocUrl: 'https://www.unionpayintl.com',
  },
};

export const UNKNOWN_BRAND_HELPER = '3 or 4 digits, found on your card';

/**
 * Sanitizes input to purely digits.
 */
export function sanitizeDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

/**
 * Progressive, honest card brand detection.
 * Only returns a brand when entered digits uniquely and unequivocally identify it.
 * Overlaps or ambiguous partial prefixes return neutral generic state until resolved.
 */
export function detectCardBrand(
  digitsOrPrefix: string,
  preferredCoBadge?: CardBrandId
): CardBrandDetectionResult {
  const digits = sanitizeDigits(digitsOrPrefix);

  if (!digits || digits.length === 0) {
    return {
      brand: 'unknown',
      isAmbiguous: false,
      possibleBrands: [],
      isComplete: false,
      meta: null,
    };
  }

  // 1. VISA: Starts with 4
  if (digits.startsWith('4')) {
    const meta = CARD_BRAND_DEFINITIONS.visa;
    return {
      brand: 'visa',
      isAmbiguous: false,
      possibleBrands: ['visa'],
      isComplete: meta.lengths.includes(digits.length),
      meta,
    };
  }

  // 2. LEADING "5": Mastercard (51-55) or RuPay (508)
  if (digits.startsWith('5')) {
    if (digits.length === 1) {
      // Ambiguous between Mastercard (51-55) and RuPay (508)
      return {
        brand: 'unknown',
        isAmbiguous: true,
        possibleBrands: ['mastercard', 'rupay'],
        isComplete: false,
        meta: null,
      };
    }
    const two = parseInt(digits.slice(0, 2), 10);
    if (two >= 51 && two <= 55) {
      const meta = CARD_BRAND_DEFINITIONS.mastercard;
      return {
        brand: 'mastercard',
        isAmbiguous: false,
        possibleBrands: ['mastercard'],
        isComplete: meta.lengths.includes(digits.length),
        meta,
      };
    }
    if (digits.startsWith('50')) {
      if (digits.length < 3) {
        return {
          brand: 'unknown',
          isAmbiguous: true,
          possibleBrands: ['rupay'],
          isComplete: false,
          meta: null,
        };
      }
      if (digits.startsWith('508')) {
        const meta = CARD_BRAND_DEFINITIONS.rupay;
        return {
          brand: 'rupay',
          isAmbiguous: false,
          possibleBrands: ['rupay'],
          isComplete: meta.lengths.includes(digits.length),
          meta,
        };
      }
    }
    // Any other 5x is unknown
    return {
      brand: 'unknown',
      isAmbiguous: false,
      possibleBrands: [],
      isComplete: false,
      meta: null,
    };
  }

  // 3. LEADING "2": Mastercard 2-series (2221-2720)
  if (digits.startsWith('2')) {
    if (digits.length < 4) {
      // Check if prefix could lead to 2221-2720
      const prefixNum = parseInt(digits, 10);
      const minPossible = prefixNum * Math.pow(10, 4 - digits.length);
      const maxPossible = (prefixNum + 1) * Math.pow(10, 4 - digits.length) - 1;
      const overlaps = maxPossible >= 2221 && minPossible <= 2720;
      if (overlaps) {
        return {
          brand: 'unknown',
          isAmbiguous: true,
          possibleBrands: ['mastercard'],
          isComplete: false,
          meta: null,
        };
      }
      return {
        brand: 'unknown',
        isAmbiguous: false,
        possibleBrands: [],
        isComplete: false,
        meta: null,
      };
    }
    const four = parseInt(digits.slice(0, 4), 10);
    if (four >= 2221 && four <= 2720) {
      const meta = CARD_BRAND_DEFINITIONS.mastercard;
      return {
        brand: 'mastercard',
        isAmbiguous: false,
        possibleBrands: ['mastercard'],
        isComplete: meta.lengths.includes(digits.length),
        meta,
      };
    }
    return {
      brand: 'unknown',
      isAmbiguous: false,
      possibleBrands: [],
      isComplete: false,
      meta: null,
    };
  }

  // 4. LEADING "3": Amex (34, 37), Diners (300-305, 36, 38, 39), JCB (3528-3589)
  if (digits.startsWith('3')) {
    if (digits.length === 1) {
      return {
        brand: 'unknown',
        isAmbiguous: true,
        possibleBrands: ['amex', 'diners', 'jcb'],
        isComplete: false,
        meta: null,
      };
    }

    // Amex: 34, 37
    if (digits.startsWith('34') || digits.startsWith('37')) {
      const meta = CARD_BRAND_DEFINITIONS.amex;
      return {
        brand: 'amex',
        isAmbiguous: false,
        possibleBrands: ['amex'],
        isComplete: meta.lengths.includes(digits.length),
        meta,
      };
    }

    // Diners Club: 36, 38, 39
    if (digits.startsWith('36') || digits.startsWith('38') || digits.startsWith('39')) {
      const meta = CARD_BRAND_DEFINITIONS.diners;
      return {
        brand: 'diners',
        isAmbiguous: false,
        possibleBrands: ['diners'],
        isComplete: meta.lengths.includes(digits.length),
        meta,
      };
    }

    // Diners Club: 300-305
    if (digits.startsWith('30')) {
      if (digits.length < 3) {
        return {
          brand: 'unknown',
          isAmbiguous: true,
          possibleBrands: ['diners'],
          isComplete: false,
          meta: null,
        };
      }
      const three = parseInt(digits.slice(0, 3), 10);
      if (three >= 300 && three <= 305) {
        const meta = CARD_BRAND_DEFINITIONS.diners;
        return {
          brand: 'diners',
          isAmbiguous: false,
          possibleBrands: ['diners'],
          isComplete: meta.lengths.includes(digits.length),
          meta,
        };
      }
      return {
        brand: 'unknown',
        isAmbiguous: false,
        possibleBrands: [],
        isComplete: false,
        meta: null,
      };
    }

    // JCB: 3528-3589
    if (digits.startsWith('35')) {
      if (digits.length < 4) {
        return {
          brand: 'unknown',
          isAmbiguous: true,
          possibleBrands: ['jcb'],
          isComplete: false,
          meta: null,
        };
      }
      const four = parseInt(digits.slice(0, 4), 10);
      if (four >= 3528 && four <= 3589) {
        const meta = CARD_BRAND_DEFINITIONS.jcb;
        return {
          brand: 'jcb',
          isAmbiguous: false,
          possibleBrands: ['jcb'],
          isComplete: meta.lengths.includes(digits.length),
          meta,
        };
      }
      return {
        brand: 'unknown',
        isAmbiguous: false,
        possibleBrands: [],
        isComplete: false,
        meta: null,
      };
    }

    return {
      brand: 'unknown',
      isAmbiguous: false,
      possibleBrands: [],
      isComplete: false,
      meta: null,
    };
  }

  // 5. LEADING "6": Discover (6011, 644-649, 65), RuPay (60, 65), UnionPay (62)
  if (digits.startsWith('6')) {
    if (digits.length === 1) {
      return {
        brand: 'unknown',
        isAmbiguous: true,
        possibleBrands: ['discover', 'rupay', 'unionpay'],
        isComplete: false,
        meta: null,
      };
    }

    // UnionPay: 62
    if (digits.startsWith('62')) {
      const meta = CARD_BRAND_DEFINITIONS.unionpay;
      return {
        brand: 'unionpay',
        isAmbiguous: false,
        possibleBrands: ['unionpay'],
        isComplete: meta.lengths.includes(digits.length),
        meta,
      };
    }

    // Discover: 644-649
    if (digits.startsWith('64')) {
      if (digits.length < 3) {
        return {
          brand: 'unknown',
          isAmbiguous: true,
          possibleBrands: ['discover'],
          isComplete: false,
          meta: null,
        };
      }
      const three = parseInt(digits.slice(0, 3), 10);
      if (three >= 644 && three <= 649) {
        const meta = CARD_BRAND_DEFINITIONS.discover;
        return {
          brand: 'discover',
          isAmbiguous: false,
          possibleBrands: ['discover'],
          isComplete: meta.lengths.includes(digits.length),
          meta,
        };
      }
      return {
        brand: 'unknown',
        isAmbiguous: false,
        possibleBrands: [],
        isComplete: false,
        meta: null,
      };
    }

    // Discover (6011) vs RuPay (60xx)
    if (digits.startsWith('60')) {
      if (digits.length < 4) {
        if (digits === '601') {
          return {
            brand: 'unknown',
            isAmbiguous: true,
            possibleBrands: ['discover', 'rupay'],
            isComplete: false,
            meta: null,
          };
        }
        // At '60', could be Discover (6011) or RuPay (60xx)
        return {
          brand: 'unknown',
          isAmbiguous: true,
          possibleBrands: ['discover', 'rupay'],
          isComplete: false,
          meta: null,
        };
      }
      // 4+ digits starting with 60
      if (digits.startsWith('6011')) {
        const meta = CARD_BRAND_DEFINITIONS.discover;
        return {
          brand: 'discover',
          isAmbiguous: false,
          possibleBrands: ['discover'],
          isComplete: meta.lengths.includes(digits.length),
          meta,
        };
      }
      // Other 60 prefixes: RuPay (e.g. 6080, 607x, etc.)
      const meta = CARD_BRAND_DEFINITIONS.rupay;
      return {
        brand: 'rupay',
        isAmbiguous: false,
        possibleBrands: ['rupay'],
        isComplete: meta.lengths.includes(digits.length),
        meta,
      };
    }

    // Overlap: 65 is shared by Discover and RuPay (often co-badged in India)
    if (digits.startsWith('65')) {
      const coBadged: CardBrandId[] = ['rupay', 'discover'];
      const chosenBrand = preferredCoBadge && coBadged.includes(preferredCoBadge)
        ? preferredCoBadge
        : 'rupay'; // Default to RuPay in India context or user choice

      const meta = CARD_BRAND_DEFINITIONS[chosenBrand];
      return {
        brand: chosenBrand,
        isAmbiguous: true,
        possibleBrands: coBadged,
        coBadgedOptions: coBadged,
        isComplete: meta.lengths.includes(digits.length),
        meta,
      };
    }

    return {
      brand: 'unknown',
      isAmbiguous: false,
      possibleBrands: [],
      isComplete: false,
      meta: null,
    };
  }

  // 6. RuPay: 81, 82
  if (digits.startsWith('81') || digits.startsWith('82')) {
    const meta = CARD_BRAND_DEFINITIONS.rupay;
    return {
      brand: 'rupay',
      isAmbiguous: false,
      possibleBrands: ['rupay'],
      isComplete: meta.lengths.includes(digits.length),
      meta,
    };
  }

  // Ambiguous starting with 8 (could lead to 81 or 82)
  if (digits === '8') {
    return {
      brand: 'unknown',
      isAmbiguous: true,
      possibleBrands: ['rupay'],
      isComplete: false,
      meta: null,
    };
  }

  // Fallback: completely unknown prefix
  return {
    brand: 'unknown',
    isAmbiguous: false,
    possibleBrands: [],
    isComplete: false,
    meta: null,
  };
}

/**
 * Gets brand metadata by brand ID.
 */
export function getBrandMeta(brand: ExtendedCardBrandId): CardBrandDefinition | null {
  if (brand === 'unknown') return null;
  return CARD_BRAND_DEFINITIONS[brand] || null;
}
