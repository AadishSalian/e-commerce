/**
 * Mathematical tokens, geometric constants, and text utilities for RotatingBadge.
 * Calibrated for a quiet, matte, and precise aesthetic.
 */

export const BADGE_FX = {
  /** Square SVG viewBox dimension (whole number for crisp scaling) */
  viewBoxSize: 120,

  /** Center coordinate (cx, cy) */
  center: 60,

  /** Outer matte disc radius (leaving 1px stroke inside 120x120 viewBox) */
  outerDiscRadius: 58,

  /** Hairline inner ring radius */
  innerRingRadius: 28,

  /** Radius of circular text path centered in the disc annulus */
  textPathRadius: 43.5,

  /** Exact mathematical path circumference: 2 * π * 43.5 ≈ 273.3185 px */
  circumference: 2 * Math.PI * 43.5,

  /** Default revolution period in seconds (quiet, slow pace) */
  defaultSpeed: 24,

  /** Safe speed bounds to guarantee legibility and prevent frantic spinning */
  minSpeed: 12,
  maxSpeed: 36,

  /** SVG text typography tokens */
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.14em',

  /** Separator default glyph */
  defaultSeparator: '•',

  /** Size below which the circular text ring is omitted to preserve legibility */
  minTextDisplaySize: 64,

  /** Entrance animation timing */
  entranceDuration: 0.5,
  entranceEase: [0.16, 1, 0.3, 1] as const,

  /** Spring physics for hover & focus deceleration */
  springDeceleration: {
    stiffness: 120,
    damping: 20,
    mass: 0.5,
  },
} as const;

/**
 * Generates an exact 360° circular SVG path starting at 12 o'clock.
 * Uses two 180° arcs to avoid zero-length arc degeneracies.
 */
export function getCircularPathData(
  r: number = BADGE_FX.textPathRadius,
  cx: number = BADGE_FX.center,
  cy: number = BADGE_FX.center,
  direction: 'clockwise' | 'counter-clockwise' = 'clockwise'
): string {
  const sweep = direction === 'counter-clockwise' ? 0 : 1;
  const topY = cy - r;
  const bottomY = cy + r;
  return `M ${cx} ${topY} A ${r} ${r} 0 0 ${sweep} ${cx} ${bottomY} A ${r} ${r} 0 0 ${sweep} ${cx} ${topY}`;
}

export interface FormattedCircularTextResult {
  fullText: string;
  unitText: string;
  repeats: number;
  separator: string;
  characterCount: number;
}

/**
 * Normalizes and repeats a phrase to wrap evenly around the circular track.
 * Ensures that the gap between the end of the last repeat and the start of the first
 * matches the interior gaps with identical spacing and separator glyphs.
 */
export function formatSeamlessCircularText(
  phrase: string,
  separator: string = BADGE_FX.defaultSeparator,
  explicitRepeats?: number
): FormattedCircularTextResult {
  if (!phrase || !phrase.trim()) {
    return {
      fullText: '',
      unitText: '',
      repeats: 0,
      separator,
      characterCount: 0,
    };
  }

  // Strip leading and trailing whitespace and existing edge separators
  const cleanSeparator = separator.trim();
  const sepRegex = new RegExp(`^[\\s${cleanSeparator}]+|[\\s${cleanSeparator}]+$`, 'g');
  const normalizedPhrase = phrase.replace(sepRegex, '').trim().toUpperCase();

  // Each repeat unit has the phrase followed by the separator with matching space padding
  const unitText = `${normalizedPhrase} ${cleanSeparator} `;

  // Determine optimal repeat count to fill the circle evenly
  let repeats = explicitRepeats;
  if (!repeats || repeats < 1) {
    if (unitText.length <= 18) {
      repeats = 3;
    } else {
      repeats = 2;
    }
  }

  const fullText = unitText.repeat(repeats);

  return {
    fullText,
    unitText,
    repeats,
    separator: cleanSeparator,
    characterCount: fullText.length,
  };
}

/**
 * Unicode range for complex scripts where SVG textPath bending
 * breaks cursive ligatures, conjuncts, and glyph shaping.
 */
export const COMPLEX_SCRIPTS_REGEX =
  /[\u0600-\u08FF\u0900-\u0DFF\u0E00-\u0E7F\u0E80-\u0EFF\u0F00-\u0FFF\u1000-\u109F\u1780-\u17FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Checks whether text contains complex scripts that should fall back
 * to a clean static horizontal pill rather than distorted path glyphs.
 */
export function isComplexScript(text: string): boolean {
  return COMPLEX_SCRIPTS_REGEX.test(text);
}

/**
 * Unicode range for Right-to-Left scripts (Arabic, Hebrew, Syriac, Thaana).
 */
export const RTL_SCRIPTS_REGEX = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFC]/;

export function isRtlScript(text: string): boolean {
  return RTL_SCRIPTS_REGEX.test(text);
}

/**
 * Page routes where decorative trust badges should be suppressed
 * to avoid visual noise and cart distraction.
 */
export const NOISY_ROUTES = ['/checkout', '/cart', '/account', '/login'];

export function isNoisyRoute(pathname?: string | null): boolean {
  if (!pathname) return false;
  return NOISY_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
