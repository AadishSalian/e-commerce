import React from 'react';
import { BadgePresetKey, TrustPolicies } from '@/config/trustPolicies';

export type BadgeIconType = 'arrow-return' | 'truck' | 'shield' | 'brand-mark';

export type BadgeSizePreset = 'sm' | 'md' | 'lg' | 'responsive';

export type BadgeCornerPlacement = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'none';

export type BadgeDirection = 'clockwise' | 'counter-clockwise';

export interface RotatingBadgeProps {
  /**
   * Approved preset from trust policy configuration (e.g. 'returns-30', 'shipping-pan-india', 'warranty-2yr').
   * Staff choose from approved presets to ensure promises can never drift from legal policies.
   */
  preset?: BadgePresetKey;

  /**
   * Custom text phrase to wrap along the circular path.
   * If not provided, derived from `preset` or policy config.
   * Format example: "Free returns • 30 days"
   */
  text?: string;

  /**
   * Accessible description for assistive technology (aria-label).
   * Conveyed cleanly to screen readers once without reciting circular repetitions.
   */
  accessibleLabel?: string;

  /**
   * Center icon: select from pixel-crisp SVG presets or pass a custom React node.
   */
  icon?: BadgeIconType | React.ReactNode;

  /**
   * Optional target link URL.
   * When provided, the seal is interactive with an accessible link wrapper and focus ring.
   * When omitted, renders as a decorative non-interactive element.
   */
  href?: string;

  /**
   * Badge physical diameter in pixels (e.g. 108) or responsive preset.
   * Responsive default: 68px (mobile), 80px (tablet), 108px (desktop).
   */
  size?: number | BadgeSizePreset;

  /**
   * Duration in seconds per 360° revolution.
   * Calibrated for the matte system: default 24s, recommended range 18s - 30s.
   * Rotations under 12s feel frantic and compromise legibility.
   */
  speed?: number;

  /**
   * Rotation direction around the true center.
   * Default: 'clockwise'
   */
  direction?: BadgeDirection;

  /**
   * Placement corner within the relative hero container.
   * Default: 'bottom-right'. Set to 'none' for manual inline positioning.
   */
  corner?: BadgeCornerPlacement;

  /**
   * Custom separator character between phrase repetitions.
   * Default: '•' (bullet) or '✦' (star)
   */
  separator?: string;

  /**
   * Whether separator glyphs receive subtle theme accent coloring (`var(--accent)`).
   * Default: true
   */
  accentSeparators?: boolean;

  /**
   * Number of repetitions around the circle (usually 2 or 3).
   * When omitted, automatically computed to distribute characters seamlessly with zero seam.
   */
  repeats?: number;

  /**
   * Whether to display the subtle hairline inner circle.
   * Default: true
   */
  showInnerRing?: boolean;

  /**
   * Whether to display the matte surface disc backing with 1px border.
   * Default: true
   */
  showDisc?: boolean;

  /**
   * Entrance trigger flag.
   * Coordinates with hero entrance animations to fade/scale in after hero text reveals.
   * Default: true (or automatically delayed on mount)
   */
  entranceComplete?: boolean;

  /**
   * Subtle scroll velocity boost (off by default per restraint guidelines).
   * Default: false
   */
  enableScrollBoost?: boolean;

  /**
   * Minimum diameter in pixels before dropping the circular text ring
   * and displaying the compact static icon-only seal.
   * Default: 64
   */
  minTextDisplaySize?: number;

  /**
   * Optional explicit link to a trust policy key.
   * If the referenced policy is disabled or window is 0, the badge hides.
   */
  policyKey?: keyof TrustPolicies;

  /**
   * Optional CSS class name for custom layout wrapping.
   */
  className?: string;

  /**
   * Optional inline styles.
   */
  style?: React.CSSProperties;
}
