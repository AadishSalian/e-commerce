/**
 * Design tokens, mathematical utilities, and layout validators for SplitHero.
 * Calibrated for calm, precise motion in the matte aesthetic.
 */

import { SplitMotionTokens, SplitHalfConfig } from './types';

/**
 * Standard SPLIT motion tokens strictly adhering to specification.
 */
export const SPLIT: SplitMotionTokens = {
  /** Flex grow multiplier for each half at rest (50/50) */
  neutralGrow: 1,
  /** Flex grow multiplier for hovered/focused active half */
  expandedGrow: 7,
  /** Flex grow multiplier for compressed inactive half (about 70/30 total) */
  compressedGrow: 3,
  /** Transition duration for flex-grow expansion in seconds */
  duration: 0.7,
  /** Smooth cubic-bezier curve without overshoot/bounce: [0.65, 0, 0.35, 1] */
  ease: [0.65, 0, 0.35, 1] as const,
  /** Hover intent debounce delay in milliseconds */
  hoverIntentDelay: 90,
  /** Delay before returning to neutral 50/50 state when pointer leaves the hero */
  returnDelay: 300,
};

/**
 * Extended timing, layout, and accessibility tokens for SplitHero.
 */
export const SPLIT_HERO_TOKENS = {
  ...SPLIT,

  /** Underline drawing duration under active label in seconds */
  underlineDuration: 0.4,

  /** Underline easing curve */
  underlineEase: [0.65, 0, 0.35, 1] as const,

  /** Secondary text exit transition duration in seconds (cross-fade out) */
  textExitDuration: 0.15,

  /** Secondary text entrance transition duration in seconds (cross-fade in) */
  textEnterDuration: 0.3,

  /** Secondary text vertical rise on enter in pixels */
  textEnterRise: 10,

  /** Half entrance clip-in duration in seconds */
  entranceClipDuration: 0.7,

  /** Stagger delay between labels, descriptors, and CTAs during entrance */
  entranceStagger: 0.08,

  /** Total entrance sequence cap in seconds */
  entranceTotalSequence: 1.4,

  /** Minimum compressed half width ratio on desktop (28% constraint) */
  minCompressedRatio: 0.28,

  /** Viewport height threshold below which hover expansion is disabled (px) */
  shortViewportHeightThreshold: 560,

  /** Mobile layout switch breakpoint (px) */
  mobileBreakpoint: 768,

  /** Fixed width of the primary editorial text block on desktop (px) */
  fixedTextBlockWidthDesktop: 360,

  /** Fixed width of the primary editorial text block on mobile (px) */
  fixedTextBlockWidthMobile: 280,

  /** Maximum content container width on ultrawide monitors (px) */
  maxContentWidth: 1600,

  /** Maximum character length recommended for descriptors */
  descriptorMaxChars: 65,

  /** Default navbar height if in flow (px) */
  defaultNavbarHeight: '0px',
} as const;

/**
 * Validates that the halves array contains exactly two items.
 * Throws a descriptive error in development if misconfigured.
 */
export function validateHalvesCount(halves: unknown[]): halves is [SplitHalfConfig, SplitHalfConfig] {
  if (!Array.isArray(halves) || halves.length !== 2) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[SplitHero] Expected exactly 2 halves for split hero layout, but received ${
          Array.isArray(halves) ? halves.length : typeof halves
        }. Rendering fallback.`
      );
    }
    return false;
  }
  return true;
}

/**
 * Computes the target flex-grow value for a half given the active state.
 *
 * @param halfId The unique ID of the half
 * @param activeId The ID of the currently expanded half, or null for neutral
 * @returns 1 for neutral, 7 for expanded, 3 for compressed
 */
export function computeFlexGrow(halfId: string, activeId: string | null): number {
  if (!activeId) {
    return SPLIT.neutralGrow;
  }
  return activeId === halfId ? SPLIT.expandedGrow : SPLIT.compressedGrow;
}

/**
 * Computes the exact width percentage for a half given its flex-grow value.
 * In neutral state: 1 / (1 + 1) = 50%
 * In active state: 7 / (7 + 3) = 70% or 3 / (7 + 3) = 30%
 */
export function computeWidthPercentage(halfId: string, activeId: string | null): number {
  if (!activeId) {
    return 50;
  }
  return activeId === halfId ? 70 : 30;
}

/**
 * Checks whether a compressed ratio satisfies the desktop minimum accessibility constraint (>= 28%).
 */
export function isCompressedRatioAdequate(ratio: number): boolean {
  return ratio >= SPLIT_HERO_TOKENS.minCompressedRatio;
}

/**
 * Clamps a descriptor string to a clean word boundary with ellipsis if exceeding maxChars.
 */
export function clampDescriptor(text: string, maxChars: number = SPLIT_HERO_TOKENS.descriptorMaxChars): string {
  if (!text || text.length <= maxChars) {
    return text;
  }
  const truncated = text.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxChars * 0.7) {
    return `${truncated.slice(0, lastSpace)}…`;
  }
  return `${truncated}…`;
}

/**
 * Evaluates if a given viewport height is considered a "short viewport" (< 560px),
 * where hover expansion is disabled in favor of static 50/50 layout.
 */
export function isShortViewport(height: number): boolean {
  return height > 0 && height < SPLIT_HERO_TOKENS.shortViewportHeightThreshold;
}

/**
 * Generates the initial CSS clip-path inset for entrance sequencing.
 * Outer-edge reveal:
 * - Half 0 (left in LTR): clips from outer-left towards seam (inset(0 100% 0 0))
 * - Half 1 (right in LTR): clips from outer-right towards seam (inset(0 0 0 100%))
 * In RTL, these orientations mirror.
 */
export function getInitialClipPath(index: number, isRtl: boolean = false): string {
  const isLeft = index === 0;
  const isEffectiveLeft = isRtl ? !isLeft : isLeft;

  return isEffectiveLeft ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
}

/**
 * Target clip-path inset when entrance reveal completes.
 */
export function getFinalClipPath(): string {
  return 'inset(0 0% 0 0)';
}
