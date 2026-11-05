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

// Stub next/image for Node.js SSR testing
require.cache[require.resolve('next/image')] = {
  id: require.resolve('next/image'),
  filename: require.resolve('next/image'),
  loaded: true,
  exports: {
    __esModule: true,
    default: (props: any) => {
      return React.createElement('img', {
        src: typeof props.src === 'string' ? props.src : props.src?.src || '',
        alt: props.alt,
        width: props.width,
        height: props.height,
        className: props.className,
        style: props.style,
        loading: props.loading,
      });
    },
  },
} as any;

import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  PANEL_GALLERY_TOKENS,
  validatePanelCount,
  computeExpandedWidth,
  computeCompressedWidth,
  canFitDesktopRow,
  formatCategoryIndex,
  clampDescription,
} from '../tokens';
import { PanelItem } from '../types';

const { PanelGallery } = require('../PanelGallery');

const MOCK_PANELS: PanelItem[] = [
  {
    id: 'fashion',
    title: 'Fashion & Apparel',
    description: 'Architectural silhouettes cut from organic cotton and Japanese selvedge denim.',
    itemCount: 142,
    href: '/fashion',
    image: {
      src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200',
      width: 1200,
      height: 1600,
      objectPosition: '50% 30%',
      dominantColor: '#1c1b18',
    },
    alt: 'Minimalist designer outerwear and tailored apparel',
  },
  {
    id: 'electronics',
    title: 'Electronics',
    description: 'Matte aluminum desktop tools, acoustic audio drivers, and precision peripherals.',
    itemCount: 68,
    href: '/electronics',
    image: {
      src: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800',
      width: 800,
      height: 1200,
      objectPosition: '50% 40%',
      dominantColor: '#191919',
    },
    alt: 'Modern matte black smartwatch and precision acoustics',
  },
  {
    id: 'home',
    title: 'Home & Furniture',
    description: 'Hand-thrown ceramics, solid white oak tables, and ambient architectural lighting.',
    itemCount: 95,
    href: '/home-furniture',
    image: {
      src: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800',
      width: 800,
      height: 1200,
      objectPosition: 'center 45%',
      dominantColor: '#24211e',
    },
    alt: 'Warm ambient living room with minimalist solid wood furniture',
  },
  {
    id: 'beauty',
    title: 'Beauty Care',
    description: 'Cold-pressed botanical serums and gentle restorative elixirs in frosted glass.',
    itemCount: 54,
    href: '/beauty',
    image: {
      src: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800',
      width: 800,
      height: 1200,
      objectPosition: 'center center',
      dominantColor: '#262220',
    },
    alt: 'Artisanal skincare bottles with organic botanical ingredients',
  },
  {
    id: 'sports',
    title: 'Sports & Outdoors',
    description: 'Ultralight technical outerwear, anodized camp hardware, and trail essentials.',
    itemCount: 82,
    href: '/sports',
    image: {
      src: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800',
      width: 800,
      height: 1200,
      objectPosition: '50% 35%',
      dominantColor: '#171a1c',
    },
    alt: 'Athlete training gear and performance athletic equipment',
  },
  {
    id: 'accessories',
    title: 'Accessories',
    description: 'Vegetable-tanned leather folios, machined brass pens, and daily essentials.',
    itemCount: 110,
    href: '/accessories',
    image: {
      src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200',
      width: 1200,
      height: 1600,
      objectPosition: '50% 50%',
      dominantColor: '#21201d',
    },
    alt: 'Premium everyday carry watch and handcrafted leather accessories',
  },
];

describe('PanelGallery: Motion Tokens & Layout Constants', () => {
  it('verifies motion tokens strictly conform to specification', () => {
    assert.equal(PANEL_GALLERY_TOKENS.expandedGrow, 5);
    assert.equal(PANEL_GALLERY_TOKENS.compressedGrow, 1);
    assert.equal(PANEL_GALLERY_TOKENS.duration, 0.6);
    assert.deepEqual(PANEL_GALLERY_TOKENS.ease, [0.65, 0, 0.35, 1]);
    assert.equal(PANEL_GALLERY_TOKENS.hoverIntentDelay, 90);
    assert.equal(PANEL_GALLERY_TOKENS.returnDelay, 350);
    assert.equal(PANEL_GALLERY_TOKENS.textExitDuration, 0.12);
    assert.equal(PANEL_GALLERY_TOKENS.textEnterDuration, 0.35);
    assert.equal(PANEL_GALLERY_TOKENS.textEnterDelay, 0.15);
    assert.equal(PANEL_GALLERY_TOKENS.underlineDuration, 0.4);
    assert.equal(PANEL_GALLERY_TOKENS.revealStagger, 0.08);
    assert.equal(PANEL_GALLERY_TOKENS.revealDuration, 0.6);
  });

  it('verifies panel bounds and mobile accordion metrics', () => {
    assert.equal(PANEL_GALLERY_TOKENS.minPanels, 4);
    assert.equal(PANEL_GALLERY_TOKENS.maxPanels, 6);
    assert.equal(PANEL_GALLERY_TOKENS.minCompressedWidthDesktop, 72);
    assert.equal(PANEL_GALLERY_TOKENS.minTapTargetHeight, 56);
    assert.equal(PANEL_GALLERY_TOKENS.accordionCollapsedHeight, '84px');
    assert.equal(PANEL_GALLERY_TOKENS.accordionExpandedHeight, '52svh');
  });
});

describe('PanelGallery: Mathematical Utilities & Layout Sizing', () => {
  it('accurately computes expanded and compressed widths summing to container', () => {
    const containerWidth = 1400;
    const panelCount = 6;
    const gap = 10;

    const expandedW = computeExpandedWidth(containerWidth, panelCount, gap);
    const compressedW = computeCompressedWidth(containerWidth, panelCount, gap);

    // 1400 - 5 * 10 = 1350. Total units = 5 + 5*1 = 10.
    // Expanded = 1350 * 5 / 10 = 675.
    // Compressed = 1350 * 1 / 10 = 135.
    assert.equal(expandedW, 675);
    assert.equal(compressedW, 135);

    const totalCalculated = expandedW + (panelCount - 1) * compressedW + (panelCount - 1) * gap;
    assert.equal(totalCalculated, containerWidth);
  });

  it('determines if compressed panels fit minimum desktop width threshold', () => {
    // 6 panels with 72px min compressed width requires container > (72 * 10 + 50) = 770px
    assert.equal(canFitDesktopRow(1200, 6, 72, 10), true);
    assert.equal(canFitDesktopRow(600, 6, 72, 10), false);
  });

  it('formats category index with leading zero', () => {
    assert.equal(formatCategoryIndex(0), '01');
    assert.equal(formatCategoryIndex(4), '05');
    assert.equal(formatCategoryIndex(9), '10');
  });

  it('clamps descriptions cleanly at max length without breaking words', () => {
    const shortDesc = 'Minimalist aesthetics for everyday carry.';
    assert.equal(clampDescription(shortDesc, 80), shortDesc);

    const longDesc =
      'This is an exceptionally detailed description that spans way beyond the allowed character limit and should be truncated gracefully.';
    const clamped = clampDescription(longDesc, 80);
    assert.ok(clamped.length <= 80);
    assert.ok(clamped.endsWith('…'));
  });
});

describe('PanelGallery: Panel Count Adaptation Rules', () => {
  it('flags count < 4 as too few for expanding gallery and suggests fallback grid', () => {
    const res = validatePanelCount(3);
    assert.equal(res.isValidRange, false);
    assert.equal(res.isTooFew, true);
    assert.equal(res.isTooMany, false);
  });

  it('approves count between 4 and 6 as optimal for expanding gallery', () => {
    assert.equal(validatePanelCount(4).isValidRange, true);
    assert.equal(validatePanelCount(5).isValidRange, true);
    assert.equal(validatePanelCount(6).isValidRange, true);
  });

  it('caps count > 6 at 6 and recommends "View all" link', () => {
    const res = validatePanelCount(8);
    assert.equal(res.isValidRange, false);
    assert.equal(res.isTooMany, true);
    assert.equal(res.displayedCount, 6);
  });
});

describe('PanelGallery: Server-Side Rendering & DOM Accessibility', () => {
  it('renders desktop flex row with full semantic structure and links', () => {
    const html = renderToString(
      React.createElement(PanelGallery, {
        panels: MOCK_PANELS,
        defaultActiveId: 'fashion',
        title: 'Curated Categories',
        subtitle: 'Explore Collections',
        layoutMode: 'desktop-only',
      })
    );

    // Landmark section and headers
    assert.ok(html.includes('Curated Categories'));
    assert.ok(html.includes('Explore Collections'));
    assert.ok(html.includes('role="list"'));

    // Check all panels are rendered as valid links
    MOCK_PANELS.forEach((panel) => {
      assert.ok(html.includes(`href="${panel.href}"`));
      assert.ok(html.includes(panel.title.replace(/&/g, '&amp;')));
    });

    // Check default panel is marked active/expanded
    assert.ok(html.includes('aria-current="true"'));

    // Verify screen-reader description is always present in DOM (not hidden with display:none)
    assert.ok(html.includes('Architectural silhouettes cut from organic cotton'));
    assert.ok(html.includes('142 items'));
  });

  it('renders fallback grid when provided fewer than 4 panels', () => {
    const smallPanels = MOCK_PANELS.slice(0, 3);
    const html = renderToString(
      React.createElement(PanelGallery, {
        panels: smallPanels,
        title: 'Featured Categories',
      })
    );

    // Fallback testid present
    assert.ok(html.includes('data-testid="panel-gallery-fallback-grid"'));
    // All 3 items rendered
    assert.ok(html.includes('Fashion &amp; Apparel'));
    assert.ok(html.includes('Electronics'));
    assert.ok(html.includes('Home &amp; Furniture'));
  });

  it('renders accordion markup when forced to accordion mode', () => {
    const html = renderToString(
      React.createElement(PanelGallery, {
        panels: MOCK_PANELS,
        defaultActiveId: 'electronics',
        layoutMode: 'accordion-only',
      })
    );

    assert.ok(html.includes('data-testid="panel-gallery-mobile-accordion"'));
    assert.ok(html.includes('aria-expanded="true"'));
    assert.ok(html.includes('Explore category'));
  });

  it('renders "View all categories" link when panels exceed 6', () => {
    const extraPanels = [
      ...MOCK_PANELS,
      {
        id: 'books',
        title: 'Books & Stationery',
        href: '/books',
        image: { src: '/books.jpg', width: 800, height: 1200 },
        alt: 'Stationery',
      },
    ];

    const html = renderToString(
      React.createElement(PanelGallery, {
        panels: extraPanels,
        viewAllHref: '/categories',
        viewAllLabel: 'View all collections',
        layoutMode: 'desktop-only',
      })
    );

    assert.ok(html.includes('href="/categories"'));
    assert.ok(html.includes('View all collections'));
    // Ensure only 6 panels are rendered in gallery
    assert.ok(!html.includes('Books & Stationery'));
  });
});
