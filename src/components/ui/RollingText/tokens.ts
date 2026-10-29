/**
 * Motion tokens and utilities for RollingText hover animations.
 * Calibrated for a precise, quiet, restrained interaction in the Matte theme.
 */

// Duration in seconds (400ms fits cleanly in the 350-450ms spec)
export const ROLL_DURATION = 0.4;
export const ROLL_DURATION_MS = 400;

// Shared easing curve: strong ease-out cubic-bezier(0.65, 0, 0.35, 1)
// No springs, no overshoot, no bounce.
export const ROLL_EASING = [0.65, 0, 0.35, 1] as const;
export const ROLL_EASING_CSS = 'cubic-bezier(0.65, 0, 0.35, 1)';

// Stagger tokens for editorial hero and large navigation links
export const STAGGER_DEFAULT_DELAY = 0.02; // 20ms per character
export const STAGGER_MAX_TOTAL = 0.25; // 250ms max total stagger across the string

// Length cap: long labels degrade to plain text to protect layout and readability
export const MAX_LABEL_LENGTH = 24;

// Touch device press duration
export const TOUCH_ACTIVE_DURATION = 0.15; // 150ms

/**
 * Unicode ranges for scripts with cursive joining, complex conjuncts, or ligatures
 * where letter-by-letter splitting breaks rendering (Arabic, Devanagari, Tamil, Thai, etc.).
 */
export const COMPLEX_SCRIPTS_REGEX =
  /[\u0600-\u08FF\u0900-\u0DFF\u0E00-\u0E7F\u0E80-\u0EFF\u0F00-\u0FFF\u1000-\u109F\u1780-\u17FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Checks whether the text belongs to a script where character splitting breaks typography.
 */
export function isComplexScript(str: string): boolean {
  return COMPLEX_SCRIPTS_REGEX.test(str);
}

/**
 * Splits text into grapheme clusters using Intl.Segmenter where available,
 * correctly keeping emoji clusters, accented characters, and combining marks intact.
 */
export function splitGraphemes(text: string): string[] {
  if (!text) return [];
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), (s) => s.segment);
    } catch {
      // Fallback if Intl.Segmenter fails in a particular environment
    }
  }
  // Safe unicode-aware fallback splitting
  return Array.from(text);
}
