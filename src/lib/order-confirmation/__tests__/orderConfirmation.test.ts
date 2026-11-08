import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  maskEmail,
  maskPhone,
  maskCardDetails,
  formatOrderPlacedDate,
} from '../masking';
import {
  generateIcsContent,
  buildGoogleCalendarUrl,
  buildOutlookWebUrl,
  foldIcsLine,
  escapeIcsText,
  computeNextDay,
} from '../calendar';
import { calculateDeliveryEstimate } from '../deliveryEstimator';
import {
  getOrderById,
  verifyOrderAccess,
  lookupOrderByEmailAndNumber,
  updateOrderShippingAddress,
} from '../service';

describe('Order Confirmation: Privacy & Data Masking', () => {
  it('masks emails properly as a***@domain.com without leaking names', () => {
    assert.strictEqual(maskEmail('aadis.sharma@gmail.com'), 'a***@gmail.com');
    assert.strictEqual(maskEmail('rohit@yahoo.co.in'), 'r***@yahoo.co.in');
    assert.strictEqual(maskEmail('z@matte.store'), 'z***@matte.store');
    assert.strictEqual(maskEmail(''), 'customer@store.com');
  });

  it('masks phone numbers displaying only the final 4 digits', () => {
    assert.strictEqual(maskPhone('+91 98765 43210'), '•••••• 3210');
    assert.strictEqual(maskPhone('9876543210'), '•••••• 3210');
    assert.strictEqual(maskPhone(''), '•••••• ••••');
  });

  it('masks card details cleanly without exposing full PAN', () => {
    assert.strictEqual(maskCardDetails('Visa', '4242'), 'Visa ending in 4242');
    assert.strictEqual(maskCardDetails('Mastercard', '8842'), 'Mastercard ending in 8842');
  });

  it('formats placed timestamp in calm localized format', () => {
    const formatted = formatOrderPlacedDate('2026-11-08T12:00:00Z', 'en-IN');
    assert.ok(formatted.length > 5);
    assert.match(formatted, /2026/);
  });
});

describe('Order Confirmation: Access Control & Anti-IDOR Security', () => {
  const confirmedOrder = getOrderById('ORD-948271')!;
  assert.ok(confirmedOrder, 'Seed order must exist');

  it('allows access to authenticated session owner', () => {
    const access = verifyOrderAccess(confirmedOrder, { userId: 'usr-demo-1' });
    assert.strictEqual(access.allowed, true);
    assert.strictEqual(access.isOwner, true);
  });

  it('rejects access when logged in as a different user without token', () => {
    const access = verifyOrderAccess(confirmedOrder, { userId: 'usr-intruder-99' });
    assert.strictEqual(access.allowed, false);
    assert.strictEqual(access.reason, 'missing_token');
  });

  it('allows access to guest presenting valid unexpired guestAccessToken', () => {
    const access = verifyOrderAccess(confirmedOrder, {
      guestToken: '7f9a8b1c4d2e3f4a5b6c7d8e9f0a1b2c',
    });
    assert.strictEqual(access.allowed, true);
    assert.strictEqual(access.isOwner, false);
  });

  it('rejects guessable or incorrect token to prevent enumeration', () => {
    const access = verifyOrderAccess(confirmedOrder, {
      guestToken: 'wrong-guessable-token-1234',
    });
    assert.strictEqual(access.allowed, false);
    assert.strictEqual(access.reason, 'unauthorized');
  });

  it('rejects access when token has expired', () => {
    const expiredOrder = getOrderById('ORD-EXPIRED-TOKEN')!;
    assert.ok(expiredOrder);
    const access = verifyOrderAccess(expiredOrder, {
      guestToken: 'expiredtoken1234567890abcdef1234',
    });
    assert.strictEqual(access.allowed, false);
    assert.strictEqual(access.reason, 'token_expired');
  });

  it('prevents account enumeration during friendly order lookup', () => {
    const resultExisting = lookupOrderByEmailAndNumber('aadis.sharma@gmail.com', 'ORD-948271');
    const resultMissing = lookupOrderByEmailAndNumber('unknown@random.org', 'ORD-999999');

    // Both return generic success to prevent email harvesting
    assert.strictEqual(resultExisting.success, true);
    assert.strictEqual(resultMissing.success, true);
    assert.ok(resultExisting.message.includes('ORD-948271'));
    assert.ok(resultMissing.message.includes('ORD-999999'));
  });
});

describe('Order Confirmation: RFC 5545 iCalendar Correctness', () => {
  const testPayload = {
    orderId: 'ORD-948271',
    shipmentTitle: 'Shipment 1',
    startDate: '2026-11-12',
    endDate: '2026-11-14',
    isEstimate: true,
    trackingUrl: 'https://matte.store/track/123',
    sequence: 1,
  };

  it('computes correct non-inclusive next day for RFC 5545 VALUE=DATE DTEND', () => {
    // Range ending on Nov 14 must have DTEND = Nov 15
    const dtend = computeNextDay('2026-11-14');
    assert.strictEqual(dtend, '20261115');

    // Month boundary: Nov 30 -> Dec 01
    const dtendMonth = computeNextDay('2026-11-30');
    assert.strictEqual(dtendMonth, '20261201');
  });

  it('escapes special iCalendar characters per RFC 5545 Section 3.3.11', () => {
    const unescaped = 'Hello, world; with backslash \\ and \n newline';
    const escaped = escapeIcsText(unescaped);
    assert.strictEqual(escaped, 'Hello\\, world\\; with backslash \\\\ and \\n newline');
  });

  it('folds lines exceeding 75 octets with CRLF and single space continuation', () => {
    const longLine =
      'DESCRIPTION:This is an extremely detailed and verbose description of an order that clearly exceeds seventy five octets in total length and requires RFC folding.';
    const folded = foldIcsLine(longLine);
    assert.ok(folded.includes('\r\n '));
    const lines = folded.split('\r\n');
    for (let i = 0; i < lines.length; i++) {
      const lineLen = Buffer.byteLength(lines[i], 'utf8');
      assert.ok(lineLen <= 75, `Line ${i} length ${lineLen} exceeds 75 octets`);
    }
  });

  it('generates fully compliant RFC 5545 .ics text with strictly CRLF line endings', () => {
    const ics = generateIcsContent(testPayload, new Date('2026-11-08T12:00:00Z'));

    // Check CRLF endings
    assert.ok(ics.includes('\r\n'));
    assert.ok(!ics.replace(/\r\n/g, '').includes('\n'), 'Must contain zero standalone LF characters');

    // Check core properties
    assert.ok(ics.includes('BEGIN:VCALENDAR'));
    assert.ok(ics.includes('VERSION:2.0'));
    assert.ok(ics.includes('UID:order-ORD-948271@matte.store'));
    assert.ok(ics.includes('SEQUENCE:1'));
    assert.ok(ics.includes('DTSTART;VALUE=DATE:20261112'));
    assert.ok(ics.includes('DTEND;VALUE=DATE:20261115'));
    assert.ok(ics.includes('TRIGGER:-P1D')); // Morning before reminder
    assert.ok(ics.includes('END:VCALENDAR'));

    // Excludes PII (ensures address and customer phone do not leak into shared calendars)
    assert.doesNotMatch(ics, /Oberoi Crest|Andheri West|98765 43210/);
  });

  it('generates proper Google Calendar and Outlook Web template URLs', () => {
    const googleUrl = buildGoogleCalendarUrl(testPayload);
    assert.ok(googleUrl.startsWith('https://calendar.google.com/calendar/render'));
    assert.ok(googleUrl.includes('dates=20261112%2F20261115'));
    assert.ok(googleUrl.includes('Order+%23ORD-948271'));

    const outlookUrl = buildOutlookWebUrl(testPayload);
    assert.ok(outlookUrl.startsWith('https://outlook.live.com/calendar/0/action/compose'));
    assert.ok(outlookUrl.includes('startdt=2026-11-12'));
    assert.ok(outlookUrl.includes('enddt=2026-11-14'));
    assert.ok(outlookUrl.includes('allday=true'));
  });
});

describe('Order Confirmation: Logistics Estimates & Lead Times', () => {
  const baseDate = new Date('2026-11-08T12:00:00Z');

  it('adds production lead time for personalized items', () => {
    const standard = calculateDeliveryEstimate({
      orderPlacedDate: baseDate,
      hasPersonalizedItems: false,
    });
    const personalized = calculateDeliveryEstimate({
      orderPlacedDate: baseDate,
      hasPersonalizedItems: true,
      maxProductionDays: 3,
    });

    assert.ok(personalized.leadTimeDays > standard.leadTimeDays);
    assert.strictEqual(personalized.leadTimeDays - standard.leadTimeDays, 3);
  });

  it('formats range as honest non-hyped plain text', () => {
    const estimate = calculateDeliveryEstimate({
      orderPlacedDate: baseDate,
      shippingMethod: 'standard',
    });
    assert.ok(estimate.formattedDisplay.includes(' to '));
    assert.strictEqual(estimate.isEstimate, true);
  });
});

describe('Order Confirmation: Address Editing & Modifiability Rules', () => {
  it('allows address update within active editable window for authenticated owner', () => {
    const newAddress = {
      line1: '901 Signature Tower',
      city: 'Mumbai',
      state: 'Maharashtra',
      zip: '400051',
      country: 'India',
    };
    const res = updateOrderShippingAddress('ORD-948271', newAddress, { userId: 'usr-demo-1' });
    assert.strictEqual(res.success, true);

    const updated = getOrderById('ORD-948271')!;
    assert.strictEqual(updated.customer.shippingAddress.line1, '901 Signature Tower');
  });

  it('rejects address update when unauthorized', () => {
    const res = updateOrderShippingAddress(
      'ORD-948271',
      { line1: 'Hack St', city: '', state: '', zip: '', country: '' },
      { userId: 'usr-unauthorized' }
    );
    assert.strictEqual(res.success, false);
    assert.match(res.error || '', /unauthorized/i);
  });
});
