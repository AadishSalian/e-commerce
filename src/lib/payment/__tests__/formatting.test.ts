import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatCardNumber,
  formatCardNumberWithCaret,
  computeCaretPosition,
  formatExpiry,
  formatSecurityCode,
  validateLuhn,
} from '../formatting';

describe('Payment Formatting: Card Number Grouping Patterns', () => {
  it('formats standard 16-digit cards into 4-4-4-4 blocks', () => {
    assert.strictEqual(
      formatCardNumber('4242424242424242', 'visa'),
      '4242 4242 4242 4242'
    );
    assert.strictEqual(
      formatCardNumber('5500000000000004', 'mastercard'),
      '5500 0000 0000 0004'
    );
    assert.strictEqual(
      formatCardNumber('6080123456789012', 'rupay'),
      '6080 1234 5678 9012'
    );
  });

  it('formats American Express 15-digit cards into 4-6-5 blocks', () => {
    assert.strictEqual(
      formatCardNumber('378282246310005', 'amex'),
      '3782 822463 10005'
    );
  });

  it('formats Diners Club 14-digit cards into 4-6-4 blocks', () => {
    assert.strictEqual(
      formatCardNumber('30001234567890', 'diners'),
      '3000 123456 7890'
    );
  });

  it('formats 19-digit cards cleanly with trailing group', () => {
    assert.strictEqual(
      formatCardNumber('4242424242424242123', 'visa'),
      '4242 4242 4242 4242 123'
    );
  });

  it('strips dashes, spaces, and non-digits automatically', () => {
    assert.strictEqual(
      formatCardNumber('4242-4242-4242-4242', 'visa'),
      '4242 4242 4242 4242'
    );
    assert.strictEqual(
      formatCardNumber('4242.4242.4242.4242', 'visa'),
      '4242 4242 4242 4242'
    );
    assert.strictEqual(
      formatCardNumber('4242 4242 4242 4242', 'visa'),
      '4242 4242 4242 4242'
    );
  });
});

describe('Payment Formatting: Caret Position Preservation', () => {
  it('places caret after newly formatted space when 5th digit is appended', () => {
    // User had "4242", typed "1" -> raw "42421", formatted "4242 1"
    const caret = computeCaretPosition('4242', '42421', 5, '4242 1');
    assert.strictEqual(caret, 6); // After the '1'
  });

  it('preserves caret when deleting in the middle and does NOT jump to end', () => {
    // "4242 4242 4242 4242"
    // User deletes a digit at index 7 (middle)
    const oldVal = '4242 4242 4242 4242';
    const newVal = '4242 442 4242 4242';
    const caret = computeCaretPosition(oldVal, newVal, 6, '4242 4424 2424 2');
    // Caret stays at position 6, never jumping to end (16)
    assert.strictEqual(caret, 6);
  });

  it('naturally handles backspacing over a space', () => {
    // "4242 |4242" -> backspace deletes preceding digit '2' -> "424|4242"
    const oldVal = '4242 4242';
    const newVal = '424 4242'; // backspace removed the '2' at pos 4
    const formatted = formatCardNumber(newVal, 'visa'); // "4244 242"
    const caret = computeCaretPosition(oldVal, newVal, 3, formatted);
    assert.strictEqual(caret, 3);
  });

  it('maintains caret position when pasting strings containing spaces or hyphens', () => {
    const rawPaste = '4242-4242-4242-4242';
    const result = formatCardNumberWithCaret(rawPaste, 'visa', '', rawPaste.length);
    assert.strictEqual(result.formatted, '4242 4242 4242 4242');
    assert.strictEqual(result.caretIndex, 19);
  });
});

describe('Payment Formatting: Expiry Date Parsing & Localized Validation', () => {
  const mockNow = new Date('2026-11-11T12:00:00Z');

  it('auto-pads single digit months between 2 and 9 with leading zero', () => {
    const res = formatExpiry('3', mockNow);
    assert.strictEqual(res.formatted, '03 / ');
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.isComplete, false);
  });

  it('rejects month values above 12', () => {
    const res = formatExpiry('13', mockNow);
    assert.strictEqual(res.isValid, false);
    assert.match(res.error || '', /Invalid month/);
  });

  it('normalizes 4-digit years to 2 digits', () => {
    const res = formatExpiry('122028', mockNow);
    assert.strictEqual(res.formatted, '12 / 28');
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.isComplete, true);
  });

  it('accepts the current month and year as valid (not expired)', () => {
    // Reference is November 2026 -> 11/26 should be VALID
    const res = formatExpiry('1126', mockNow);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.isComplete, true);
  });

  it('marks past months in the current year as expired', () => {
    // 10/26 in Nov 2026 is expired
    const res = formatExpiry('1026', mockNow);
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.error, 'Card has expired');
  });

  it('marks past years as expired', () => {
    // 12/24 in 2026 is expired
    const res = formatExpiry('1224', mockNow);
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.error, 'Card has expired');
  });

  it('accepts future valid dates', () => {
    const res = formatExpiry('0829', mockNow);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.isComplete, true);
  });
});

describe('Payment Formatting: Security Code Rules by Brand', () => {
  it('enforces 4 digits for American Express (CID)', () => {
    const amex = formatSecurityCode('12345', 'amex');
    assert.strictEqual(amex.value, '1234');
    assert.strictEqual(amex.isComplete, true);
    assert.strictEqual(amex.maxLength, 4);
  });

  it('enforces 3 digits for Visa, Mastercard, and RuPay (CVV/CVC)', () => {
    const visa = formatSecurityCode('1234', 'visa');
    assert.strictEqual(visa.value, '123');
    assert.strictEqual(visa.isComplete, true);
    assert.strictEqual(visa.maxLength, 3);

    const rupay = formatSecurityCode('9876', 'rupay');
    assert.strictEqual(rupay.value, '987');
    assert.strictEqual(rupay.isComplete, true);
    assert.strictEqual(rupay.maxLength, 3);
  });
});

describe('Payment Formatting: Luhn Checksum Algorithm', () => {
  it('validates official test card numbers', () => {
    // Standard Stripe test cards
    assert.strictEqual(validateLuhn('4242424242424242'), true);
    assert.strictEqual(validateLuhn('5555555555554444'), true);
    assert.strictEqual(validateLuhn('378282246310005'), true);
  });

  it('rejects numbers that fail Luhn checksum', () => {
    assert.strictEqual(validateLuhn('4242424242424241'), false);
    assert.strictEqual(validateLuhn('5555555555554443'), false);
    assert.strictEqual(validateLuhn('1234567812345678'), false);
  });
});
