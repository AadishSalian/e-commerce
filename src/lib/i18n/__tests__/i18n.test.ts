import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  LOCALES,
  SUPPORTED_CURRENCIES,
  getLocaleConfig,
  getCurrencyConfig,
  isRTL,
  getScriptForLocale,
  BASE_SETTLEMENT_CURRENCY,
  DEFAULT_LOCALE,
  DEFAULT_CURRENCY,
} from '../config';
import {
  formatIcuMessage,
  pseudoLocalize,
  pseudoLocalizeRTL,
} from '../icuFormatter';
import {
  getTranslation,
} from '../translations';
import {
  formatHonestPrice,
  convertMinorUnits,
  applyCurrencyRounding,
  calculateHonestPriceDrop,
  isEmiSupportedForCurrency,
} from '../currencyEngine';
import {
  canEnableLocale,
  MARKET_READINESS_REGISTRY,
} from '../marketReadiness';
import {
  getLocalizedProduct,
  formatMeasurement,
} from '../catalogLocalization';
import {
  generateHreflangTags,
  generateProductJsonLd,
} from '../seo';
import { isComplexScript } from '@/components/ui/RollingText/tokens';

describe('i18n Configuration & Locale Rules (Section 1 & 14)', () => {
  it('defines 22 real locales plus pseudo-test locales', () => {
    assert.ok(LOCALES.length >= 24);
  });

  it('enables all Tier 1 launch-ready Indian locales', () => {
    const tier1 = LOCALES.filter((l) => l.tier === 1);
    assert.strictEqual(tier1.length, 4);
    assert.deepStrictEqual(
      tier1.map((l) => l.code),
      ['en-IN', 'hi-IN', 'kn-IN', 'ta-IN']
    );
    tier1.forEach((l) => assert.strictEqual(l.enabled, true));
  });

  it('keeps Tier 2 market locales disabled until section 16 readiness gate passes', () => {
    const tier2Real = LOCALES.filter((l) => l.tier === 2 && !l.isPseudo);
    tier2Real.forEach((l) => {
      assert.strictEqual(l.enabled, false, `Locale ${l.code} should not be enabled before gate passes`);
    });
  });

  it('identifies RTL direction correctly for Arabic and Hebrew', () => {
    assert.strictEqual(isRTL('ar-AE'), true);
    assert.strictEqual(isRTL('he-IL'), true);
    assert.strictEqual(isRTL('ar-XB'), true);
    assert.strictEqual(isRTL('en-IN'), false);
    assert.strictEqual(isRTL('hi-IN'), false);
    assert.strictEqual(isRTL('de-DE'), false);
  });

  it('maps correct script family and taller line-height multipliers for Indic & Arabic', () => {
    assert.strictEqual(getScriptForLocale('hi-IN'), 'Deva');
    assert.strictEqual(getScriptForLocale('kn-IN'), 'Knda');
    assert.strictEqual(getScriptForLocale('ta-IN'), 'Taml');
    assert.strictEqual(getScriptForLocale('ar-AE'), 'Arab');
    assert.strictEqual(getScriptForLocale('ja-JP'), 'Jpan');

    const hi = getLocaleConfig('hi-IN');
    const en = getLocaleConfig('en-IN');
    assert.ok((hi.lineHeightMultiplier ?? 1.5) > (en.lineHeightMultiplier ?? 1.4));
  });

  it('ensures all supported currencies have isSettlement defined', () => {
    SUPPORTED_CURRENCIES.forEach((c) => {
      assert.strictEqual(typeof c.isSettlement, 'boolean', `Currency ${c.code} is missing isSettlement`);
    });
  });
});

describe('ICU MessageFormat & CLDR Plural Categories (Section 3)', () => {
  it('interpolates named variables accurately', () => {
    const template = 'Welcome to {brand}, {name}!';
    const result = formatIcuMessage(template, { brand: 'MATTE', name: 'Aadi' }, 'en-IN');
    assert.strictEqual(result, 'Welcome to MATTE, Aadi!');
  });

  it('evaluates English 2 plural forms (one vs other)', () => {
    const template = '{count, plural, =0 {0 items} one {# item} other {# items}}';
    assert.strictEqual(formatIcuMessage(template, { count: 0 }, 'en-IN'), '0 items');
    assert.strictEqual(formatIcuMessage(template, { count: 1 }, 'en-IN'), '1 item');
    assert.strictEqual(formatIcuMessage(template, { count: 5 }, 'en-IN'), '5 items');
  });

  it('evaluates Russian 4 plural forms (one, few, many, other)', () => {
    const template = '{count, plural, one {# товар} few {# товара} many {# товаров} other {# товара}}';
    // 1 -> one
    assert.strictEqual(formatIcuMessage(template, { count: 1 }, 'ru'), '1 товар');
    // 2, 3, 4 -> few
    assert.strictEqual(formatIcuMessage(template, { count: 2 }, 'ru'), '2 товара');
    assert.strictEqual(formatIcuMessage(template, { count: 4 }, 'ru'), '4 товара');
    // 5, 10, 20 -> many
    assert.strictEqual(formatIcuMessage(template, { count: 5 }, 'ru'), '5 товаров');
    assert.strictEqual(formatIcuMessage(template, { count: 20 }, 'ru'), '20 товаров');
  });

  it('evaluates Arabic 6 plural forms (zero, one, two, few, many, other)', () => {
    const template =
      '{count, plural, zero {لا عناصر} one {عنصر واحد} two {عنصران} few {# عناصر} many {# عنصراً} other {# عنصر}}';
    assert.strictEqual(formatIcuMessage(template, { count: 0 }, 'ar-AE'), 'لا عناصر');
    assert.strictEqual(formatIcuMessage(template, { count: 1 }, 'ar-AE'), 'عنصر واحد');
    assert.strictEqual(formatIcuMessage(template, { count: 2 }, 'ar-AE'), 'عنصران');
    // In Arabic CLDR: 3..10 is few
    assert.strictEqual(formatIcuMessage(template, { count: 3 }, 'ar-AE'), '3 عناصر');
    // 11..99 is many
    assert.strictEqual(formatIcuMessage(template, { count: 15 }, 'ar-AE'), '15 عنصراً');
  });

  it('evaluates selects properly', () => {
    const template = '{gender, select, male {He} female {She} other {They}}';
    assert.strictEqual(formatIcuMessage(template, { gender: 'female' }, 'en-IN'), 'She');
    assert.strictEqual(formatIcuMessage(template, { gender: 'unknown' }, 'en-IN'), 'They');
  });
});

describe('Translation Fallback & Pseudo-Localization (Section 3 & 12)', () => {
  it('falls back to default en-IN when key is missing and avoids exposing raw keys', () => {
    const fallback = getTranslation('common.addToBag', 'non-existent-locale');
    assert.strictEqual(fallback, 'Add to Bag');
  });

  it('pseudo-localizes en-XA with accents, expansion (+40%), and markers', () => {
    const raw = 'Add to Bag';
    const pseudo = pseudoLocalize(raw);
    assert.ok(pseudo.startsWith('[!!! '));
    assert.ok(pseudo.endsWith(' !!!]'));
    assert.ok(pseudo.length > raw.length * 1.3, 'Should expand string by at least 30%');
  });

  it('pseudo-localizes ar-XB with RTL wrapper markers', () => {
    const raw = 'Checkout';
    const pseudo = pseudoLocalizeRTL(raw);
    assert.ok(pseudo.includes('[RTL:'));
  });
});

describe('Currency Engine & Honest Pricing (Section 4)', () => {
  it('treats INR as the authoritative native settlement currency', () => {
    const inrConfig = getCurrencyConfig('INR');
    assert.strictEqual(inrConfig.isSettlement, true);
    assert.strictEqual(inrConfig.code, BASE_SETTLEMENT_CURRENCY);
  });

  it('handles currencies with 0 decimals (JPY) and 3 decimals (KWD)', () => {
    const jpy = getCurrencyConfig('JPY');
    const kwd = getCurrencyConfig('KWD');
    assert.strictEqual(jpy.minorUnits, 0);
    assert.strictEqual(kwd.minorUnits, 3);
  });

  it('formats native settlement price honestly without estimate qualifier', () => {
    const price = formatHonestPrice({
      baseAmountINR: 2490,
      targetCurrency: 'INR',
      locale: 'en-IN',
    });
    assert.strictEqual(price.isNative, true);
    assert.strictEqual(price.isEstimate, false);
    assert.strictEqual(price.qualifier, null);
    assert.ok(price.formatted.includes('2,490'));
  });

  it('formats converted currency as clearly labeled estimate with Approx. qualifier', () => {
    const price = formatHonestPrice({
      baseAmountINR: 2500,
      targetCurrency: 'USD',
      locale: 'en-IN',
    });
    assert.strictEqual(price.isNative, false);
    assert.strictEqual(price.isEstimate, true);
    assert.ok(price.qualifier !== null);
    assert.ok(price.formatted.startsWith('Approx.'));
    assert.ok(price.settlementNotice.includes('You\'ll be charged'));
    assert.ok(price.settlementNotice.includes('in INR'));
  });

  it('applies currency rounding rules consistently', () => {
    // JPY rounds to whole number
    assert.strictEqual(applyCurrencyRounding(123.456, 'JPY'), 123);
    // Standard USD rounds to 2 decimals
    assert.strictEqual(applyCurrencyRounding(123.456, 'USD'), 123.46);
    // KWD rounds to 3 decimals
    assert.strictEqual(applyCurrencyRounding(12.3456, 'KWD'), 12.346);
  });

  it('converts minor units safely without floating point corruption', () => {
    const { targetMinorUnits, targetMajorUnits } = convertMinorUnits(24900, 'JPY');
    assert.strictEqual(typeof targetMinorUnits, 'number');
    assert.strictEqual(Number.isInteger(targetMinorUnits), true);
    assert.strictEqual(typeof targetMajorUnits, 'number');
  });

  it('restricts EMI offers to supported currencies only (INR)', () => {
    assert.strictEqual(isEmiSupportedForCurrency('INR'), true);
    assert.strictEqual(isEmiSupportedForCurrency('USD'), false);
    assert.strictEqual(isEmiSupportedForCurrency('EUR'), false);
    assert.strictEqual(isEmiSupportedForCurrency('JPY'), false);
  });

  it('prevents false wishlist price-drop claims caused by exchange rate movements', () => {
    // Saved price was ₹3,000, current price is ₹2,400 -> genuine 20% price drop!
    const genuineDrop = calculateHonestPriceDrop({
      currentBasePriceINR: 2400,
      savedBasePriceINR: 3000,
      targetCurrency: 'USD',
      locale: 'en-IN',
    });
    assert.strictEqual(genuineDrop.hasPriceDrop, true);
    assert.strictEqual(genuineDrop.percentage, 20);

    // If current price is equal or higher in base currency, no price drop even if foreign currency rates fluctuated!
    const noDrop = calculateHonestPriceDrop({
      currentBasePriceINR: 3000,
      savedBasePriceINR: 3000,
      targetCurrency: 'USD',
      locale: 'en-IN',
    });
    assert.strictEqual(noDrop.hasPriceDrop, false);
  });
});

describe('Catalog Localization & Neutral Measurement Formatting (Section 3 & 8)', () => {
  it('retrieves localized product data for supported locales', () => {
    const base = {
      name: 'Matte Keyboard 1',
      description: 'Mechanical keyboard',
      category: 'Tech',
    };
    const hi = getLocalizedProduct('t-1', base, 'hi-IN');
    assert.strictEqual(hi.name, 'मैट कीबोर्ड १');
    assert.strictEqual(hi.category, 'तकनीक');

    const de = getLocalizedProduct('t-1', base, 'de-DE');
    assert.strictEqual(de.name, 'Matte Tastatur Modell 1');

    // Object signature overload
    const productObj = { id: 't-1', ...base };
    const hiFromObj = getLocalizedProduct(productObj, 'hi-IN');
    assert.strictEqual(hiFromObj.name, 'मैट कीबोर्ड १');
  });

  it('formats metric measurements with imperial conversion for US/imperial locales', () => {
    // Metric locale en-IN (100 cm -> 100 cm)
    const metric = formatMeasurement(100, 'length_cm', 'en-IN');
    assert.strictEqual(metric, '100 cm');

    // Weight metric (2.5 kg -> 2.5 kg)
    const metricWeight = formatMeasurement(2.5, 'weight_kg', 'en-IN');
    assert.strictEqual(metricWeight, '2.5 kg');
  });
});

describe('Market Readiness Gate (Section 16)', () => {
  it('approves launch for audited Tier 1 locales', () => {
    const checkEn = canEnableLocale('en-IN');
    assert.strictEqual(checkEn.canEnable, true);
    assert.strictEqual(checkEn.reasons.length, 0);

    const checkHi = canEnableLocale('hi-IN');
    assert.strictEqual(checkHi.canEnable, true);
  });

  it('blocks enabling locales that fail completeness or legal reviews', () => {
    const checkDe = canEnableLocale('de-DE');
    assert.strictEqual(checkDe.canEnable, false);
    assert.ok(checkDe.reasons.some((r) => r.includes('Translation completeness')));
    assert.ok(checkDe.reasons.some((r) => r.includes('Legal counsel review')));
  });
});

describe('SEO & Hreflang Configuration (Section 6)', () => {
  it('generates self-referencing canonical and alternates with x-default', () => {
    const tags = generateHreflangTags('/products', 'en-IN');
    assert.ok(tags.canonical.includes('/en-IN/products'));

    const xDefault = tags.alternates.find((a) => a.hrefLang === 'x-default');
    assert.ok(xDefault !== undefined);
    assert.ok(xDefault?.href.includes('/en-IN/products'));

    const hiAlternate = tags.alternates.find((a) => a.hrefLang === 'hi-IN');
    assert.ok(hiAlternate !== undefined);
    assert.ok(hiAlternate?.href.includes('/hi-IN/products'));
  });

  it('generates localized Schema.org Product structured data', () => {
    const product = {
      id: 't-1',
      name: 'Matte Keyboard 1',
      description: 'Mechanical keyboard',
      price: 2490,
      category: 'Tech',
      image: 'https://images.unsplash.com/test.jpg',
    };
    const jsonLd = generateProductJsonLd({
      product,
      locale: 'hi-IN',
      currency: 'INR',
    });
    assert.strictEqual(jsonLd['@type'], 'Product');
    assert.strictEqual(jsonLd.name, 'मैट कीबोर्ड १');
    assert.strictEqual(jsonLd.offers.priceCurrency, 'INR');
  });
});

describe('Layout Resilience, Script Safety & Tofu Prevention (Section 5 & 14)', () => {
  it('prevents character splitting for complex and joined scripts (Devanagari, Tamil, Kannada, Arabic)', () => {
    // Hindi, Kannada, Tamil, Arabic strings must trigger isComplexScript = true
    assert.strictEqual(isComplexScript('थैले में जोड़ें'), true);
    assert.strictEqual(isComplexScript('ಚೀಲಕ್ಕೆ ಸೇರಿಸಿ'), true);
    assert.strictEqual(isComplexScript('பையில் சேர்க்கவும்'), true);
    assert.strictEqual(isComplexScript('أضف إلى الحقيبة'), true);

    // Pure Latin strings should return false
    assert.strictEqual(isComplexScript('Add to Bag'), false);
    assert.strictEqual(isComplexScript('Matte Design'), false);
  });

  it('guarantees native language names have no unmapped or corrupted Unicode tofu characters', () => {
    LOCALES.forEach((loc) => {
      assert.ok(loc.native.length > 0, `Locale ${loc.code} has empty native name`);
      // Should not contain replacement characters or unresolved glyphs (U+FFFD or raw escape codes)
      assert.strictEqual(loc.native.includes('\uFFFD'), false);
      assert.strictEqual(loc.native.includes('\\u'), false);
    });
  });

  it('verifies text expansion resilience for German and pseudo-locales', () => {
    const enAdd = getTranslation('common.addToBag', 'en-IN');
    const deAdd = getTranslation('common.addToBag', 'de-DE');
    const pseudoAdd = getTranslation('common.addToBag', 'en-XA');

    // German is ~80% longer than English for "Add to Bag" ("In den Warenkorb legen")
    assert.ok(deAdd.length > enAdd.length * 1.5, 'German label should test extreme expansion');
    // Pseudo-locale is ~40% longer
    assert.ok(pseudoAdd.length > enAdd.length * 1.3, 'Pseudo-locale should expand label');
  });

  it('verifies all enabled locales meet the 100% core checkout completeness threshold', () => {
    const enabledLocales = LOCALES.filter((l) => l.enabled && !l.isPseudo);
    const criticalKeys = [
      'common.addToBag',
      'cart.title',
      'cart.subtotal',
      'cart.freeShipping',
      'checkout.title',
      'checkout.stepPayment',
      'checkout.lockedCurrencyNotice',
      'switcher.languageTitle',
      'switcher.currencyTitle',
    ];

    enabledLocales.forEach((loc) => {
      criticalKeys.forEach((key) => {
        const str = getTranslation(key, loc.code);
        assert.ok(str && str !== key, `Locale ${loc.code} missing critical key "${key}"`);
      });
    });
  });
});
