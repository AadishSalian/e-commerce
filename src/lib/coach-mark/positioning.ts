import { CardPlacement, Rect, TourPlacement } from './types';

export const TARGET_PADDING = 6;
export const CARD_MARGIN = 12;
export const ARROW_SIZE = 8;
export const DEFAULT_CARD_WIDTH = 310;
export const DEFAULT_CARD_HEIGHT = 160;

/**
 * Computes the padded cutout rectangle for a given DOM element.
 */
export function computeCutoutRect(
  element: HTMLElement | null,
  padding: number = TARGET_PADDING
): Rect {
  if (!element || typeof window === 'undefined') {
    return { x: 0, y: 0, width: 0, height: 0, rx: 8 };
  }

  const b = element.getBoundingClientRect();
  const style = typeof window.getComputedStyle === 'function' ? window.getComputedStyle(element) : null;
  
  // Extract border radius if available
  let rx = 8;
  const rawRadius = style ? parseFloat(style.borderRadius) : NaN;
  if (!isNaN(rawRadius) && rawRadius > 0) {
    rx = Math.min(Math.max(rawRadius, 6), 24);
  }

  // Check if element is a circle or pill (e.g. icon button)
  if (Math.abs(b.width - b.height) < 4 && rawRadius >= b.width / 2 - 2) {
    rx = (b.width + padding * 2) / 2;
  }

  return {
    x: Math.max(0, b.left - padding),
    y: Math.max(0, b.top - padding),
    width: b.width + padding * 2,
    height: b.height + padding * 2,
    rx,
  };
}

export interface PlacementOptions {
  preferredPlacement: TourPlacement;
  cardWidth?: number;
  cardHeight?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  isRTL?: boolean;
}

/**
 * Computes the optimal position of the tooltip card relative to the target cutout,
 * performing collision detection, flipping, edge shifting, and mobile bottom-docking.
 */
export function computeCardPlacement(
  targetRect: Rect,
  options: PlacementOptions
): CardPlacement {
  const vw = options.viewportWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1024);
  const vh = options.viewportHeight ?? (typeof window !== 'undefined' ? window.innerHeight : 768);
  const width = options.cardWidth ?? DEFAULT_CARD_WIDTH;
  const height = options.cardHeight ?? DEFAULT_CARD_HEIGHT;
  const isRTL = options.isRTL ?? false;
  // Mirror horizontal preference in RTL languages
  const preferred = isRTL
    ? options.preferredPlacement === 'left'
      ? 'right'
      : options.preferredPlacement === 'right'
      ? 'left'
      : options.preferredPlacement || 'bottom'
    : options.preferredPlacement || 'bottom';

  // Narrow screen or short viewport mobile check
  // If screen width is mobile (< 640px) or height is very constrained (< 540px),
  // and placement would cause overlap or severe clipping, dock card at bottom
  const isMobile = vw < 640 || vh < 540;
  const fitsBeside =
    (preferred === 'bottom' && targetRect.y + targetRect.height + height + CARD_MARGIN <= vh - 60) ||
    (preferred === 'top' && targetRect.y - height - CARD_MARGIN >= CARD_MARGIN);

  if (isMobile && !fitsBeside) {
    return {
      top: vh - height - 76, // above bottom navigation tab bar + safe area
      left: Math.max(CARD_MARGIN, (vw - width) / 2),
      placement: 'bottom',
      arrowOffset: width / 2,
      isBottomDocked: true,
    };
  }

  let finalPlacement: TourPlacement = preferred;
  let top = 0;
  let left = 0;

  // Flip logic
  if (preferred === 'bottom') {
    const bottomPos = targetRect.y + targetRect.height + CARD_MARGIN;
    if (bottomPos + height > vh - CARD_MARGIN) {
      const topPos = targetRect.y - height - CARD_MARGIN;
      if (topPos >= CARD_MARGIN) {
        finalPlacement = 'top';
        top = topPos;
      } else {
        // Neither fits comfortably: dock to bottom
        if (isMobile) {
          return {
            top: vh - height - 76,
            left: Math.max(CARD_MARGIN, (vw - width) / 2),
            placement: 'bottom',
            arrowOffset: width / 2,
            isBottomDocked: true,
          };
        }
        finalPlacement = 'bottom';
        top = bottomPos;
      }
    } else {
      top = bottomPos;
    }
  } else if (preferred === 'top') {
    const topPos = targetRect.y - height - CARD_MARGIN;
    if (topPos < CARD_MARGIN) {
      finalPlacement = 'bottom';
      top = targetRect.y + targetRect.height + CARD_MARGIN;
    } else {
      top = topPos;
    }
  } else if (preferred === 'right') {
    const rightPos = targetRect.x + targetRect.width + CARD_MARGIN;
    if (rightPos + width > vw - CARD_MARGIN) {
      finalPlacement = 'left';
      left = targetRect.x - width - CARD_MARGIN;
    } else {
      left = rightPos;
    }
  } else if (preferred === 'left') {
    const leftPos = targetRect.x - width - CARD_MARGIN;
    if (leftPos < CARD_MARGIN) {
      finalPlacement = 'right';
      left = targetRect.x + targetRect.width + CARD_MARGIN;
    } else {
      left = leftPos;
    }
  }

  // Cross-axis positioning and edge clamping
  if (finalPlacement === 'top' || finalPlacement === 'bottom') {
    // Center card horizontally on target center
    const targetCenterX = targetRect.x + targetRect.width / 2;
    left = targetCenterX - width / 2;

    // Clamp horizontally to stay within viewport with margin
    if (left < CARD_MARGIN) {
      left = CARD_MARGIN;
    } else if (left + width > vw - CARD_MARGIN) {
      left = vw - width - CARD_MARGIN;
    }

    // Compute arrow offset pointing directly at target center
    const arrowOffset = Math.max(20, Math.min(width - 20, targetCenterX - left));

    return {
      top: Math.max(CARD_MARGIN, Math.min(vh - height - CARD_MARGIN, top)),
      left,
      placement: finalPlacement,
      arrowOffset,
      isBottomDocked: false,
    };
  } else {
    // Left or right placement
    const targetCenterY = targetRect.y + targetRect.height / 2;
    top = targetCenterY - height / 2;

    // Clamp vertically
    if (top < CARD_MARGIN) {
      top = CARD_MARGIN;
    } else if (top + height > vh - CARD_MARGIN) {
      top = vh - height - CARD_MARGIN;
    }

    const arrowOffset = Math.max(20, Math.min(height - 20, targetCenterY - top));

    return {
      top,
      left: Math.max(CARD_MARGIN, Math.min(vw - width - CARD_MARGIN, left)),
      placement: finalPlacement,
      arrowOffset,
      isBottomDocked: false,
    };
  }
}

/**
 * Builds an SVG path string for a full-screen backdrop with a rounded cutout hole
 * using fill-rule="evenodd".
 * Counter-clockwise inner hole ensures standard SVG evenodd winding.
 */
export function buildCutoutSvgPath(vw: number, vh: number, rect: Rect): string {
  const { x, y, width: w, height: h, rx: rawRx } = rect;
  const rx = Math.min(rawRx, w / 2, h / 2);

  // Outer full-screen rectangle (clockwise)
  const outer = `M 0 0 H ${vw} V ${vh} H 0 Z`;

  if (w <= 0 || h <= 0) {
    return outer;
  }

  // Inner cutout rectangle with rounded corners (counter-clockwise)
  const inner = [
    `M ${x + rx} ${y}`,
    `H ${x + w - rx}`,
    `A ${rx} ${rx} 0 0 1 ${x + w} ${y + rx}`,
    `V ${y + h - rx}`,
    `A ${rx} ${rx} 0 0 1 ${x + w - rx} ${y + h}`,
    `H ${x + rx}`,
    `A ${rx} ${rx} 0 0 1 ${x} ${y + h - rx}`,
    `V ${y + rx}`,
    `A ${rx} ${rx} 0 0 1 ${x + rx} ${y}`,
    'Z',
  ].join(' ');

  return `${outer} ${inner}`;
}
