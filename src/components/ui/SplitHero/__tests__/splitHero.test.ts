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

// Stub next/navigation for Node.js SSR testing
try {
  require.cache[require.resolve('next/navigation')] = {
    id: require.resolve('next/navigation'),
    filename: require.resolve('next/navigation'),
    loaded: true,
    exports: {
      __esModule: true,
      useRouter: () => ({
        push: () => {},
        replace: () => {},
        prefetch: () => {},
        back: () => {},
      }),
      usePathname: () => '/',
      useSearchParams: () => new URLSearchParams(),
    },
  } as any;
} catch {
  // Ignore if already cached
}

import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  SPLIT,
  SPLIT_HERO_TOKENS,
  validateHalvesCount,
  computeFlexGrow,
  computeWidthPercentage,
  isCompressedRatioAdequate,
  clampDescriptor,
  isShortViewport,
  getInitialClipPath,
  getFinalClipPath,
} from '../tokens';
import { SplitHalfConfig } from '../types';

const { SplitHero } = require('../SplitHero');

const MOCK_HALVES: [SplitHalfConfig, SplitHalfConfig] = [
  {
    id: 'women',
    label: 'Women',
    descriptor: 'Architectural tailoring, sculptural wools, and quiet forms.',
    href: '/products?category=women',
    cta: 'Shop women',
    image: {
      src: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop',
      srcset: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800 800w, https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600 1600w',
      width: 1600,
      height: 2200,
      objectPosition: '50% 25%',
      alt: 'Model in structured minimal yellow coat',
      placeholderColor: '#1a1816',
    },
    quickLinks: [
      { label: 'New in', href: '/products?category=women&filter=new' },
      { label: 'Best sellers', href: '/products?category=women&filter=bestsellers' },
      { label: 'Sale', href: '/products?category=women&filter=sale' },
    ],
  },
  {
    id: 'men',
    label: 'Men',
    descriptor: 'Engineered outerwear, heavyweight cotton, and clean lines.',
    href: '/products?category=men',
    cta: 'Shop men',
    image: {
      src: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600&auto=format&fit=crop',
      srcset: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800 800w, https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600 1600w',
      width: 1600,
      height: 2200,
      objectPosition: '50% 20%',
      alt: 'Model in tailored black wool suit',
      placeholderColor: '#121214',
    },
    quickLinks: [
      { label: 'New in', href: '/products?category=men&filter=new' },
      { label: 'Tailoring', href: '/products?category=men&filter=tailoring' },
      { label: 'Sale', href: '/products?category=men&filter=sale' },
    ],
  },
];

describe('SplitHero: Motion Tokens & Design Constants', () => {
  it('strictly adheres to the SPLIT motion specification', () => {
    assert.equal(SPLIT.neutralGrow, 1, 'Neutral grow must be 1 (50/50)');
    assert.equal(SPLIT.expandedGrow, 7, 'Expanded grow must be 7 (~70%)');
    assert.equal(SPLIT.compressedGrow, 3, 'Compressed grow must be 3 (~30%)');
    assert.equal(SPLIT.duration, 0.7, 'Duration must be exactly 0.7s');
    assert.deepEqual(SPLIT.ease, [0.65, 0, 0.35, 1], 'Cubic bezier curve must be calm [0.65, 0, 0.35, 1]');
    assert.equal(SPLIT.hoverIntentDelay, 90, 'Hover intent debounce must be 90ms');
    assert.equal(SPLIT.returnDelay, 300, 'Return delay must be 300ms');
  });

  it('validates extended layout tokens and thresholds', () => {
    assert.equal(SPLIT_HERO_TOKENS.underlineDuration, 0.4, 'Underline draw duration is 400ms');
    assert.equal(SPLIT_HERO_TOKENS.textExitDuration, 0.15, 'Text exit cross-fade is 150ms');
    assert.equal(SPLIT_HERO_TOKENS.textEnterDuration, 0.3, 'Text enter cross-fade is 300ms');
    assert.equal(SPLIT_HERO_TOKENS.textEnterRise, 10, 'Text enter rise is 10px');
    assert.equal(SPLIT_HERO_TOKENS.entranceClipDuration, 0.7, 'Entrance clip duration is 700ms');
    assert.equal(SPLIT_HERO_TOKENS.minCompressedRatio, 0.28, 'Minimum compressed ratio constraint is 28%');
    assert.equal(SPLIT_HERO_TOKENS.shortViewportHeightThreshold, 560, 'Short viewport threshold is 560px');
    assert.equal(SPLIT_HERO_TOKENS.fixedTextBlockWidthDesktop, 360, 'Fixed text block width on desktop is 360px');
  });
});

describe('SplitHero: Mathematical Utilities & Geometry', () => {
  it('correctly calculates flex-grow for neutral, expanded, and compressed states', () => {
    // Neutral state (activeId is null)
    assert.equal(computeFlexGrow('women', null), 1);
    assert.equal(computeFlexGrow('men', null), 1);

    // Active state: women is hovered
    assert.equal(computeFlexGrow('women', 'women'), 7);
    assert.equal(computeFlexGrow('men', 'women'), 3);

    // Active state: men is hovered
    assert.equal(computeFlexGrow('men', 'men'), 7);
    assert.equal(computeFlexGrow('women', 'men'), 3);
  });

  it('computes exact width percentages matching container total', () => {
    // Neutral
    assert.equal(computeWidthPercentage('women', null), 50);
    assert.equal(computeWidthPercentage('men', null), 50);

    // Hovered women
    assert.equal(computeWidthPercentage('women', 'women'), 70);
    assert.equal(computeWidthPercentage('men', 'women'), 30);
    assert.equal(computeWidthPercentage('women', 'women') + computeWidthPercentage('men', 'women'), 100);

    // Hovered men
    assert.equal(computeWidthPercentage('men', 'men'), 70);
    assert.equal(computeWidthPercentage('women', 'men'), 30);
    assert.equal(computeWidthPercentage('men', 'men') + computeWidthPercentage('women', 'men'), 100);
  });

  it('validates compressed ratio constraints (minimum 28%)', () => {
    assert.equal(isCompressedRatioAdequate(0.3), true, '30% satisfies >= 28%');
    assert.equal(isCompressedRatioAdequate(0.28), true, '28% exactly satisfies >= 28%');
    assert.equal(isCompressedRatioAdequate(0.25), false, '25% fails the 28% minimum constraint');
  });

  it('identifies short viewports under 560px height', () => {
    assert.equal(isShortViewport(480), true, '480px is a short viewport');
    assert.equal(isShortViewport(559), true, '559px is a short viewport');
    assert.equal(isShortViewport(560), false, '560px is standard');
    assert.equal(isShortViewport(900), false, '900px is standard desktop');
  });

  it('clamps descriptors cleanly at word boundaries with ellipsis', () => {
    const shortText = 'Structured outerwear and tailoring.';
    assert.equal(clampDescriptor(shortText), shortText);

    const longText = 'This is an exceptionally long architectural descriptor that exceeds sixty-five characters in total length.';
    const clamped = clampDescriptor(longText, 65);
    assert.ok(clamped.endsWith('…'));
    assert.ok(clamped.length <= 67);
  });

  it('generates outer-edge entrance clip paths with RTL support', () => {
    // LTR
    assert.equal(getInitialClipPath(0, false), 'inset(0 100% 0 0)', 'Left half clips from outer left');
    assert.equal(getInitialClipPath(1, false), 'inset(0 0 0 100%)', 'Right half clips from outer right');
    assert.equal(getFinalClipPath(), 'inset(0 0% 0 0)', 'Final clip reveals 100%');

    // RTL
    assert.equal(getInitialClipPath(0, true), 'inset(0 0 0 100%)', 'RTL half 0 mirrors');
    assert.equal(getInitialClipPath(1, true), 'inset(0 100% 0 0)', 'RTL half 1 mirrors');
  });
});

describe('SplitHero: Halves Configuration Validation', () => {
  it('validates that halves must contain exactly two items', () => {
    assert.equal(validateHalvesCount(MOCK_HALVES), true);
    assert.equal(validateHalvesCount([MOCK_HALVES[0]]), false);
    assert.equal(validateHalvesCount([...MOCK_HALVES, MOCK_HALVES[0]]), false);
    assert.equal(validateHalvesCount([]), false);
    assert.equal(validateHalvesCount(null as any), false);
  });
});

describe('SplitHero: Server-Side Rendering (SSR) & Accessibility', () => {
  it('renders neutral 50/50 state with complete semantic HTML before hydration', () => {
    const html = renderToString(
      React.createElement(SplitHero, {
        halves: MOCK_HALVES,
        pageTitle: 'MATTE. — Architectural Hardware',
      })
    );
    // Section labeled region
    assert.ok(html.includes('aria-label="Shop by category"'));

    // Accessible hidden H1
    assert.ok(html.includes('MATTE. — Architectural Hardware'));

    // Both destination links present
    assert.ok(html.includes('href="/products?category=women"'));
    assert.ok(html.includes('href="/products?category=men"'));

    // Accessible labels
    assert.ok(html.includes('aria-label="Shop women: Women — Architectural tailoring, sculptural wools, and quiet forms."'));
    assert.ok(html.includes('aria-label="Shop men: Men — Engineered outerwear, heavyweight cotton, and clean lines."'));

    // Visible text and CTAs
    assert.ok(html.includes('Women'));
    assert.ok(html.includes('Men'));
    assert.ok(html.includes('Shop women'));
    assert.ok(html.includes('Shop men'));

    // Inclusive escape hatch "Shop all" link
    assert.ok(html.includes('Shop all'));
    assert.ok(html.includes('href="/products"'));

    // Image preloads and attributes
    assert.ok(html.includes('rel="preload"'));
    assert.ok(/fetchpriority="high"/i.test(html));
    assert.ok(html.includes('sizes="(max-width: 768px) 100vw, 72vw"'));
  });

  it('supports custom presets, custom shop all destinations, and RTL', () => {
    const customHalves: [SplitHalfConfig, SplitHalfConfig] = [
      {
        id: 'fashion',
        label: 'Fashion',
        descriptor: 'Architectural cotton and raw denim.',
        href: '/fashion',
        cta: 'Explore fashion',
        image: {
          src: '/img1.jpg',
          width: 1200,
          height: 1600,
          alt: 'Fashion preview',
        },
      },
      {
        id: 'home',
        label: 'Home',
        descriptor: 'Ceramics, white oak, and ambient lamps.',
        href: '/home',
        cta: 'Explore home',
        image: {
          src: '/img2.jpg',
          width: 1200,
          height: 1600,
          alt: 'Home furniture preview',
        },
      },
    ];

    const html = renderToString(
      React.createElement(SplitHero, {
        halves: customHalves,
        shopAll: {
          label: 'View all catalog',
          href: '/catalog',
          ariaLabel: 'View full collection catalog',
        },
        dir: 'rtl',
      })
    );

    assert.ok(html.includes('dir="rtl"'));
    assert.ok(html.includes('Fashion'));
    assert.ok(html.includes('Home'));
    assert.ok(html.includes('View all catalog'));
    assert.ok(html.includes('href="/catalog"'));
  });
});
