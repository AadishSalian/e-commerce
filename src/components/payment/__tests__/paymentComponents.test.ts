import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CardBrandIcon } from '../CardBrandIcon';
import { CardSecurityCodeIllustration } from '../CardSecurityCodeIllustration';
import { AcceptedBrandsRow } from '../AcceptedBrandsRow';

describe('Payment Components: CardBrandIcon Inline SVGs', () => {
  it('renders official brand SVG for all supported brands', () => {
    const brands = ['visa', 'mastercard', 'amex', 'rupay', 'discover', 'diners', 'jcb', 'unionpay', 'unknown'] as const;

    for (const brand of brands) {
      const html = renderToString(React.createElement(CardBrandIcon, { brand }));
      assert.ok(html.includes('<svg'), `Failed to render SVG for ${brand}`);
      assert.ok(html.includes('viewBox="0 0 36 24"'));
    }
  });

  it('marks brand SVG with accessible role="img" and label when not hidden', () => {
    const html = renderToString(React.createElement(CardBrandIcon, { brand: 'visa', alt: 'Visa Card' }));
    assert.ok(html.includes('role="img"'));
    assert.ok(html.includes('aria-label="Visa Card"'));
  });

  it('marks brand SVG aria-hidden when announced separately by polite live region', () => {
    const html = renderToString(React.createElement(CardBrandIcon, { brand: 'mastercard', 'aria-hidden': true }));
    assert.ok(html.includes('aria-hidden="true"'));
    assert.ok(html.includes('role="presentation"'));
  });
});

describe('Payment Components: CardSecurityCodeIllustration', () => {
  it('renders front-of-card CID view for American Express', () => {
    const html = renderToString(React.createElement(CardSecurityCodeIllustration, { brand: 'amex' }));
    assert.ok(html.includes('4 Digits') || html.includes('1234'));
  });

  it('renders back-of-card CVV view for Visa and standard networks', () => {
    const html = renderToString(React.createElement(CardSecurityCodeIllustration, { brand: 'visa' }));
    assert.ok(html.includes('3 Digits') || html.includes('123'));
  });

  it('renders neutral dual-hint illustration for unknown brands', () => {
    const html = renderToString(React.createElement(CardSecurityCodeIllustration, { brand: 'unknown' }));
    assert.ok(html.includes('3 or 4') || html.includes('Back or front of card'));
  });
});

describe('Payment Components: AcceptedBrandsRow', () => {
  it('renders accessible list with official logos for accepted merchant brands', () => {
    const html = renderToString(React.createElement(AcceptedBrandsRow, {
      acceptedBrands: ['visa', 'mastercard', 'amex', 'rupay'],
    }));
    assert.ok(html.includes('role="list"'));
    assert.ok(html.includes('role="listitem"'));
    assert.ok(html.includes('Visa'));
    assert.ok(html.includes('Mastercard'));
    assert.ok(html.includes('RuPay'));
  });
});
