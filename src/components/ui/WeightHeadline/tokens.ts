/**
 * Motion tokens and mathematical utilities for the WeightHeadline proximity effect.
 * Strictly calibrated for the matte design system: restrained, subtle, and layout-stable.
 */

export const WEIGHT_FX = {
  /** Standard resting weight for light mode (dark text on light background) */
  baseWeight: 400,

  /** Resting weight for dark mode (adjusted slightly lighter to compensate for halation) */
  baseWeightDark: 380,

  /** Peak weight near the cursor. Kept narrow (+150 to +240 units) to avoid jitter or reflow */
  maxWeight: 620,

  /** Radius in pixels from the cursor where the weight effect fades to zero */
  radius: 180,

  /** Falloff shape: smoothstep ensures zero slope at both ends (no hard edge, no sudden snap) */
  curve: 'smoothstep' as const,

  /** Critically damped spring physics: fast settling, zero overshoot */
  spring: {
    stiffness: 180,
    damping: 26,
    mass: 0.7,
  },

  /** Maximum character / grapheme count allowed before falling back to Mode A / static */
  maxLetterCount: 40,

  /** Variable font axis min clamp (Inter variable font axis) */
  minFontWeight: 100,

  /** Variable font axis max clamp (Inter variable font axis) */
  maxFontWeight: 900,

  /** Touch ease-in duration on first viewport entry */
  touchEntryDuration: 0.6, // 600ms
} as const;

/**
 * Standard smoothstep polynomial: 3t^2 - 2t^3 for t in [0, 1].
 * Returns a value in [0, 1] with zero first derivative at both 0 and 1.
 */
export function smoothstep(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
}

/**
 * Computes proximity weight given a distance from the cursor.
 * - distance <= 0: returns maxWeight
 * - distance >= radius: returns baseWeight
 * - between: smoothly interpolates using smoothstep
 */
export function computeProximityWeight(
  distance: number,
  radius: number = WEIGHT_FX.radius,
  baseWeight: number = WEIGHT_FX.baseWeight,
  maxWeight: number = WEIGHT_FX.maxWeight,
  curve: 'smoothstep' | 'linear' = WEIGHT_FX.curve
): number {
  if (distance <= 0) return maxWeight;
  if (distance >= radius) return baseWeight;

  const t = Math.max(0, Math.min(1, 1 - distance / radius));
  const factor = curve === 'smoothstep' ? smoothstep(t) : t;
  const computed = baseWeight + (maxWeight - baseWeight) * factor;

  // Clamp within the font's physical axis range
  return Math.min(
    WEIGHT_FX.maxFontWeight,
    Math.max(WEIGHT_FX.minFontWeight, Math.round(computed * 10) / 10)
  );
}

export interface BoundingRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Calculates Euclidean distance from point (x, y) to a 2D bounding rectangle.
 * Returns 0 if (x, y) is inside the rectangle.
 */
export function distanceToRect(x: number, y: number, rect: BoundingRect): number {
  const dx = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
  const dy = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
  return Math.hypot(dx, dy);
}

/**
 * Calculates Euclidean distance from point (x, y) to point (px, py).
 */
export function distanceToPoint(x: number, y: number, px: number, py: number): number {
  return Math.hypot(x - px, y - py);
}

/**
 * Unicode ranges for scripts with cursive joining, complex conjuncts, or ligatures
 * where letter-by-letter splitting breaks typographical shaping (Arabic, Devanagari, Tamil, Thai, etc.).
 */
export const COMPLEX_SCRIPTS_REGEX =
  /[\u0600-\u08FF\u0900-\u0DFF\u0E00-\u0E7F\u0E80-\u0EFF\u0F00-\u0FFF\u1000-\u109F\u1780-\u17FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Checks whether text contains joined or complex scripts that must not be split per-letter.
 */
export function isComplexScript(str: string): boolean {
  return COMPLEX_SCRIPTS_REGEX.test(str);
}

/**
 * Splits text into user-perceived grapheme clusters using Intl.Segmenter,
 * keeping multi-code-point characters, emoji clusters, and combined marks intact.
 */
export function splitGraphemes(text: string): string[] {
  if (!text) return [];
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), (s) => s.segment);
    } catch {
      // Fallback if segmenter throws
    }
  }
  return Array.from(text);
}
