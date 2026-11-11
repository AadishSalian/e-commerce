import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  detectCardBrand,
  CARD_BRAND_DEFINITIONS,
  CARD_BRAND_TABLE_LAST_UPDATED,
} from '../cardBrands';
import { isBrandAccepted, getUnsupportedBrandMessage, DEFAULT_MERCHANT_CONFIG } from '../config';

describe('Card Brand Detection: Specifications & Refresh Dating', () => {
  it('has a clearly dated specification source for regulatory review', () => {
    assert.match(CARD_BRAND_TABLE_LAST_UPDATED, /^202[0-9]-[0-1][0-9]-[0-3][0-9]$/);
  });

  it('provides complete metadata for all 8 major card brands', () => {
    const brands = [
      'visa',
      'mastercard',
      'amex',
      'rupay',
      'discover',
      'diners',
      'jcb',
      'unionpay',
    ] as const;

    for (const brand of brands) {
      const meta = CARD_BRAND_DEFINITIONS[brand];
      assert.ok(meta, `Metadata missing for brand ${brand}`);
      assert.ok(meta.name.length > 0);
      assert.ok(meta.lengths.length > 0);
      assert.ok(meta.grouping.length > 0);
      assert.ok(['CVV', 'CVC', 'CID', 'CVN'].includes(meta.securityCodeName));
      assert.ok([3, 4].includes(meta.securityCodeLength));
      assert.ok(['front', 'back'].includes(meta.securityCodeLocation));
    }
  });
});

describe('Card Brand Detection: Range Boundaries & Progressive Disambiguation', () => {
  // 1. Visa boundary tests (Prefix 4)
  it('identifies Visa uniquely starting with 4', () => {
    assert.strictEqual(detectCardBrand('4').brand, 'visa');
    assert.strictEqual(detectCardBrand('4242').brand, 'visa');
    assert.strictEqual(detectCardBrand('4999999999999').brand, 'visa');
  });

  // 2. Mastercard boundary tests (51-55, 2221-2720)
  it('identifies Mastercard 51-55 range and 2221-2720 2-series range', () => {
    // 51 boundary
    assert.strictEqual(detectCardBrand('51').brand, 'mastercard');
    assert.strictEqual(detectCardBrand('52').brand, 'mastercard');
    assert.strictEqual(detectCardBrand('53').brand, 'mastercard');
    assert.strictEqual(detectCardBrand('54').brand, 'mastercard');
    assert.strictEqual(detectCardBrand('55').brand, 'mastercard');

    // 2-series boundaries: 2221 to 2720
    assert.strictEqual(detectCardBrand('2221').brand, 'mastercard');
    assert.strictEqual(detectCardBrand('2500').brand, 'mastercard');
    assert.strictEqual(detectCardBrand('2720').brand, 'mastercard');

    // Outside 2-series
    assert.strictEqual(detectCardBrand('2220').brand, 'unknown');
    assert.strictEqual(detectCardBrand('2721').brand, 'unknown');
  });

  // 3. American Express boundary tests (34, 37)
  it('identifies American Express uniquely on 34 and 37', () => {
    assert.strictEqual(detectCardBrand('34').brand, 'amex');
    assert.strictEqual(detectCardBrand('37').brand, 'amex');
    assert.strictEqual(detectCardBrand('378282246310005').brand, 'amex');
  });

  // 4. RuPay boundary tests (60, 65, 81, 82, 508)
  it('identifies RuPay on 60xx, 81, 82, and 508', () => {
    assert.strictEqual(detectCardBrand('81').brand, 'rupay');
    assert.strictEqual(detectCardBrand('82').brand, 'rupay');
    assert.strictEqual(detectCardBrand('508').brand, 'rupay');
    // 6080 is RuPay (6011 is Discover)
    assert.strictEqual(detectCardBrand('6080').brand, 'rupay');
    assert.strictEqual(detectCardBrand('6071').brand, 'rupay');
  });

  // 5. Discover boundary tests (6011, 644-649, 65)
  it('identifies Discover on 6011 and 644-649', () => {
    assert.strictEqual(detectCardBrand('6011').brand, 'discover');
    assert.strictEqual(detectCardBrand('644').brand, 'discover');
    assert.strictEqual(detectCardBrand('645').brand, 'discover');
    assert.strictEqual(detectCardBrand('649').brand, 'discover');
    assert.strictEqual(detectCardBrand('643').brand, 'unknown');
    assert.strictEqual(detectCardBrand('660').brand, 'unknown');
  });

  // 6. Diners Club boundary tests (300-305, 36, 38, 39)
  it('identifies Diners Club on 300-305, 36, 38, and 39', () => {
    assert.strictEqual(detectCardBrand('300').brand, 'diners');
    assert.strictEqual(detectCardBrand('305').brand, 'diners');
    assert.strictEqual(detectCardBrand('306').brand, 'unknown');
    assert.strictEqual(detectCardBrand('36').brand, 'diners');
    assert.strictEqual(detectCardBrand('38').brand, 'diners');
    assert.strictEqual(detectCardBrand('39').brand, 'diners');
  });

  // 7. JCB boundary tests (3528-3589)
  it('identifies JCB on 3528 to 3589', () => {
    assert.strictEqual(detectCardBrand('3528').brand, 'jcb');
    assert.strictEqual(detectCardBrand('3550').brand, 'jcb');
    assert.strictEqual(detectCardBrand('3589').brand, 'jcb');
    assert.strictEqual(detectCardBrand('3527').brand, 'unknown');
    assert.strictEqual(detectCardBrand('3590').brand, 'unknown');
  });

  // 8. UnionPay boundary tests (62)
  it('identifies UnionPay on 62', () => {
    assert.strictEqual(detectCardBrand('62').brand, 'unionpay');
    assert.strictEqual(detectCardBrand('6200').brand, 'unionpay');
  });
});

describe('Card Brand Detection: Ambiguity, Overlaps & Anti-Flicker Protection', () => {
  it('keeps brand unknown and flags ambiguous for single digit "3"', () => {
    const result = detectCardBrand('3');
    assert.strictEqual(result.brand, 'unknown');
    assert.strictEqual(result.isAmbiguous, true);
    assert.ok(result.possibleBrands.includes('amex'));
    assert.ok(result.possibleBrands.includes('diners'));
    assert.ok(result.possibleBrands.includes('jcb'));
  });

  it('keeps brand unknown and flags ambiguous for single digit "6"', () => {
    const result = detectCardBrand('6');
    assert.strictEqual(result.brand, 'unknown');
    assert.strictEqual(result.isAmbiguous, true);
    assert.ok(result.possibleBrands.includes('discover'));
    assert.ok(result.possibleBrands.includes('rupay'));
    assert.ok(result.possibleBrands.includes('unionpay'));
  });

  it('keeps brand unknown for single digit "5" (could be MC or RuPay 508)', () => {
    const result = detectCardBrand('5');
    assert.strictEqual(result.brand, 'unknown');
    assert.strictEqual(result.isAmbiguous, true);
    assert.ok(result.possibleBrands.includes('mastercard'));
    assert.ok(result.possibleBrands.includes('rupay'));
  });

  it('handles "60" prefix disambiguation between Discover (6011) and RuPay (60xx)', () => {
    // "60" is ambiguous
    const at60 = detectCardBrand('60');
    assert.strictEqual(at60.brand, 'unknown');
    assert.strictEqual(at60.isAmbiguous, true);

    // "601" is still ambiguous (could become 6011)
    const at601 = detectCardBrand('601');
    assert.strictEqual(at601.brand, 'unknown');
    assert.strictEqual(at601.isAmbiguous, true);

    // "6011" uniquely resolves to Discover
    assert.strictEqual(detectCardBrand('6011').brand, 'discover');

    // "6080" uniquely resolves to RuPay
    assert.strictEqual(detectCardBrand('6080').brand, 'rupay');
  });

  it('handles shared "65" overlap (RuPay & Discover) with co-badging options', () => {
    const result = detectCardBrand('65');
    assert.ok(result.coBadgedOptions?.includes('rupay'));
    assert.ok(result.coBadgedOptions?.includes('discover'));

    // Allows shopper preference override
    const withPref = detectCardBrand('65', 'discover');
    assert.strictEqual(withPref.brand, 'discover');
  });

  it('returns unknown without blocking for unrecognizable prefixes (e.g. 7, 9)', () => {
    const result7 = detectCardBrand('70001234');
    assert.strictEqual(result7.brand, 'unknown');
    assert.strictEqual(result7.isAmbiguous, false);

    const result9 = detectCardBrand('99991234');
    assert.strictEqual(result9.brand, 'unknown');
    assert.strictEqual(result9.isAmbiguous, false);
  });
});

describe('Card Brand Detection: Acceptance Configuration & Messaging', () => {
  it('accepts configured default merchant brands (Visa, MC, Amex, RuPay)', () => {
    assert.strictEqual(isBrandAccepted('visa', DEFAULT_MERCHANT_CONFIG), true);
    assert.strictEqual(isBrandAccepted('mastercard', DEFAULT_MERCHANT_CONFIG), true);
    assert.strictEqual(isBrandAccepted('amex', DEFAULT_MERCHANT_CONFIG), true);
    assert.strictEqual(isBrandAccepted('rupay', DEFAULT_MERCHANT_CONFIG), true);
  });

  it('never blocks unknown brands at detection level', () => {
    assert.strictEqual(isBrandAccepted('unknown', DEFAULT_MERCHANT_CONFIG), true);
  });

  it('identifies unsupported brands and generates calm, specific guidance', () => {
    assert.strictEqual(isBrandAccepted('diners', DEFAULT_MERCHANT_CONFIG), false);
    const msg = getUnsupportedBrandMessage('diners');
    assert.strictEqual(msg, "We don't accept Diners Club cards. Try another card or UPI.");
  });
});
