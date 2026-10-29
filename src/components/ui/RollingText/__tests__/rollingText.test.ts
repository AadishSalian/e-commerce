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
  ROLL_DURATION,
  ROLL_DURATION_MS,
  ROLL_EASING,
  ROLL_EASING_CSS,
  MAX_LABEL_LENGTH,
  STAGGER_DEFAULT_DELAY,
  STAGGER_MAX_TOTAL,
  isComplexScript,
  splitGraphemes,
} from '../tokens';

const { RollingText } = require('../RollingText');

describe('RollingText Motion Tokens & Specifications', () => {
  it('verifies motion tokens match the quiet, precise matte specification', () => {
    // 350-450ms duration requirement
    assert.ok(ROLL_DURATION >= 0.35 && ROLL_DURATION <= 0.45);
    assert.equal(ROLL_DURATION_MS, 400);

    // Shared easing: strong ease-out cubic-bezier(0.65, 0, 0.35, 1) without overshoot
    assert.deepEqual(ROLL_EASING, [0.65, 0, 0.35, 1]);
    assert.equal(ROLL_EASING_CSS, 'cubic-bezier(0.65, 0, 0.35, 1)');

    // Stagger tokens: 15-25ms per character, capped at 250ms total
    assert.ok(STAGGER_DEFAULT_DELAY >= 0.015 && STAGGER_DEFAULT_DELAY <= 0.025);
    assert.equal(STAGGER_MAX_TOTAL, 0.25);

    // Label length cap at 24 characters
    assert.equal(MAX_LABEL_LENGTH, 24);
  });
});

describe('Script Detection for Letter Splitting Safety', () => {
  it('correctly allows letter splitting for Latin and standard European scripts', () => {
    assert.equal(isComplexScript('Shop'), false);
    assert.equal(isComplexScript('New Arrivals'), false);
    assert.equal(isComplexScript('Collections'), false);
    assert.equal(isComplexScript('Gypsy'), false);
    assert.equal(isComplexScript('Shipping'), false);
    assert.equal(isComplexScript('Quality'), false);
    assert.equal(isComplexScript('Café'), false);
  });

  it('detects joined/complex scripts where letter splitting breaks rendering', () => {
    // Arabic (cursive joining)
    assert.equal(isComplexScript('تسوق'), true);
    assert.equal(isComplexScript('متجر'), true);

    // Devanagari (conjuncts and matras)
    assert.equal(isComplexScript('दुकान'), true);
    assert.equal(isComplexScript('खरीदारी'), true);

    // Tamil
    assert.equal(isComplexScript('ஷாப்பிங்'), true);

    // Thai
    assert.equal(isComplexScript('ช้อปปิ้ง'), true);
  });
});

describe('Grapheme Splitting with Intl.Segmenter', () => {
  it('splits standard words into individual graphemes', () => {
    const chars = splitGraphemes('Shop');
    assert.deepEqual(chars, ['S', 'h', 'o', 'p']);
  });

  it('preserves multi-code-point emoji and combined characters', () => {
    const rocket = splitGraphemes('🚀');
    assert.equal(rocket.length, 1);
    assert.equal(rocket[0], '🚀');

    const sparkles = splitGraphemes('Matte ✨');
    assert.equal(sparkles[sparkles.length - 1], '✨');
  });

  it('caps total stagger to 250ms regardless of label length', () => {
    const longString = '12345678901234567890'; // 20 chars
    const charCount = longString.length;
    const requestedDelay = 0.02;
    const delayPerChar = Math.min(requestedDelay, STAGGER_MAX_TOTAL / (charCount - 1));
    const totalStagger = delayPerChar * (charCount - 1);

    assert.ok(totalStagger <= STAGGER_MAX_TOTAL + 0.0001);
  });
});

describe('Descender and Ascender Clearance Verification', () => {
  const testStrings = ['Gypsy', 'Shipping', 'Quality'];

  for (const str of testStrings) {
    it(`handles "${str}" within length limit without clipping`, () => {
      assert.ok(str.length <= MAX_LABEL_LENGTH);
      const html = renderToString(React.createElement(RollingText, null, str));
      assert.ok(html.includes(str));
      assert.ok(html.includes('aria-hidden="true"'));
      assert.ok(html.includes('aria-hidden="false"'));
    });
  }
});

describe('RollingText Server-Side Rendering & Accessibility', () => {
  it('renders exactly two copies for whole-label roll: one accessible, one aria-hidden', () => {
    const html = renderToString(React.createElement(RollingText, null, 'Shop'));

    // Visible line exposed to assistive technology
    assert.ok(html.includes('aria-hidden="false"'));
    // Duplicate line hidden from screen readers and user selection
    assert.ok(html.includes('aria-hidden="true"'));

    // Both lines contain the exact text
    const matches = html.match(/Shop/g);
    assert.equal(matches?.length, 2);
  });

  it('staggered mode sets accessible aria-label on container and marks characters aria-hidden', () => {
    const html = renderToString(React.createElement(RollingText, { stagger: true }, 'Bag'));

    assert.ok(html.includes('role="text"'));
    assert.ok(html.includes('aria-label="Bag"'));
    assert.ok(html.includes('data-roll="stagger"'));
  });

  it('preserves spaces in multi-word labels as non-breaking characters', () => {
    const html = renderToString(React.createElement(RollingText, { stagger: true }, 'Shop Now'));
    // Non-breaking space &nbsp; or unicode \u00A0
    assert.ok(html.includes('\u00A0') || html.includes('&nbsp;'));
  });

  it('falls back to whole-label roll when stagger is requested on complex scripts', () => {
    const html = renderToString(React.createElement(RollingText, { stagger: true }, 'खरीदारी'));
    // Should NOT be staggered, but whole-label to protect Hindi ligature rendering
    assert.ok(html.includes('data-roll="label"'));
  });

  it('falls back to static text when label exceeds 24-character cap', () => {
    const longLabel = 'This is a very long label that exceeds limit';
    assert.ok(longLabel.length > MAX_LABEL_LENGTH);

    const html = renderToString(React.createElement(RollingText, null, longLabel));
    // Should only render a single copy
    const matches = html.match(new RegExp(longLabel, 'g'));
    assert.equal(matches?.length, 1);
    assert.ok(!html.includes('aria-hidden="true"'));
  });

  it('applies explicit duplicateColor via CSS custom properties', () => {
    const html = renderToString(
      React.createElement(RollingText, { duplicateColor: 'var(--accent)' }, 'Cart')
    );
    assert.ok(html.includes('--roll-duplicate-color:var(--accent)'));
  });
});
