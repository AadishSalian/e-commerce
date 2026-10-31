import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// Stub .css and .module.css imports for Node.js test environment
const require = createRequire(import.meta.url);
require.extensions['.css'] = (module: any) => {
  const proxy: any = new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === '__esModule') return true;
        if (prop === 'default') return proxy;
        return String(prop);
      },
    }
  );
  module.exports = proxy;
};

import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  BADGE_FX,
  getCircularPathData,
  formatSeamlessCircularText,
  isComplexScript,
  isRtlScript,
  isNoisyRoute,
} from '../tokens';
import { resolveBadgePreset, TRUST_POLICIES } from '@/config/trustPolicies';

const { RotatingBadge } = require('../RotatingBadge');

describe('RotatingBadge Geometry, Tokens & Path Math', () => {
  it('strictly adheres to the design tokens and square viewBox constants', () => {
    assert.equal(BADGE_FX.viewBoxSize, 120, 'ViewBox must be 120x120');
    assert.equal(BADGE_FX.center, 60, 'Center coordinate must be (60, 60)');
    assert.equal(BADGE_FX.outerDiscRadius, 58, 'Outer disc radius must be 58px');
    assert.equal(BADGE_FX.innerRingRadius, 28, 'Hairline ring radius must be 28px');
    assert.equal(BADGE_FX.textPathRadius, 43.5, 'Text path radius must be 43.5px');
    assert.equal(BADGE_FX.defaultSpeed, 24, 'Default speed must be 24 seconds');
    assert.equal(BADGE_FX.minSpeed, 12, 'Minimum speed bound is 12s');
    assert.equal(BADGE_FX.maxSpeed, 36, 'Maximum speed bound is 36s');
    assert.equal(BADGE_FX.minTextDisplaySize, 64, 'Below 64px, badge switches to compact seal');
  });

  it('calculates the exact mathematical circumference', () => {
    const expectedCircumference = 2 * Math.PI * 43.5;
    assert.ok(
      Math.abs(BADGE_FX.circumference - expectedCircumference) < 0.0001,
      'Circumference must match 2 * π * r'
    );
    // Approximately 273.32 px
    assert.ok(BADGE_FX.circumference > 273.3 && BADGE_FX.circumference < 273.4);
  });

  it('generates a valid 360° SVG path starting at 12 o clock', () => {
    const pathClockwise = getCircularPathData(43.5, 60, 60, 'clockwise');
    // Top 12 o'clock coordinate: (60, 60 - 43.5) = (60, 16.5)
    // Bottom 6 o'clock coordinate: (60, 60 + 43.5) = (60, 103.5)
    assert.equal(pathClockwise, 'M 60 16.5 A 43.5 43.5 0 0 1 60 103.5 A 43.5 43.5 0 0 1 60 16.5');

    const pathCounterClockwise = getCircularPathData(43.5, 60, 60, 'counter-clockwise');
    assert.equal(pathCounterClockwise, 'M 60 16.5 A 43.5 43.5 0 0 0 60 103.5 A 43.5 43.5 0 0 0 60 16.5');
  });
});

describe('Seamless Circular Text Formatting & Gap Formula', () => {
  it('formats standard returns phrase with uppercase and trailing separator', () => {
    const result = formatSeamlessCircularText('Free returns • 30 days', '•');
    assert.equal(result.unitText, 'FREE RETURNS • 30 DAYS • ');
    assert.equal(result.repeats, 2);
    assert.equal(
      result.fullText,
      'FREE RETURNS • 30 DAYS • FREE RETURNS • 30 DAYS • '
    );
  });

  it('guarantees zero visible seam between the end of the last repeat and start of first', () => {
    const separator = '•';
    const result = formatSeamlessCircularText('Free returns • 30 days', separator);
    const unitGap = ` ${separator} `;

    // The gap between "30 DAYS" and next repeat is " • "
    const firstEndIndex = result.fullText.indexOf('30 DAYS') + '30 DAYS'.length;
    const gapAfterFirst = result.fullText.slice(firstEndIndex, firstEndIndex + unitGap.length);
    assert.equal(gapAfterFirst, unitGap);

    // The final gap at the end of the full repeated string is " • "
    const lastGap = result.fullText.slice(-unitGap.length);
    assert.equal(lastGap, unitGap, 'End of phrase must match the exact unit gap');
  });

  it('allocates 3 repeats for shorter phrases to fill circle evenly', () => {
    const result = formatSeamlessCircularText('2-Year Warranty', '•');
    // "2-YEAR WARRANTY • " is 18 characters -> qualifies for 3 repeats
    assert.equal(result.repeats, 3);
    assert.equal(
      result.fullText,
      '2-YEAR WARRANTY • 2-YEAR WARRANTY • 2-YEAR WARRANTY • '
    );
  });

  it('supports custom separator glyphs like ✦', () => {
    const result = formatSeamlessCircularText('Engineered Hardware', '✦');
    assert.ok(result.fullText.includes('✦'));
    assert.equal(result.separator, '✦');
    assert.ok(result.fullText.endsWith('✦ '));
  });

  it('handles empty or blank phrases safely', () => {
    const result = formatSeamlessCircularText('', '•');
    assert.equal(result.fullText, '');
    assert.equal(result.repeats, 0);
  });
});

describe('Trust Policy Integration & Drift Prevention', () => {
  it('resolves returns preset truthfully from TRUST_POLICIES config', () => {
    const resolved = resolveBadgePreset('returns-30');
    assert.ok(resolved !== null);
    assert.equal(
      resolved.phrase,
      `Free returns • ${TRUST_POLICIES.returns.windowDays} days`
    );
    assert.equal(resolved.icon, 'arrow-return');
    assert.equal(resolved.href, '/returns');
    assert.ok(resolved.accessibleLabel.includes(`${TRUST_POLICIES.returns.windowDays} days`));
  });

  it('resolves shipping preset truthfully from shipping config', () => {
    const resolved = resolveBadgePreset('shipping-pan-india');
    assert.ok(resolved !== null);
    assert.equal(
      resolved.phrase,
      `Free shipping • ${TRUST_POLICIES.shipping.region}`
    );
    assert.equal(resolved.icon, 'truck');
    assert.equal(resolved.href, '/shipping');
  });

  it('resolves warranty preset truthfully from warranty config', () => {
    const resolved = resolveBadgePreset('warranty-2yr');
    assert.ok(resolved !== null);
    assert.equal(
      resolved.phrase,
      `${TRUST_POLICIES.warranty.years}-year warranty • Guaranteed`
    );
    assert.equal(resolved.icon, 'shield');
    assert.equal(resolved.href, '/warranty');
  });

  it('returns null when preset is unrecognized to prevent bogus claims', () => {
    // @ts-expect-error Testing invalid preset key
    const invalid = resolveBadgePreset('bogus-preset');
    assert.equal(invalid, null);
  });
});

describe('Internationalization & Complex Script Detection', () => {
  it('correctly classifies standard Latin phrases for textPath circular rendering', () => {
    assert.equal(isComplexScript('FREE RETURNS • 30 DAYS'), false);
    assert.equal(isComplexScript('FREE SHIPPING • PAN-INDIA'), false);
    assert.equal(isComplexScript('2-YEAR WARRANTY'), false);
  });

  it('detects complex Indic, Arabic, and Tamil scripts that break on curved paths', () => {
    // Devanagari (Hindi)
    assert.equal(isComplexScript('मुफ़्त वापसी • ३० दिन'), true);
    // Tamil
    assert.equal(isComplexScript('இலவச வருவாய்'), true);
    // Arabic
    assert.equal(isComplexScript('إرجاع مجاني'), true);
  });

  it('detects RTL scripts correctly', () => {
    assert.equal(isRtlScript('إرجاع مجاني'), true);
    assert.equal(isRtlScript('FREE RETURNS'), false);
  });
});

describe('Route Noise Filtering', () => {
  it('correctly suppresses badges on noisy transactional pages', () => {
    assert.equal(isNoisyRoute('/cart'), true);
    assert.equal(isNoisyRoute('/checkout'), true);
    assert.equal(isNoisyRoute('/account'), true);
    assert.equal(isNoisyRoute('/login'), true);
    assert.equal(isNoisyRoute('/checkout/shipping'), true);
  });

  it('allows rendering on landing, marketing, and product pages', () => {
    assert.equal(isNoisyRoute('/'), false);
    assert.equal(isNoisyRoute('/products'), false);
    assert.equal(isNoisyRoute('/about'), false);
    assert.equal(isNoisyRoute(null), false);
  });
});

describe('Server-Side Rendering & Accessibility Structure', () => {
  it('renders valid SVG seal with accessible label and hidden text elements when decorative', () => {
    const html = renderToString(
      React.createElement(RotatingBadge, {
        text: 'Free returns • 30 days',
        icon: 'arrow-return',
        corner: 'none',
      })
    );

    // Checks SVG construction
    assert.ok(html.includes('<svg'), 'Must render SVG element');
    assert.ok(html.includes('viewBox="0 0 120 120"'), 'Must have 0 0 120 120 viewBox');
    assert.ok(html.includes('role="img"'), 'Must provide role="img" when not a link');
    assert.ok(html.includes('aria-label="Free returns 30 days"'), 'Accessible label must be present');
    assert.ok(html.includes('aria-hidden="true"'), 'SVG circular text must be aria-hidden');
    assert.ok(html.includes('textLength="273.31'), 'textPath textLength must match circumference');
  });

  it('renders accessible link wrapper with focus ring when href is provided', () => {
    const html = renderToString(
      React.createElement(RotatingBadge, {
        preset: 'returns-30',
        href: '/returns',
        corner: 'none',
      })
    );

    assert.ok(html.includes('href="/returns"'), 'Must render anchor link');
    assert.ok(html.includes('aria-label="Free returns within 30 days. View return policy"'));
  });

  it('swaps to compact icon-only seal when diameter is below 64px', () => {
    const html = renderToString(
      React.createElement(RotatingBadge, {
        preset: 'returns-30',
        size: 56, // below 64px threshold
        corner: 'none',
      })
    );

    assert.ok(html.includes('<svg'), 'Must render SVG');
    // Circular text ring should be omitted
    assert.ok(!html.includes('<textPath'), 'Must omit textPath below 64px to preserve legibility');
  });

  it('renders fallback horizontal pill for complex script without path distortion', () => {
    const html = renderToString(
      React.createElement(RotatingBadge, {
        text: 'मुफ़्त वापसी • ३० दिन',
        corner: 'none',
      })
    );

    // In complex script fallback mode, textPath is not used
    assert.ok(!html.includes('<textPath'));
    assert.ok(html.includes('मुफ़्त वापसी • ३० दिन'));
  });
});
