/**
 * Notification Validation, Sanitization, and Security Allow-lists
 * Prevents arbitrary redirect injections, text tampering, and data leakage.
 */

const ALLOWED_ROUTE_PREFIXES = [
  '/account',
  '/checkout/success',
  '/products',
  '/wishlist',
  '/notifications',
];

/**
 * Validates and normalizes deep links against a strict allow-list.
 * Malformed or malicious external URLs are rejected and mapped to a safe internal fallback.
 */
export function validateDeepLink(link: unknown, fallback: string = '/notifications'): string {
  if (typeof link !== 'string' || !link.trim()) {
    return fallback;
  }

  const clean = link.trim();

  // Strictly disallow external protocols, protocol-relative URLs, javascript, and data URIs
  if (
    clean.startsWith('//') ||
    clean.startsWith('http://') ||
    clean.startsWith('https://') ||
    clean.toLowerCase().startsWith('javascript:') ||
    clean.toLowerCase().startsWith('data:') ||
    clean.toLowerCase().startsWith('vbscript:')
  ) {
    return fallback;
  }

  // Must begin with a single slash
  if (!clean.startsWith('/')) {
    return fallback;
  }

  // Parse path component before query parameters or hash
  const questionIdx = clean.indexOf('?');
  const hashIdx = clean.indexOf('#');
  let endIdx = clean.length;
  if (questionIdx !== -1 && hashIdx !== -1) {
    endIdx = Math.min(questionIdx, hashIdx);
  } else if (questionIdx !== -1) {
    endIdx = questionIdx;
  } else if (hashIdx !== -1) {
    endIdx = hashIdx;
  }

  const pathname = clean.substring(0, endIdx);

  // Match against allowed prefixes
  const isAllowed = ALLOWED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  return isAllowed ? clean : fallback;
}

/**
 * Strips HTML, escapes HTML special characters, and truncates text cleanly.
 * Guarantees untrusted user-supplied data (such as wishlist titles) cannot inject HTML.
 */
export function sanitizeNotificationText(text: unknown, maxLength: number = 120): string {
  if (typeof text !== 'string') return '';

  // Remove potential script/html tags
  let cleaned = text.replace(/<[^>]*>?/gm, '');

  // Escape HTML characters
  cleaned = cleaned
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  // Normalize excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  // Clean word break truncation
  const truncated = cleaned.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + '…';
  }
  return truncated + '…';
}

/**
 * Checks if a price drop qualifies as a truthful, meaningful drop.
 * Rules:
 * 1. Must be in same currency and minor units.
 * 2. New price must be strictly less than old price.
 * 3. Percentage drop must meet or exceed the threshold (default 5%).
 */
export function isPriceDropSignificant(
  oldPriceMinor: number,
  newPriceMinor: number,
  thresholdPercent: number = 5
): boolean {
  if (!oldPriceMinor || !newPriceMinor || oldPriceMinor <= 0 || newPriceMinor <= 0) {
    return false;
  }

  if (newPriceMinor >= oldPriceMinor) {
    return false;
  }

  const dropAmount = oldPriceMinor - newPriceMinor;
  const dropPercent = (dropAmount / oldPriceMinor) * 100;

  return dropPercent >= thresholdPercent;
}

/**
 * Ensures sensitive private details (such as full PANs or complete emails) never leak into notification text.
 */
export function scrubSensitiveDetails(text: string): string {
  if (!text) return '';

  // Scrub potential 13-19 digit card numbers
  let scrubbed = text.replace(/\b(?:\d[ -]*?){13,19}\b/g, '•••• ••••');

  // Scrub full email addresses to privacy form
  scrubbed = scrubbed.replace(/([a-zA-Z0-9_\-.]+)@([a-zA-Z0-9_\-.]+)/g, (match, user, domain) => {
    if (user.length <= 1) return `*@${domain}`;
    return `${user[0]}***@${domain}`;
  });

  return scrubbed;
}

/**
 * Formats a relative timestamp calmly (e.g. "Just now", "25m ago", "3h ago", "Yesterday", "4d ago").
 */
export function formatRelativeTime(
  timestamp: string | number | Date,
  referenceDate: Date = new Date()
): string {
  const date = typeof timestamp === 'string' || typeof timestamp === 'number'
    ? new Date(timestamp)
    : timestamp;

  const nowMs = referenceDate.getTime();
  const timeMs = date.getTime();
  const diffSec = Math.max(0, Math.floor((nowMs - timeMs) / 1000));

  if (diffSec < 60) {
    return 'Just now';
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) {
    return `${diffWeeks}w ago`;
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Categorizes a date into feed grouping ("Today", "Yesterday", "Earlier").
 */
export function getFeedDayGroup(
  timestamp: string | number | Date,
  referenceDate: Date = new Date()
): 'Today' | 'Yesterday' | 'Earlier' {
  const date = typeof timestamp === 'string' || typeof timestamp === 'number'
    ? new Date(timestamp)
    : timestamp;

  const refDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate()).getTime();
  const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  const dayDiff = Math.floor((refDay - itemDay) / (24 * 60 * 60 * 1000));

  if (dayDiff <= 0) return 'Today';
  if (dayDiff === 1) return 'Yesterday';
  return 'Earlier';
}
