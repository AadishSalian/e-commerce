/**
 * Formatting and Caret Math Utilities for Payment Fields
 * Handles grouping, paste sanitization, caret position preservation,
 * expiry parsing, and advisory Luhn checksum.
 */

import { ExtendedCardBrandId } from './types';
import { CARD_BRAND_DEFINITIONS, sanitizeDigits } from './cardBrands';

export interface FormattedNumberWithCaret {
  formatted: string;
  caretIndex: number;
  rawDigits: string;
}

/**
 * Calculates visual grouping intervals for a given brand and raw digit count.
 */
export function getGroupingPattern(brand: ExtendedCardBrandId, digitCount: number): readonly number[] {
  if (brand === 'amex') {
    return [4, 6, 5];
  }
  if (brand === 'diners' && digitCount <= 14) {
    return [4, 6, 4];
  }
  // Standard 4-4-4-4 (up to 19 digits)
  return [4, 4, 4, 4, 4];
}

/**
 * Gets the maximum permitted raw digit length for a given brand.
 */
export function getMaxCardLength(brand: ExtendedCardBrandId): number {
  if (brand === 'unknown') return 19;
  const meta = CARD_BRAND_DEFINITIONS[brand];
  if (!meta) return 19;
  return Math.max(...meta.lengths);
}

/**
 * Formats a raw digit string according to brand grouping rules.
 */
export function formatCardNumber(
  digitsOrFormatted: string,
  brand: ExtendedCardBrandId = 'unknown'
): string {
  const digits = sanitizeDigits(digitsOrFormatted);
  const maxLength = getMaxCardLength(brand);
  const truncated = digits.slice(0, maxLength);

  const pattern = getGroupingPattern(brand, truncated.length);
  const parts: string[] = [];
  let currentIdx = 0;

  for (const groupSize of pattern) {
    if (currentIdx >= truncated.length) break;
    parts.push(truncated.slice(currentIdx, currentIdx + groupSize));
    currentIdx += groupSize;
  }

  // Any leftover if pattern didn't cover
  if (currentIdx < truncated.length) {
    parts.push(truncated.slice(currentIdx));
  }

  return parts.join(' ');
}

/**
 * Preserves caret position when typing, backspacing over spaces,
 * inserting in the middle, selecting & replacing, or pasting.
 *
 * Algorithm:
 * 1. Count how many raw digits were strictly before the old cursor in the input element.
 * 2. Sanitize and format the new text.
 * 3. Find the index in the newly formatted string immediately after that same number of raw digits.
 */
export function computeCaretPosition(
  oldValue: string,
  newValue: string,
  oldCaretIndex: number,
  formattedNewValue: string
): number {
  // If caret was at the very start
  if (oldCaretIndex <= 0) return 0;

  // Determine how many digits were before the caret in newValue before formatting
  const textBeforeCaret = newValue.slice(0, oldCaretIndex);
  const digitsBeforeCaret = sanitizeDigits(textBeforeCaret).length;

  if (digitsBeforeCaret === 0) {
    return 0;
  }

  // Traverse formattedNewValue until we have seen `digitsBeforeCaret` digits
  let digitsCount = 0;
  for (let i = 0; i < formattedNewValue.length; i++) {
    if (/\d/.test(formattedNewValue[i])) {
      digitsCount++;
      if (digitsCount === digitsBeforeCaret) {
        return i + 1;
      }
    }
  }

  return formattedNewValue.length;
}

/**
 * Full card number formatter with caret preservation.
 */
export function formatCardNumberWithCaret(
  rawOrFormatted: string,
  brand: ExtendedCardBrandId,
  oldValue: string,
  rawCaretIndex: number
): FormattedNumberWithCaret {
  const rawDigits = sanitizeDigits(rawOrFormatted);
  const maxLength = getMaxCardLength(brand);
  const truncatedDigits = rawDigits.slice(0, maxLength);
  const formatted = formatCardNumber(truncatedDigits, brand);

  const caretIndex = computeCaretPosition(
    oldValue,
    rawOrFormatted,
    rawCaretIndex,
    formatted
  );

  return {
    formatted,
    caretIndex,
    rawDigits: truncatedDigits,
  };
}

export interface ExpiryFormatResult {
  formatted: string;
  isValid: boolean;
  isComplete: boolean;
  error?: string;
  month?: number;
  year?: number;
}

/**
 * Formats and validates card expiry (MM / YY).
 * Handles single digit "3" -> "03 / ", month > 12 rejection,
 * 4-digit year truncation, and past date checking in user's timezone.
 */
export function formatExpiry(
  input: string,
  referenceDate: Date = new Date()
): ExpiryFormatResult {
  const digits = sanitizeDigits(input);

  if (digits.length === 0) {
    return {
      formatted: '',
      isValid: true,
      isComplete: false,
    };
  }

  let monthStr = '';
  let yearStr = '';

  // Single digit handling: if user enters '2' through '9' as first digit, auto-pad with 0
  if (digits.length === 1) {
    const firstDigit = parseInt(digits, 10);
    if (firstDigit >= 2 && firstDigit <= 9) {
      return {
        formatted: `0${firstDigit} / `,
        isValid: true,
        isComplete: false,
      };
    }
    return {
      formatted: digits,
      isValid: true,
      isComplete: false,
    };
  }

  // 2 or more digits
  monthStr = digits.slice(0, 2);
  const monthNum = parseInt(monthStr, 10);

  // Month validation
  if (monthNum === 0 || monthNum > 12) {
    return {
      formatted: monthStr,
      isValid: false,
      isComplete: false,
      error: 'Invalid month (must be 01–12)',
    };
  }

  if (digits.length === 2) {
    return {
      formatted: `${monthStr} / `,
      isValid: true,
      isComplete: false,
      month: monthNum,
    };
  }

  // Handle year digits (accept up to 4 digits, normalize to 2)
  const rawYear = digits.slice(2);
  if (rawYear.length <= 2) {
    yearStr = rawYear;
  } else if (rawYear.length === 4) {
    // 2028 -> 28
    yearStr = rawYear.slice(2, 4);
  } else {
    yearStr = rawYear.slice(0, 2);
  }

  const formatted = yearStr ? `${monthStr} / ${yearStr}` : `${monthStr} / `;
  const isComplete = yearStr.length === 2;

  if (!isComplete) {
    return {
      formatted,
      isValid: true,
      isComplete: false,
      month: monthNum,
    };
  }

  // Validate complete expiry against reference date in user timezone
  const fullYear = 2000 + parseInt(yearStr, 10);
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth() + 1; // 1-indexed

  if (fullYear < currentYear) {
    return {
      formatted,
      isValid: false,
      isComplete: true,
      error: 'Card has expired',
      month: monthNum,
      year: fullYear,
    };
  }

  if (fullYear === currentYear && monthNum < currentMonth) {
    return {
      formatted,
      isValid: false,
      isComplete: true,
      error: 'Card has expired',
      month: monthNum,
      year: fullYear,
    };
  }

  // Unreasonable far future (> 25 years)
  if (fullYear > currentYear + 25) {
    return {
      formatted,
      isValid: false,
      isComplete: true,
      error: 'Expiration year is too far in future',
      month: monthNum,
      year: fullYear,
    };
  }

  return {
    formatted,
    isValid: true,
    isComplete: true,
    month: monthNum,
    year: fullYear,
  };
}

/**
 * Formats CVV/CVC/CID/CVN code, capping by brand rule.
 */
export function formatSecurityCode(
  input: string,
  brand: ExtendedCardBrandId
): { value: string; isComplete: boolean; maxLength: number } {
  const digits = sanitizeDigits(input);
  const maxLength = brand === 'amex' ? 4 : 3;
  const truncated = digits.slice(0, maxLength);

  return {
    value: truncated,
    isComplete: truncated.length === maxLength,
    maxLength,
  };
}

/**
 * Standard Luhn algorithm (mod 10 checksum).
 * Used purely as an advisory early signal when card number reaches full length.
 */
export function validateLuhn(digitsOrFormatted: string): boolean {
  const digits = sanitizeDigits(digitsOrFormatted);
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let alternate = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) {
        n -= 9;
      }
    }
    sum += n;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}
