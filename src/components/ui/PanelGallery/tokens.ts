/**
 * Design tokens, mathematical utilities, and layout validators for PanelGallery.
 * Calibrated for calm, precise motion in the matte aesthetic.
 */

import { PanelGalleryMotionTokens } from './types';

export const PANEL_GALLERY_TOKENS = {
  /** Flex grow multiplier for the active/expanded panel */
  expandedGrow: 5,

  /** Flex grow multiplier for inactive/compressed panels */
  compressedGrow: 1,

  /** Transition duration for flex-grow expansion in seconds */
  duration: 0.6,

  /** Smooth cubic-bezier curve without overshoot/bounce: [0.65, 0, 0.35, 1] */
  ease: [0.65, 0, 0.35, 1] as const,

  /** Hover intent debounce delay in milliseconds */
  hoverIntentDelay: 90,

  /** Delay before returning to default active panel when pointer leaves the row in milliseconds */
  returnDelay: 350,

  /** Compressed vertical label fade-out duration in seconds */
  textExitDuration: 0.12,

  /** Expanded content entrance duration (fade and rise 8-12px) in seconds */
  textEnterDuration: 0.35,

  /** Delay before expanded content fades in to avoid squeezing mid-animation */
  textEnterDelay: 0.15,

  /** Drawing underline animation duration in seconds */
  underlineDuration: 0.4,

  /** Stagger delay between panels during initial view reveal in seconds */
  revealStagger: 0.08,

  /** Duration of initial entrance reveal per panel in seconds */
  revealDuration: 0.6,

  /** Minimum supported panels for standard gallery layout */
  minPanels: 4,

  /** Maximum displayed panels on desktop */
  maxPanels: 6,

  /** Absolute minimum width for a compressed desktop panel before switching to accordion (px) */
  minCompressedWidthDesktop: 72,

  /** Ideal minimum width for compressed panel in comfortable desktop views (px) */
  recommendedMinCompressedWidth: 88,

  /** Desktop fixed row height clamp */
  rowHeightDesktop: 'clamp(440px, 72svh, 660px)',

  /** Inter-panel gap in px */
  panelGapDesktop: 10,

  /** Mobile accordion collapsed panel height (comfortable tap target) */
  accordionCollapsedHeight: '84px',

  /** Mobile accordion minimum tap target height in px */
  minTapTargetHeight: 56,

  /** Mobile accordion expanded panel height using svh units */
  accordionExpandedHeight: '52svh',

  /** Maximum width in px for expanded text block to prevent reflow */
  fixedTextWidth: 380,

  /** Active panel dark matte gradient overlay opacity */
  activeOverlayOpacity: 0.38,

  /** Inactive panel dark matte gradient overlay opacity */
  inactiveOverlayOpacity: 0.76,

  /** Card border radius in px */
  borderRadius: 16,
} as const satisfies PanelGalleryMotionTokens & Record<string, any>;

/**
 * Validates panel array size and returns layout adaptation recommendation.
 */
export function validatePanelCount(count: number): {
  isValidRange: boolean;
  isTooFew: boolean;
  isTooMany: boolean;
  displayedCount: number;
  message?: string;
} {
  if (count < PANEL_GALLERY_TOKENS.minPanels) {
    return {
      isValidRange: false,
      isTooFew: true,
      isTooMany: false,
      displayedCount: count,
      message: `[PanelGallery] Received ${count} panels. With 3 or fewer, an equal-width grid layout is recommended for visual balance.`,
    };
  }

  if (count > PANEL_GALLERY_TOKENS.maxPanels) {
    return {
      isValidRange: false,
      isTooFew: false,
      isTooMany: true,
      displayedCount: PANEL_GALLERY_TOKENS.maxPanels,
      message: `[PanelGallery] Received ${count} panels. Maximum desktop capacity is 6; showing 6 with a "View all" link.`,
    };
  }

  return {
    isValidRange: true,
    isTooFew: false,
    isTooMany: false,
    displayedCount: count,
  };
}

/**
 * Computes theoretical pixel width of the expanded panel given container dimensions.
 * Formula: availableWidth * (expandedGrow / totalGrowUnits)
 */
export function computeExpandedWidth(
  containerWidth: number,
  panelCount: number,
  gap: number = PANEL_GALLERY_TOKENS.panelGapDesktop,
  expandedGrow: number = PANEL_GALLERY_TOKENS.expandedGrow,
  compressedGrow: number = PANEL_GALLERY_TOKENS.compressedGrow
): number {
  if (containerWidth <= 0 || panelCount <= 0) return 0;
  const count = Math.min(PANEL_GALLERY_TOKENS.maxPanels, Math.max(1, panelCount));
  const totalGaps = (count - 1) * gap;
  const availableWidth = Math.max(0, containerWidth - totalGaps);
  const totalUnits = expandedGrow + (count - 1) * compressedGrow;
  return Math.round((availableWidth * expandedGrow) / totalUnits);
}

/**
 * Computes theoretical pixel width of a compressed panel given container dimensions.
 * Formula: availableWidth * (compressedGrow / totalGrowUnits)
 */
export function computeCompressedWidth(
  containerWidth: number,
  panelCount: number,
  gap: number = PANEL_GALLERY_TOKENS.panelGapDesktop,
  expandedGrow: number = PANEL_GALLERY_TOKENS.expandedGrow,
  compressedGrow: number = PANEL_GALLERY_TOKENS.compressedGrow
): number {
  if (containerWidth <= 0 || panelCount <= 0) return 0;
  const count = Math.min(PANEL_GALLERY_TOKENS.maxPanels, Math.max(1, panelCount));
  const totalGaps = (count - 1) * gap;
  const availableWidth = Math.max(0, containerWidth - totalGaps);
  const totalUnits = expandedGrow + (count - 1) * compressedGrow;
  return Math.round((availableWidth * compressedGrow) / totalUnits);
}

/**
 * Determines whether container width can comfortably fit the compressed panels on desktop.
 */
export function canFitDesktopRow(
  containerWidth: number,
  panelCount: number,
  minCompressedWidth: number = PANEL_GALLERY_TOKENS.minCompressedWidthDesktop,
  gap: number = PANEL_GALLERY_TOKENS.panelGapDesktop
): boolean {
  if (containerWidth <= 0) return false;
  const compressed = computeCompressedWidth(containerWidth, panelCount, gap);
  return compressed >= minCompressedWidth;
}

/**
 * Formats 0-indexed integer into two-digit string ("01", "02", etc.)
 */
export function formatCategoryIndex(index: number): string {
  const num = index + 1;
  return num < 10 ? `0${num}` : String(num);
}

/**
 * Clamps single-line description to approximately max characters.
 */
export function clampDescription(text?: string, maxLength: number = 80): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}
