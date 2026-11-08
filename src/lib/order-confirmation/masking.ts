/**
 * Privacy & Data Masking Utilities.
 * Strictly shields PII from unauthorized exposure, shared devices, and calendar exports.
 */

/**
 * Masks an email address to format: "a***@domain.com"
 * Handles short usernames safely (e.g. "me@domain.com" -> "m***@domain.com").
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return 'customer@store.com';
  const [local, domain] = email.trim().split('@');
  if (!local || !domain) return 'customer@store.com';

  const firstChar = local.charAt(0);
  return `${firstChar}***@${domain.toLowerCase()}`;
}

/**
 * Masks phone numbers to show only the last 4 digits.
 * Example: "+91 98765 43210" -> "•••••• 3210"
 */
export function maskPhone(phone: string): string {
  if (!phone) return '•••••• ••••';
  const cleanDigits = phone.replace(/\D/g, '');
  if (cleanDigits.length < 4) return '•••••• ••••';
  const lastFour = cleanDigits.slice(-4);
  return `•••••• ${lastFour}`;
}

/**
 * Masks credit card or payment details.
 * Example: "Visa ending 4242"
 */
export function maskCardDetails(brand: string, last4: string): string {
  const cleanBrand = brand || 'Card';
  const cleanLast4 = (last4 || '••••').replace(/\D/g, '').slice(-4);
  return `${cleanBrand} ending in ${cleanLast4}`;
}

/**
 * Formats order placement timestamp localized and calm.
 * Example: "8 Nov 2026, 1:15 pm"
 */
export function formatOrderPlacedDate(
  isoString: string,
  locale: string = 'en-IN'
): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return '';
  }
}

/**
 * Formats order deadline (e.g. "Today at 6:00 pm" or "in 45 minutes").
 */
export function formatEditableDeadline(
  isoString?: string,
  locale: string = 'en-IN'
): string {
  if (!isoString) return '';
  try {
    const target = new Date(isoString);
    const now = new Date();
    if (isNaN(target.getTime()) || target.getTime() <= now.getTime()) {
      return '';
    }

    const diffHours = (target.getTime() - now.getTime()) / (1000 * 60 * 60);

    const timeFormatter = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const timeStr = timeFormatter.format(target).toLowerCase();

    if (diffHours < 24 && target.getDate() === now.getDate()) {
      return `today until ${timeStr}`;
    }

    return `until ${timeStr}`;
  } catch {
    return '';
  }
}
