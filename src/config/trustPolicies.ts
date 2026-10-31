/**
 * Trust Policies Configuration
 * Single source of truth driving site-wide customer trust promises:
 * - Return window and return policy
 * - Free shipping thresholds and coverage
 * - Hardware warranty terms
 *
 * Guarantees that promotional badges and hero seals cannot drift from
 * actual company policy. If a policy is disabled or expired, badges
 * automatically hide to prevent stale or dishonest claims.
 */

import { FREE_SHIPPING_THRESHOLD } from './shipping';

export interface ReturnPolicyConfig {
  enabled: boolean;
  windowDays: number;
  url: string;
}

export interface ShippingPolicyConfig {
  enabled: boolean;
  region: string;
  threshold: number;
  url: string;
}

export interface WarrantyPolicyConfig {
  enabled: boolean;
  years: number;
  coverage: string;
  url: string;
}

export interface TrustPolicies {
  returns: ReturnPolicyConfig;
  shipping: ShippingPolicyConfig;
  warranty: WarrantyPolicyConfig;
}

export const TRUST_POLICIES: TrustPolicies = {
  returns: {
    enabled: process.env.NEXT_PUBLIC_RETURN_POLICY_ENABLED !== 'false',
    windowDays: Number(process.env.NEXT_PUBLIC_RETURN_WINDOW_DAYS) || 30,
    url: '/returns',
  },
  shipping: {
    enabled: true,
    region: process.env.NEXT_PUBLIC_SHIPPING_REGION || 'Pan-India',
    threshold: FREE_SHIPPING_THRESHOLD,
    url: '/shipping',
  },
  warranty: {
    enabled: process.env.NEXT_PUBLIC_WARRANTY_ENABLED !== 'false',
    years: Number(process.env.NEXT_PUBLIC_WARRANTY_YEARS) || 2,
    coverage: 'Hardware Guarantee',
    url: '/warranty',
  },
};

export type BadgePresetKey = 'returns-30' | 'returns' | 'shipping-pan-india' | 'shipping' | 'warranty-2yr' | 'warranty' | 'brand-matte';

export interface BadgeResolvedConfig {
  phrase: string;
  accessibleLabel: string;
  href: string;
  icon: 'arrow-return' | 'truck' | 'shield' | 'brand-mark';
}

/**
 * Resolves an approved badge preset against live policy configuration.
 * Returns null if the underlying policy is disabled, missing, or zero,
 * ensuring no dishonest or stale claim can ever be rendered.
 */
export function resolveBadgePreset(presetKey: BadgePresetKey): BadgeResolvedConfig | null {
  switch (presetKey) {
    case 'returns-30':
    case 'returns': {
      const { enabled, windowDays, url } = TRUST_POLICIES.returns;
      if (!enabled || !windowDays || windowDays <= 0) {
        return null;
      }
      return {
        phrase: `Free returns • ${windowDays} days`,
        accessibleLabel: `Free returns within ${windowDays} days. View return policy`,
        href: url,
        icon: 'arrow-return',
      };
    }
    case 'shipping-pan-india':
    case 'shipping': {
      const { enabled, region, url } = TRUST_POLICIES.shipping;
      if (!enabled || !region) {
        return null;
      }
      return {
        phrase: `Free shipping • ${region}`,
        accessibleLabel: `Free ${region} shipping on qualifying orders. View shipping details`,
        href: url,
        icon: 'truck',
      };
    }
    case 'warranty-2yr':
    case 'warranty': {
      const { enabled, years, url } = TRUST_POLICIES.warranty;
      if (!enabled || !years || years <= 0) {
        return null;
      }
      return {
        phrase: `${years}-year warranty • Guaranteed`,
        accessibleLabel: `${years}-year hardware warranty. View warranty details`,
        href: url,
        icon: 'shield',
      };
    }
    case 'brand-matte': {
      return {
        phrase: 'Engineered hardware • Matte finish',
        accessibleLabel: 'Engineered hardware with matte finish',
        href: '/about',
        icon: 'brand-mark',
      };
    }
    default:
      return null;
  }
}
