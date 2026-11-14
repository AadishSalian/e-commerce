/**
 * Shared Motion Tokens for Optimistic UI & Framer Motion
 * Adheres strictly to:
 * - Shared easing: [0.16, 1, 0.3, 1] (calm, precise, no bounce)
 * - Durations: 150ms-250ms for micro-interactions, 1.2s for "Added" morph window
 * - Reduced motion fallbacks (transform = none, simple opacity fades)
 */

export const OPTIMISTIC_EASING = [0.16, 1, 0.3, 1] as const;

export const MOTION_TOKENS = {
  buttonPressScale: 0.97,
  addedStateDurationMs: 1200,
  lineEnterExitDurationSec: 0.25,
  badgeSettleDurationSec: 0.2,
  digitSlideDistancePx: 8,
  easing: OPTIMISTIC_EASING,
};
