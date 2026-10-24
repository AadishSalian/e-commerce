import { EngravingZone, EngravingFont, MonogramLayout } from './types';

export interface FittedTextResult {
  lines: string[];
  fontSize: number; // in viewBox or percentage units
  totalHeight: number;
  fits: boolean;
  overflowMessage?: string;
  lineHeights: number[];
  yOffsets: number[];
}

/**
 * Approximate character width ratio relative to font size (em)
 * Monospace is ~0.6, Serif is ~0.52, Sans is ~0.50, Script is ~0.45
 */
function getCharWidthRatio(font: EngravingFont): number {
  if (font.id === 'technical-mono') return 0.62;
  if (font.id === 'heritage-slab') return 0.60;
  if (font.id === 'classic-serif') return 0.54;
  if (font.id === 'architect-script') return 0.46;
  return 0.50; // modern-sans
}

/**
 * Calculates letter spacing in px relative to font size
 */
function parseLetterSpacingEm(spacingStr: string, fontSize: number): number {
  const match = spacingStr.match(/([\d.]+)em/);
  if (match) {
    return parseFloat(match[1]) * fontSize;
  }
  return 0.1 * fontSize;
}

/**
 * Pure auto-fit calculation: Shrinks font size within [min_size, max_size] to fit zone width & height.
 * If text cannot fit even at min_size, fits = false.
 */
export function calculateAutoFitText(
  lines: string[],
  zone: EngravingZone,
  font: EngravingFont,
  containerBoxWidth: number, // virtual SVG viewBox width (e.g. 500)
  containerBoxHeight: number // virtual SVG viewBox height (e.g. 200)
): FittedTextResult {
  const nonEmptyLines = lines.length === 0 ? [''] : lines;
  const ratio = getCharWidthRatio(font);

  let optimalSize = font.max_size;
  const minSize = font.min_size;
  const step = 0.5;

  let fits = false;

  for (let size = optimalSize; size >= minSize; size -= step) {
    const spacingPx = parseLetterSpacingEm(font.letter_spacing, size);
    let maxLineWidth = 0;

    for (const line of nonEmptyLines) {
      const charCount = line.length;
      if (charCount === 0) continue;
      const lineWidth = charCount * (size * ratio) + (charCount - 1) * spacingPx;
      if (lineWidth > maxLineWidth) {
        maxLineWidth = lineWidth;
      }
    }

    const lineHeight = size * 1.35;
    const totalBlockHeight = nonEmptyLines.length * lineHeight;

    // Must fit with 6% safety margin
    if (maxLineWidth <= containerBoxWidth * 0.94 && totalBlockHeight <= containerBoxHeight * 0.94) {
      optimalSize = size;
      fits = true;
      break;
    }
  }

  // If even minSize didn't satisfy bounds
  if (!fits) {
    optimalSize = minSize;
    // Check if definitely overflowing
    const spacingPx = parseLetterSpacingEm(font.letter_spacing, minSize);
    const maxChars = Math.max(...nonEmptyLines.map((l) => l.length));
    const widthAtMin = maxChars * (minSize * ratio) + (maxChars - 1) * spacingPx;
    if (widthAtMin > containerBoxWidth * 0.94) {
      return {
        lines: nonEmptyLines,
        fontSize: minSize,
        totalHeight: nonEmptyLines.length * minSize * 1.35,
        fits: false,
        overflowMessage: 'That’s the most that fits on this side',
        lineHeights: nonEmptyLines.map(() => minSize * 1.35),
        yOffsets: computeYOffsets(nonEmptyLines, minSize, containerBoxHeight)
      };
    }
  }

  return {
    lines: nonEmptyLines,
    fontSize: optimalSize,
    totalHeight: nonEmptyLines.length * optimalSize * 1.35,
    fits: true,
    lineHeights: nonEmptyLines.map(() => optimalSize * 1.35),
    yOffsets: computeYOffsets(nonEmptyLines, optimalSize, containerBoxHeight)
  };
}

function computeYOffsets(lines: string[], fontSize: number, boxHeight: number): number[] {
  const lineHeight = fontSize * 1.35;
  const totalHeight = lines.length * lineHeight;
  const startY = (boxHeight - totalHeight) / 2 + fontSize; // baseline adjustment

  return lines.map((_, i) => startY + i * lineHeight);
}

/**
 * Format monogram text according to the selected layout
 * Traditional: First initial, LAST initial (prominent center), Middle initial
 * e.g. "JFK" -> Left: "J", Center: "K" (larger), Right: "F"
 */
export interface MonogramLayoutData {
  layout: MonogramLayout;
  letters: {
    char: string;
    isPrimary: boolean;
    scale: number;
    role: string;
  }[];
  displayText: string;
}

export function formatMonogramText(
  rawInitials: string,
  layout: MonogramLayout
): MonogramLayoutData {
  const cleaned = rawInitials.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3);

  if (layout === 'single') {
    const char = cleaned.slice(0, 1) || 'M';
    return {
      layout: 'single',
      letters: [{ char, isPrimary: true, scale: 1.0, role: 'Initial' }],
      displayText: char
    };
  }

  if (layout === 'stacked') {
    const chars = cleaned.slice(0, 3) || 'AB';
    return {
      layout: 'stacked',
      letters: chars.split('').map((char, i) => ({
        char,
        isPrimary: i === 0,
        scale: 0.85,
        role: `Line ${i + 1}`
      })),
      displayText: chars.split('').join('\n')
    };
  }

  // Traditional Monogram: First, LAST, Middle
  // e.g. 3 letters: [0] = First Name, [1] = Last Name, [2] = Middle Name
  if (cleaned.length >= 3) {
    const first = cleaned[0];
    const last = cleaned[1]; // Center large initial
    const middle = cleaned[2];
    return {
      layout: 'traditional',
      letters: [
        { char: first, isPrimary: false, scale: 0.72, role: 'First Name' },
        { char: last, isPrimary: true, scale: 1.35, role: 'Last Name (Center)' },
        { char: middle, isPrimary: false, scale: 0.72, role: 'Middle Name' }
      ],
      displayText: `${first}${last}${middle}`
    };
  } else if (cleaned.length === 2) {
    return {
      layout: 'traditional',
      letters: [
        { char: cleaned[0], isPrimary: false, scale: 0.85, role: 'First Initial' },
        { char: cleaned[1], isPrimary: true, scale: 1.2, role: 'Last Initial' }
      ],
      displayText: cleaned
    };
  }

  return {
    layout: 'traditional',
    letters: [{ char: cleaned || 'M', isPrimary: true, scale: 1.0, role: 'Initial' }],
    displayText: cleaned || 'M'
  };
}

/**
 * Generate CSS transform string for skew, rotation, and perspective
 */
export function buildZoneTransformCss(zone: EngravingZone): string {
  const { rotation, skewX, skewY, perspective } = zone.geometry;
  const parts: string[] = [];

  if (perspective) {
    parts.push(`perspective(${perspective}px)`);
  }
  if (rotation) {
    parts.push(`rotate(${rotation}deg)`);
  }
  if (skewX) {
    parts.push(`skewX(${skewX}deg)`);
  }
  if (skewY) {
    parts.push(`skewY(${skewY}deg)`);
  }

  return parts.length > 0 ? parts.join(' ') : 'none';
}
