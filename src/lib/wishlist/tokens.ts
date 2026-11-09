import crypto from 'crypto';

/**
 * Generate a 128-bit cryptographically unguessable, URL-safe random token.
 * Never uses sequential IDs, user IDs, or emails.
 */
export function generateShareToken(): string {
  return crypto.randomBytes(16).toString('base64url');
}

/**
 * SHA-256 hash of a share token for safe storage.
 * Even if the data store is read, raw share URLs cannot be enumerated.
 */
export function hashShareToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Calculate token expiration date based on selected option.
 */
export function computeExpirationDate(option: 'never' | 30 | 90): string | null {
  if (option === 'never') return null;
  const now = new Date();
  now.setDate(now.getDate() + option);
  return now.toISOString();
}

/**
 * Check if a share token has expired.
 */
export function isTokenExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

/**
 * Simple in-memory rate limiter for public share token endpoints
 * to protect against token enumeration or brute-force crawling.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkShareRateLimit(ipOrKey: string, maxRequests = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ipOrKey);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ipOrKey, { count: 1, resetAt: now + windowMs });
    return true; // Allowed
  }

  if (record.count >= maxRequests) {
    return false; // Rate limited
  }

  record.count += 1;
  return true; // Allowed
}
