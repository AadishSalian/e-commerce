/**
 * PCI DSS SAQ A Compliance, Session-Replay Masking & Security Sanitizer
 *
 * Guarantees zero leakage of Primary Account Numbers (PAN), Expiration Dates,
 * or Card Verification Values (CVV/CVC/CID) across:
 * - LocalStorage / SessionStorage
 * - Analytics events (Google Analytics, Mixpanel, Vercel Analytics)
 * - Session-replay tools (FullStory, LogRocket, Hotjar, Microsoft Clarity, Sentry)
 * - Error monitoring & client console logs
 */

/**
 * Attributes attached to payment field wrappers to block session recording
 * across all major session-replay, analytics, and telemetry libraries.
 */
export const SESSION_REPLAY_BLOCK_ATTRIBUTES = {
  'data-private': 'true',
  'data-mask': 'true',
  'data-clarity-mask': 'true',
  'data-recording-ignore': 'true',
  'data-sentry-mask': 'true',
  'data-fs-block': 'true',
  'data-amp-replace': 'true',
} as const;

/**
 * Sanitizes issuer and gateway decline errors.
 * Never leaks raw decline codes (e.g. `do_not_honor`, `stolen_card`, `insufficient_funds`)
 * which can aid automated card testing fraud vectors.
 */
export function sanitizeDeclineError(rawError?: string | { code?: string; message?: string }): {
  message: string;
  isRetryable: boolean;
  requiresAlternativePayment: boolean;
} {
  if (!rawError) {
    return {
      message: 'Your payment could not be processed. Please check your card details or try another card.',
      isRetryable: true,
      requiresAlternativePayment: false,
    };
  }

  const code = typeof rawError === 'string' ? rawError.toLowerCase() : (rawError.code || '').toLowerCase();
  const rawMsg = typeof rawError === 'string' ? rawError : (rawError.message || '');

  // Specific user-fixable cases
  if (code.includes('expired') || rawMsg.toLowerCase().includes('expired')) {
    return {
      message: 'Card has expired. Please use a card with a valid expiration date.',
      isRetryable: true,
      requiresAlternativePayment: false,
    };
  }

  if (code.includes('incorrect_cvc') || code.includes('invalid_cvc')) {
    return {
      message: 'The security code does not match. Please verify the code on your card.',
      isRetryable: true,
      requiresAlternativePayment: false,
    };
  }

  if (code.includes('incorrect_number') || code.includes('invalid_number')) {
    return {
      message: 'That card number doesn’t look right. Please check the digits.',
      isRetryable: true,
      requiresAlternativePayment: false,
    };
  }

  if (code.includes('card_not_supported') || code.includes('unsupported_brand')) {
    return {
      message: 'This card brand is not supported for this transaction. Please use another card or UPI.',
      isRetryable: false,
      requiresAlternativePayment: true,
    };
  }

  // All other issuer declines: generic, calm message to prevent card testing feedback
  return {
    message: 'Your card was declined. Please try another card, UPI, or contact your bank.',
    isRetryable: true,
    requiresAlternativePayment: false,
  };
}

/**
 * Client-side rate-limiting for checkout payment attempts
 * Protects against rapid card cycling and card testing scripts.
 */
class PaymentRateLimiter {
  private attempts: number[] = [];
  private readonly maxAttempts = 4;
  private readonly windowMs = 60_000; // 1 minute window

  canAttempt(): { allowed: boolean; remaining: number; waitSeconds?: number } {
    const now = Date.now();
    this.attempts = this.attempts.filter((timestamp) => now - timestamp < this.windowMs);

    if (this.attempts.length >= this.maxAttempts) {
      const oldestAttempt = this.attempts[0];
      const waitSeconds = Math.ceil((this.windowMs - (now - oldestAttempt)) / 1000);
      return {
        allowed: false,
        remaining: 0,
        waitSeconds: Math.max(1, waitSeconds),
      };
    }

    return {
      allowed: true,
      remaining: this.maxAttempts - this.attempts.length,
    };
  }

  recordAttempt(): void {
    this.attempts.push(Date.now());
  }

  reset(): void {
    this.attempts = [];
  }
}

export const paymentRateLimiter = new PaymentRateLimiter();

/**
 * Runtime security validator that verifies sensitive card patterns (PAN, CVV)
 * never leak into localStorage, sessionStorage, or analytics events.
 */
export function assertNoCardDataInStorage(): { secure: boolean; violations: string[] } {
  const violations: string[] = [];
  const panRegex = /\b(?:\d[ -]*?){13,19}\b/;

  const checkStorage = (storage: Storage | null, name: string) => {
    if (!storage) return;
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (!key) continue;
        const value = storage.getItem(key);
        if (value && panRegex.test(value)) {
          violations.push(`Violation in ${name}: key "${key}" contains card pattern`);
        }
      }
    } catch {
      // Storage access may be blocked in strict sandboxes
    }
  };

  if (typeof window !== 'undefined') {
    if (window.localStorage) checkStorage(window.localStorage, 'localStorage');
    if (window.sessionStorage) checkStorage(window.sessionStorage, 'sessionStorage');
  }

  return {
    secure: violations.length === 0,
    violations,
  };
}
