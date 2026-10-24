import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAutoFitText,
  formatMonogramText,
  buildZoneTransformCss
} from '../math';
import {
  validateCharInput,
  sanitizePersonalizationText,
  checkContentModeration,
  validatePersonalization,
  detectAmbiguousCharacters,
  formatSpelledOutText
} from '../validation';
import { generateProductionAssetSpec } from '../production';
import { SEED_ENGRAVING_ZONES, ENGRAVING_FONTS } from '../data';
import { PersonalizationCartProperty } from '../types';

describe('Personalization: Coordinate Transforms & Math', () => {
  const zone = SEED_ENGRAVING_ZONES[0]; // Wallet zone with rotation & skew

  it('correctly constructs CSS transform string for angled zones', () => {
    const css = buildZoneTransformCss(zone);
    assert.ok(css.includes('rotate(-1.5deg)'));
    assert.ok(css.includes('skewX(1deg)'));
    assert.ok(css.includes('skewY(-0.5deg)'));
  });

  it('returns "none" when zone has zero rotation and skew', () => {
    const flatZone = {
      ...zone,
      geometry: { ...zone.geometry, rotation: 0, skewX: 0, skewY: 0, perspective: undefined }
    };
    const css = buildZoneTransformCss(flatZone);
    assert.equal(css, 'none');
  });
});

describe('Personalization: Auto-fit Algorithm', () => {
  const zone = SEED_ENGRAVING_ZONES[0];
  const font = ENGRAVING_FONTS.find((f) => f.id === 'classic-serif')!;

  it('selects large font size for short text within max_size limits', () => {
    const res = calculateAutoFitText(['ANYA'], zone, font, 500, 200);
    assert.equal(res.fits, true);
    assert.ok(res.fontSize >= 30, `Expected font size >= 30, got ${res.fontSize}`);
    assert.ok(res.fontSize <= font.max_size);
  });

  it('shrinks font size down towards min_size as text length increases', () => {
    // In a compact 220px zone box, short text fits at max_size (42) while 12-char text must shrink
    const shortRes = calculateAutoFitText(['ANYA'], zone, font, 220, 100);
    const longRes = calculateAutoFitText(['ALEXANDER H.'], zone, font, 220, 100);

    assert.equal(shortRes.fits, true);
    assert.equal(longRes.fits, true);
    assert.ok(longRes.fontSize < shortRes.fontSize, `Expected ${longRes.fontSize} < ${shortRes.fontSize}`);
  });

  it('halts and returns fits=false when text overflows minimum bounds', () => {
    const overflowRes = calculateAutoFitText(
      ['THIS IS AN EXTREMELY LONG INSCRIPTION THAT CANNOT FIT ON A SMALL LEATHER WALLET ZONE AT ALL'],
      zone,
      font,
      200,
      100
    );

    assert.equal(overflowRes.fits, false);
    assert.equal(overflowRes.overflowMessage, 'That’s the most that fits on this side');
  });
});

describe('Personalization: Monogram Layouts', () => {
  it('formats traditional monogram with prominent center initial', () => {
    // "JFK" -> First: J (0.72x), Center Last: K (1.35x), Middle: F (0.72x)
    const mono = formatMonogramText('JFK', 'traditional');
    assert.equal(mono.layout, 'traditional');
    assert.equal(mono.letters.length, 3);
    assert.equal(mono.letters[0].char, 'J');
    assert.equal(mono.letters[1].char, 'F'); // In JFK string: [1] is center
    assert.ok(mono.letters[1].scale > mono.letters[0].scale, 'Center letter should be larger');
  });

  it('formats vertical stacked layout into newline-separated text', () => {
    const mono = formatMonogramText('ABC', 'stacked');
    assert.equal(mono.layout, 'stacked');
    assert.equal(mono.displayText, 'A\nB\nC');
  });

  it('formats single letter monogram', () => {
    const mono = formatMonogramText('H', 'single');
    assert.equal(mono.layout, 'single');
    assert.equal(mono.letters[0].char, 'H');
  });
});

describe('Personalization: Validation, Normalization & Safety', () => {
  const zone = SEED_ENGRAVING_ZONES[0];

  it('normalizes Unicode NFC and strips zero-width & control characters', () => {
    const inputWithZeroWidth = 'A\u200Bny\u200Ca\uFEFF';
    const cleaned = sanitizePersonalizationText(inputWithZeroWidth);
    assert.equal(cleaned, 'Anya');
  });

  it('strips dangerous HTML markup', () => {
    const htmlInput = '<script>alert("hack")</script>Anya';
    const cleaned = sanitizePersonalizationText(htmlInput);
    assert.equal(cleaned, 'alert("hack")Anya');
    assert.ok(!cleaned.includes('<script>'));
  });

  it('blocks emojis with friendly clear notification', () => {
    const check = validateCharInput('😊', zone);
    assert.equal(check.isAllowed, false);
    assert.ok(check.errorMessage?.includes('Emojis cannot be engraved'));
  });

  it('blocks non-supported complex scripts (Arabic, Devanagari, Cyrillic)', () => {
    const arabicCheck = validateCharInput('ع', zone);
    assert.equal(arabicCheck.isAllowed, false);
    assert.ok(arabicCheck.errorMessage?.includes('Arabic script is not supported'));

    const devanagariCheck = validateCharInput('क', zone);
    assert.equal(devanagariCheck.isAllowed, false);
    assert.ok(devanagariCheck.errorMessage?.includes('Devanagari script is not supported'));
  });

  it('allows valid Latin characters, punctuation, and curated symbols', () => {
    const validLetters = ['A', 'z', '4', '.', '-', '•', '♥', '✦'];
    for (const char of validLetters) {
      const check = validateCharInput(char, zone);
      assert.equal(check.isAllowed, true, `Character "${char}" should be allowed`);
    }
  });

  it('enforces character limits per line and flags length errors', () => {
    const longLine = '12345678901234567890'; // 20 chars, max is 12
    const result = validatePersonalization([longLine], zone);
    assert.equal(result.isValid, false);
    assert.ok(result.issues.some((i) => i.field === 'length'));
  });
});

describe('Personalization: Content Moderation Engine', () => {
  it('flags prohibited hate speech and vulgarity', () => {
    const flagged1 = checkContentModeration('fuck');
    assert.equal(flagged1.isSafe, false);

    const flagged2 = checkContentModeration('whitepower');
    assert.equal(flagged2.isSafe, false);
  });

  it('approves legitimate names and celebratory inscriptions', () => {
    const safeInputs = [
      'Alexander',
      'Sophia & Liam',
      'EST. 2026',
      'Ad Astra',
      'Forever Yours'
    ];
    for (const text of safeInputs) {
      const check = checkContentModeration(text);
      assert.equal(check.isSafe, true, `Text "${text}" should be approved`);
    }
  });
});

describe('Personalization: Ambiguity Checker & Spelling Assistant', () => {
  it('flags ambiguous characters (0 vs O, 1 vs l, 5 vs S)', () => {
    const matches = detectAmbiguousCharacters('0O1l5S');
    assert.equal(matches.length, 6);
    assert.equal(matches[0].explanation, 'Digit Zero (0)');
    assert.equal(matches[1].explanation, 'Capital Letter O');
    assert.equal(matches[2].explanation, 'Digit One (1)');
    assert.equal(matches[3].explanation, 'Lowercase L (l)');
  });

  it('formats spelled-out text cleanly for spelling confirmation', () => {
    const spelled = formatSpelledOutText('A N Y A');
    assert.equal(spelled, 'A - ␣ - N - ␣ - Y - ␣ - A');
  });
});

describe('Personalization: Production Vector Spec Generator', () => {
  const zone = SEED_ENGRAVING_ZONES[0];
  const prop: PersonalizationCartProperty = {
    isPersonalized: true,
    lines: ['ALEXANDER'],
    formattedText: 'ALEXANDER',
    font_id: 'classic-serif',
    font_label: 'Classic Serif',
    alignment: 'center',
    zone_id: zone.zone_id,
    zone_name: zone.name,
    finish_style: zone.finish_style,
    price_addon: zone.price_addon,
    price_addon_dollars: zone.price_addon / 100,
    lead_time_days: zone.lead_time_days,
    returnable: false
  };

  it('generates complete physical geometry in millimeters and valid SVG vector spec', () => {
    const spec = generateProductionAssetSpec(prop, zone, 'a-1', 'Cognac');

    assert.equal(spec.product_id, 'a-1');
    assert.equal(spec.variant_id, 'Cognac');
    assert.equal(spec.finish_style, 'debossed_leather');
    assert.ok(spec.physical_geometry_mm.box_width_mm > 0);
    assert.ok(spec.physical_geometry_mm.box_height_mm > 0);
    assert.ok(spec.production_svg.includes('<svg'));
    assert.ok(spec.production_svg.includes('ALEXANDER'));
    assert.ok(spec.production_svg.includes('mm"'));
    assert.ok(spec.typography.computed_font_size_pt > 0);
  });
});
