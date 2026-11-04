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
  STACKED_CARDS_TOKENS,
  computeTargetScale,
  computeCardTopOffset,
  getCardTone,
  validateCardCount,
} from '../tokens';
import { StackedCardItem } from '../types';

const { StackedCards } = require('../StackedCards');

const MOCK_CARDS: StackedCardItem[] = [
  {
    id: 'step-material',
    eyebrow: '01 — SOURCING',
    title: 'Raw Material Selection',
    body: 'We source only full-grain vegetable-tanned hides from certified regenerative farms.',
    image: '/images/craft-final.jpg',
    link: { href: '/materials', label: 'Explore Materials' },
  },
  {
    id: 'step-shaping',
    eyebrow: '02 — ARCHITECTURE',
    title: 'Precision Cutting & Skiving',
    body: 'Laser-guided precision meets generational intuition to carve flawless silhouettes.',
    image: '/images/craft-hero.jpg',
  },
  {
    id: 'step-handcraft',
    eyebrow: '03 — ARTISAN',
    title: 'Hand Saddle Stitching',
    body: 'Waxed linen threads anchored with traditional two-needle saddle stitching.',
    image: '/images/craft-tools.jpg',
  },
  {
    id: 'step-finishing',
    eyebrow: '04 — RESTRAINT',
    title: 'Edge Burnishing & Matte Finish',
    body: 'Hand-rubbed beeswax finish creating a subtle, durable matte barrier.',
    image: '/images/craft-stitch.jpg',
  },
];

describe('StackedCards Design Tokens & Mathematical Calibrations', () => {
  it('adheres to the calm, matte deck specifications', () => {
    assert.equal(STACKED_CARDS_TOKENS.defaultStackTopDesktop, 84);
    assert.equal(STACKED_CARDS_TOKENS.defaultStackTopMobile, 72);
    assert.equal(STACKED_CARDS_TOKENS.defaultStackPeekDesktop, 20);
    assert.equal(STACKED_CARDS_TOKENS.defaultStackPeekMobile, 16);
    assert.equal(STACKED_CARDS_TOKENS.scaleFactorDesktop, 0.035);
    assert.equal(STACKED_CARDS_TOKENS.scaleFactorMobile, 0.02);
    assert.equal(STACKED_CARDS_TOKENS.maxDimOpacity, 0.35);
    assert.equal(STACKED_CARDS_TOKENS.minViewportHeight, 600);
    assert.equal(STACKED_CARDS_TOKENS.minCards, 3);
    assert.equal(STACKED_CARDS_TOKENS.maxCards, 5);
  });

  it('computes correct spatial scale by stack depth', () => {
    // 4 cards in total:
    // Card 0 has depth 3: 1 - (3 * 0.035) = 0.895
    assert.equal(computeTargetScale(0, 4, 0.035), 0.895);
    // Card 1 has depth 2: 1 - (2 * 0.035) = 0.930
    assert.equal(computeTargetScale(1, 4, 0.035), 0.93);
    // Card 2 has depth 1: 1 - (1 * 0.035) = 0.965
    assert.equal(computeTargetScale(2, 4, 0.035), 0.965);
    // Last card (index 3) is never covered: must remain exactly 1.0
    assert.equal(computeTargetScale(3, 4, 0.035), 1.0);
  });

  it('enforces floor clamp at 0.85 on extreme depths', () => {
    // A hypothetical card 10 layers deep would be 1 - 0.35 = 0.65, but should be floored at 0.85
    assert.equal(computeTargetScale(0, 10, 0.05), 0.85);
  });

  it('computes accurate sticky top offsets with peek increments', () => {
    // Desktop: stackTop = 84, peek = 20
    assert.equal(computeCardTopOffset(0, 84, 20), 84);
    assert.equal(computeCardTopOffset(1, 84, 20), 104);
    assert.equal(computeCardTopOffset(2, 84, 20), 124);
    assert.equal(computeCardTopOffset(3, 84, 20), 144);

    // Mobile: stackTop = 72, peek = 16
    assert.equal(computeCardTopOffset(0, 72, 16), 72);
    assert.equal(computeCardTopOffset(1, 72, 16), 88);
    assert.equal(computeCardTopOffset(2, 72, 16), 104);
  });

  it('validates card counts within optimal storytelling bounds (3 to 5)', () => {
    assert.equal(validateCardCount(3).isValid, true);
    assert.equal(validateCardCount(4).isValid, true);
    assert.equal(validateCardCount(5).isValid, true);

    const under = validateCardCount(2);
    assert.equal(under.isValid, false);
    assert.ok(under.message?.includes('Fewer than 3 cards'));

    const over = validateCardCount(6);
    assert.equal(over.isValid, false);
    assert.ok(over.message?.includes('More than 5 cards'));
  });

  it('provides distinct tone shifts between adjacent layers', () => {
    const dark0 = getCardTone(0, true);
    const dark1 = getCardTone(1, true);
    const dark2 = getCardTone(2, true);
    assert.notEqual(dark0, dark1);
    assert.notEqual(dark1, dark2);

    const light0 = getCardTone(0, false);
    const light1 = getCardTone(1, false);
    assert.notEqual(light0, light1);
  });
});

describe('StackedCards SSR, Semantics & Accessibility', () => {
  it('renders semantic section landmark, ordered list, and cards in reading order', () => {
    const html = renderToString(
      React.createElement(StackedCards, {
        id: 'craft-process',
        title: 'Our Craftsmanship Journey',
        eyebrow: 'Process',
        description: 'From raw texture to enduring heirloom.',
        cards: MOCK_CARDS,
      })
    );

    // Section landmark
    assert.ok(html.includes('<section'), 'Must render section element');
    assert.ok(html.includes('id="craft-process"'), 'Section must carry id');
    assert.ok(html.includes('aria-labelledby="stacked-cards-heading-'), 'Must link heading ID');

    // Semantic list
    assert.ok(html.includes('<ol'), 'Cards must be in an ordered list (<ol>)');
    assert.ok(html.includes('<li'), 'Cards must be <li> items');

    // DOM order test
    const pos0 = html.indexOf('step-material');
    const pos1 = html.indexOf('step-shaping');
    const pos2 = html.indexOf('step-handcraft');
    const pos3 = html.indexOf('step-finishing');

    assert.ok(pos0 < pos1, 'Card 0 must precede Card 1 in DOM order');
    assert.ok(pos1 < pos2, 'Card 1 must precede Card 2 in DOM order');
    assert.ok(pos2 < pos3, 'Card 2 must precede Card 3 in DOM order');
  });

  it('renders card headings as h3 and marks ghost numerals aria-hidden', () => {
    const html = renderToString(
      React.createElement(StackedCards, {
        cards: MOCK_CARDS,
      })
    );

    assert.ok(html.includes('<h3'), 'Card titles must be h3 elements');
    assert.ok(html.includes('Raw Material Selection'));
    assert.ok(html.includes('aria-hidden="true"'), 'Ghost numerals and overlays must be aria-hidden');
  });

  it('renders card links with accessible text and target attributes', () => {
    const html = renderToString(
      React.createElement(StackedCards, {
        cards: MOCK_CARDS,
      })
    );

    assert.ok(html.includes('href="/materials"'), 'Must render link href');
    assert.ok(html.includes('Explore Materials'), 'Must render link text');
  });

  it('renders all cards with headings and links in SSR', () => {
    const html = renderToString(
      React.createElement(StackedCards, {
        cards: MOCK_CARDS,
        showProgress: true,
      })
    );

    assert.ok(html.includes('01 — SOURCING'));
    assert.ok(html.includes('02 — ARCHITECTURE'));
    assert.ok(html.includes('03 — ARTISAN'));
    assert.ok(html.includes('04 — RESTRAINT'));
  });
});
