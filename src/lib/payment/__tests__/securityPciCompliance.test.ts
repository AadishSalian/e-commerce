import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  SESSION_REPLAY_BLOCK_ATTRIBUTES,
  sanitizeDeclineError,
  paymentRateLimiter,
  assertNoCardDataInStorage,
} from '../security';
import { PAYMENT_CSP_DIRECTIVES, buildPaymentCspHeader } from '../config';

describe('PCI DSS SAQ A Compliance: Zero-Storage Guarantee', () => {
  it('attaches standard session-replay blocking attributes across all tools', () => {
    // Clarity, FullStory, Sentry, LogRocket, Hotjar
    assert.strictEqual(SESSION_REPLAY_BLOCK_ATTRIBUTES['data-private'], 'true');
    assert.strictEqual(SESSION_REPLAY_BLOCK_ATTRIBUTES['data-mask'], 'true');
    assert.strictEqual(SESSION_REPLAY_BLOCK_ATTRIBUTES['data-clarity-mask'], 'true');
    assert.strictEqual(SESSION_REPLAY_BLOCK_ATTRIBUTES['data-recording-ignore'], 'true');
    assert.strictEqual(SESSION_REPLAY_BLOCK_ATTRIBUTES['data-sentry-mask'], 'true');
    assert.strictEqual(SESSION_REPLAY_BLOCK_ATTRIBUTES['data-fs-block'], 'true');
  });

  it('proves no PAN card data exists in browser local or session storage', () => {
    const audit = assertNoCardDataInStorage();
    assert.strictEqual(audit.secure, true);
    assert.strictEqual(audit.violations.length, 0);
  });
});

describe('PCI DSS Security: Issuer Decline Message Sanitization', () => {
  it('masks sensitive issuer decline codes to prevent card testing feedback', () => {
    // Raw codes that fraudsters use for card testing
    const stolenCard = sanitizeDeclineError({ code: 'stolen_card', message: 'Pickup card, stolen' });
    assert.strictEqual(stolenCard.message, 'Your card was declined. Please try another card, UPI, or contact your bank.');

    const doNotHonor = sanitizeDeclineError({ code: 'do_not_honor', message: 'Issuer do not honor' });
    assert.strictEqual(doNotHonor.message, 'Your card was declined. Please try another card, UPI, or contact your bank.');

    const insufficientFunds = sanitizeDeclineError({ code: 'insufficient_funds', message: 'Not enough balance' });
    assert.strictEqual(insufficientFunds.message, 'Your card was declined. Please try another card, UPI, or contact your bank.');
  });

  it('preserves helpful messages for shopper-fixable typos', () => {
    const expired = sanitizeDeclineError({ code: 'expired_card', message: 'Card expired' });
    assert.strictEqual(expired.message, 'Card has expired. Please use a card with a valid expiration date.');

    const wrongCvc = sanitizeDeclineError({ code: 'invalid_cvc', message: 'Incorrect security code' });
    assert.strictEqual(wrongCvc.message, 'The security code does not match. Please verify the code on your card.');
  });
});

describe('PCI DSS Security: Fraud Prevention & Client Rate Limiting', () => {
  it('enforces maximum payment attempts per time window to block card testing', () => {
    paymentRateLimiter.reset();

    // 4 attempts allowed
    for (let i = 0; i < 4; i++) {
      const check = paymentRateLimiter.canAttempt();
      assert.strictEqual(check.allowed, true);
      paymentRateLimiter.recordAttempt();
    }

    // 5th attempt must be blocked
    const fifth = paymentRateLimiter.canAttempt();
    assert.strictEqual(fifth.allowed, false);
    assert.ok(fifth.waitSeconds && fifth.waitSeconds > 0);

    // Clean up
    paymentRateLimiter.reset();
  });
});

describe('PCI DSS Security: Content Security Policy (CSP) Verification', () => {
  it('allows only official payment gateway origins for script and frame sources', () => {
    const scriptSrcs = PAYMENT_CSP_DIRECTIVES['script-src'];
    const frameSrcs = PAYMENT_CSP_DIRECTIVES['frame-src'];

    // Official Stripe origins
    assert.ok(scriptSrcs.includes('https://js.stripe.com'));
    assert.ok(frameSrcs.includes('https://js.stripe.com'));

    // Official Razorpay origins for India
    assert.ok(scriptSrcs.includes('https://checkout.razorpay.com'));
    assert.ok(frameSrcs.includes('https://api.razorpay.com'));

    // No wildcard '*' allowed in frame-src or script-src
    assert.strictEqual(scriptSrcs.includes('*' as any), false);
    assert.strictEqual(frameSrcs.includes('*' as any), false);
  });

  it('builds a valid CSP header string', () => {
    const header = buildPaymentCspHeader();
    assert.ok(header.includes("script-src 'self' https://js.stripe.com"));
    assert.ok(header.includes("frame-src 'self' https://js.stripe.com"));
  });
});

describe('Static Security Audit: No Raw Card Input in Checkout Form', () => {
  it('verifies checkout page does not send raw card number states to server', () => {
    const checkoutPagePath = path.resolve(
      process.cwd(),
      'src/components/payment/HostedPaymentFields.tsx'
    );
    const content = fs.readFileSync(checkoutPagePath, 'utf8');

    // Hosted field must have data-private and data-mask attributes
    assert.ok(content.includes('SESSION_REPLAY_BLOCK_ATTRIBUTES'));

    // Verify change event signature does not include raw card value
    assert.ok(content.includes('elementType: \'cardNumber\''));
    assert.ok(!content.includes('value: internalNumber')); // Never emits raw value to parent!
  });
});
